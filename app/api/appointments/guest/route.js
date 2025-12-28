import connectDB from '@/lib/mongodb';
import whatsBoostService from '@/lib/whatsboost';
import Appointment from '@/models/Appointment';
import { NextResponse } from 'next/server';

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

            // Calculate actual appointment time based on existing appointments
            // Formula: Actual Time = Slot Start Time + (15 × existing appointments count)
            const [slotStartTime, slotPeriod] = timeSlot.split(' - ')[0].split(' ');
            const [startHours, startMinutes] = slotStartTime.split(':').map(Number);

            let totalMinutes = startHours * 60 + startMinutes + (existingCount * 15);
            if (slotPeriod === 'PM' && startHours !== 12) totalMinutes += 12 * 60;
            if (slotPeriod === 'AM' && startHours === 12) totalMinutes -= 12 * 60;

            const actualHours = Math.floor(totalMinutes / 60) % 24;
            const actualMinutes = totalMinutes % 60;
            const actualPeriod = actualHours >= 12 ? 'PM' : 'AM';
            const displayHours = actualHours > 12 ? actualHours - 12 : (actualHours === 0 ? 12 : actualHours);

            const actualAppointmentTime = `${displayHours}:${actualMinutes.toString().padStart(2, '0')} ${actualPeriod}`;

            await whatsBoostService.sendAppointmentConfirmation(phone, {
                patientName: fullName,
                date: formattedDate,
                timeSlot: actualAppointmentTime,
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