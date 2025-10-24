import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import { authenticate, authorizeRoles } from '@/middleware/auth';
import whatsBoostService from '@/lib/whatsboost';

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

        const appointment = await Appointment.findById(id).populate('patientId');

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Only patient who owns appointment, reception, or admin can update
        if (user.role === 'patient' && appointment.patientId._id.toString() !== user._id.toString()) {
            return NextResponse.json({ error: 'Unauthorized' }, { status: 403 });
        }

        const updates = await request.json();
        const oldStatus = appointment.status;

        // Update appointment
        Object.assign(appointment, updates);
        appointment.updatedAt = new Date();
        await appointment.save();

        // Send appropriate messages based on status changes
        try {
            const appointmentDateObj = new Date(appointment.appointmentDate);
            const formattedDate = appointmentDateObj.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // If status changed to 'cancelled', send cancellation message
            if (updates.status === 'cancelled' && oldStatus !== 'cancelled') {
                await whatsBoostService.sendAppointmentCancellation(appointment.phone, {
                    patientName: appointment.fullName,
                    date: formattedDate,
                    timeSlot: appointment.timeSlot
                });
            }

            // If status changed to 'seen', send thank you message
            if (updates.status === 'seen' && oldStatus !== 'seen') {
                await whatsBoostService.sendThankYouMessage(appointment.phone, {
                    patientName: appointment.fullName
                });
            }
        } catch (messageError) {
            console.error('Failed to send appointment message:', messageError);
            // Don't fail the update if message fails
        }

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

// DELETE appointment - ADMIN ONLY
export async function DELETE(request, { params }) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;

        // Only admins can delete appointments
        if (user.role !== 'admin') {
            return NextResponse.json(
                { error: 'Only administrators can delete appointments' },
                { status: 403 }
            );
        }

        await connectDB();
        const { id } = params;

        const appointment = await Appointment.findById(id);

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        await appointment.deleteOne();

        return NextResponse.json({
            message: 'Appointment deleted successfully'
        });

    } catch (error) {
        console.error('Delete appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to delete appointment' },
            { status: 500 }
        );
    }
}