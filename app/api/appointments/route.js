import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { authenticate } from '@/middleware/auth';

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
            query.patientId = user._id;
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

        // Check if slot is already booked
        const existingAppointment = await Appointment.findOne({
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            status: 'upcoming'
        });

        if (existingAppointment) {
            return NextResponse.json(
                { error: 'This time slot is already booked' },
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
