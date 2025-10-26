import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import whatsBoostService from '@/lib/whatsboost';

export async function POST(request) {
    try {
        await connectDB();

        const appointmentData = await request.json();

        // Validate required fields for guest appointment
        const { fullName, phone, appointmentDate, timeSlot, consultationType } = appointmentData;

        if (!fullName || !phone || !appointmentDate || !timeSlot || !consultationType) {
            return NextResponse.json(
                { error: 'All required fields must be filled' },
                { status: 400 }
            );
        }

        // Parse appointment date and time
        const appointmentDateTime = new Date(appointmentDate);
        const [slotTime, period] = timeSlot.split(' - ')[0].split(' ');
        const [slotHours, slotMinutes] = slotTime.split(':').map(Number);

        let hours = slotHours;
        if (period === 'PM' && slotHours !== 12) hours += 12;
        if (period === 'AM' && slotHours === 12) hours = 0;

        appointmentDateTime.setHours(hours, slotMinutes, 0, 0);

        // Check if appointment is within 2 hours from now
        const now = new Date();
        const diffMs = appointmentDateTime - now;
        const diffHours = diffMs / (1000 * 60 * 60);

        if (diffHours < 2) {
            return NextResponse.json(
                { error: 'Appointments must be booked at least 2 hours in advance. Please choose a later time slot.' },
                { status: 400 }
            );
        }

        const appointmentDay = new Date(appointmentDate);
        appointmentDay.setHours(0, 0, 0, 0);
        const nextDay = new Date(appointmentDay);
        nextDay.setDate(nextDay.getDate() + 1);

        const existingAppointment = await Appointment.findOne({
            phone: phone,
            appointmentDate: {
                $gte: appointmentDay,
                $lt: nextDay
            },
            status: { $ne: 'cancelled' }
        });

        if (existingAppointment) {
            return NextResponse.json(
                { error: 'You already have an appointment scheduled for this day. Please choose a different date or cancel your existing appointment.' },
                { status: 409 }
            );
        }

        // Define slot capacities
        const slotCapacities = {
            '10:30 AM - 11:30 AM': 4,
            '11:30 AM - 12:30 PM': 4,
            '12:30 PM - 1:30 PM': 4,
            '1:30 PM - 2:00 PM': 2,
            '4:30 PM - 5:30 PM': 4,
            '5:30 PM - 6:00 PM': 2
        };

        const capacity = slotCapacities[timeSlot] || 1;

        // Count existing appointments for this slot
        const existingCount = await Appointment.countDocuments({
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status: { $in: ['upcoming', 'seen'] }
        });

        if (existingCount >= capacity) {
            return NextResponse.json(
                { error: 'This time slot is fully booked. Please select another time slot.' },
                { status: 409 }
            );
        }

        // Create guest appointment WITHOUT patientId
        const appointment = await Appointment.create({
            fullName,
            phone,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            consultationType,
            additionalMessage: appointmentData.additionalMessage || '',
            isGuest: true,
            status: 'upcoming'
            // patientId is NOT included - it will be null/undefined
        });

        // Send appointment confirmation message via WhatsBoost
        try {
            const appointmentDateObj = new Date(appointmentDate);
            const formattedDate = appointmentDateObj.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            await whatsBoostService.sendAppointmentConfirmation(phone, {
                patientName: fullName,
                date: formattedDate,
                timeSlot: timeSlot,
                consultationType: consultationType.replace(/-/g, ' ').replace(/\b\w/g, l => l.toUpperCase())
            });
        } catch (messageError) {
            console.error('Failed to send appointment confirmation message:', messageError);
            // Don't fail the appointment creation if message fails
        }

        return NextResponse.json({
            success: true,
            message: 'Appointment created successfully',
            appointment: {
                id: appointment._id,
                bookingId: appointment.bookingId,
                fullName,
                phone,
                appointmentDate,
                timeSlot,
                consultationType
            }
        });

    } catch (error) {
        console.error('Guest appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to create appointment' },
            { status: 500 }
        );
    }
}