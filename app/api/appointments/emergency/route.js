import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

/**
 * POST - Create emergency appointment
 * Only admin and reception can create emergency appointments
 * No slot limits, no confirmation/reminder messages
 */
export async function POST(request) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;

        // Only admin and reception can create emergency appointments
        if (user.role !== 'admin' && user.role !== 'reception') {
            return NextResponse.json(
                { error: 'Only staff members can create emergency appointments' },
                { status: 403 }
            );
        }

        await connectDB();

        const appointmentData = await request.json();
        const { fullName, phone, appointmentDate, timeSlot, consultationType, additionalMessage } = appointmentData;

        // Validate required fields
        if (!fullName || !phone || !appointmentDate || !timeSlot || !consultationType) {
            return NextResponse.json(
                { error: 'Missing required fields' },
                { status: 400 }
            );
        }

        // Create emergency appointment - NO SLOT LIMITS
        const appointment = await Appointment.create({
            fullName,
            phone,
            appointmentDate: new Date(appointmentDate),
            timeSlot,
            consultationType,
            additionalMessage: additionalMessage || '',
            status: 'upcoming',
            isEmergency: true,  // Mark as emergency
            createdBy: user._id
        });

        // NO WhatsApp messages sent for emergency appointments

        return NextResponse.json({
            success: true,
            message: 'Emergency appointment created successfully',
            appointment
        }, { status: 201 });

    } catch (error) {
        console.error('Create emergency appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to create emergency appointment' },
            { status: 500 }
        );
    }
}