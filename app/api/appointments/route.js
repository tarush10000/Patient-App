import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { authenticate } from '@/middleware/auth';
import whatsBoostService from '@/lib/whatsboost';

// GET all appointments for current user
export async function GET(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;

        let query = {};

        // Patients can only see their own appointments
        if (user.role === 'patient') {
            query.$or = [
                { patientId: user._id },
                { phone: user.phone }
            ];
        }
        // Reception and admin can see all appointments

        const appointments = await Appointment.find(query)
            .populate('patientId', 'fullName phone email')
            .sort({ appointmentDate: -1 });

        return NextResponse.json({ appointments });

    } catch (error) {
        console.error('Get appointments error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch appointments' },
            { status: 500 }
        );
    }
}

// POST create new appointment
export async function POST(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;

        const {
            fullName,
            phone,
            appointmentDate,
            timeSlot,
            consultationType,
            additionalMessage
        } = await request.json();

        // Validation
        if (!fullName || !phone || !appointmentDate || !timeSlot || !consultationType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
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

        // Create appointment
        const appointment = await Appointment.create({
            patientId: user._id,
            fullName,
            phone,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            consultationType,
            additionalMessage: additionalMessage || '',
            status: 'upcoming',
            createdBy: user._id
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
            message: 'Appointment booked successfully',
            appointment
        }, { status: 201 });

    } catch (error) {
        console.error('Create appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to book appointment' },
            { status: 500 }
        );
    }
}