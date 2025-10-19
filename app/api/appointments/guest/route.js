import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';

export async function POST(request) {
    try {
        await connectDB();

        const appointmentData = await request.json();

        // Validate required fields for guest appointment
        const { fullName, phone, appointmentDate, timeSlot, consultationType } = appointmentData;

        if (!fullName || !phone || !appointmentDate || !timeSlot || !consultationType) {
            return NextResponse.json(
                { error: 'All fields are required' },
                { status: 400 }
            );
        }

        // Create guest appointment
        const appointment = await Appointment.create({
            ...appointmentData,
            isGuest: true,
            status: 'pending'
        });

        return NextResponse.json({
            success: true,
            message: 'Appointment created successfully',
            appointment: {
                id: appointment._id,
                bookingId: appointment.bookingId,
                ...appointmentData
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