import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { authenticate, authorizeRoles } from '@/middleware/auth';

// PATCH update appointment
export async function PATCH(request, { params }) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;
        const { id } = params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Only patient who owns appointment, reception, or admin can update
        if (user.role === 'patient' && appointment.patientId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updates = await request.json();

        // Update appointment
        Object.assign(appointment, updates);
        appointment.updatedAt = new Date();
        await appointment.save();

        return NextResponse.json({
            message: 'Appointment updated successfully',
            appointment
        });

    } catch (error) {
        console.error('Update appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to update appointment' },
            { status: 500 }
        );
    }
}

// DELETE appointment
export async function DELETE(request, { params }) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        await connectDB();
        const { user } = authResult;
        const { id } = params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Only patient who owns appointment, reception, or admin can delete
        if (user.role === 'patient' && appointment.patientId.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        await appointment.deleteOne();

        return NextResponse.json({
            message: 'Appointment cancelled successfully'
        });

    } catch (error) {
        console.error('Delete appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to cancel appointment' },
            { status: 500 }
        );
    }
}