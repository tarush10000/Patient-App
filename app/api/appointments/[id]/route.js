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

        // Send appropriate messages based on status changes and appointment type
        try {
            const appointmentDateObj = new Date(appointment.appointmentDate);
            const formattedDate = appointmentDateObj.toLocaleDateString('en-IN', {
                weekday: 'long',
                year: 'numeric',
                month: 'long',
                day: 'numeric'
            });

            // For EMERGENCY appointments - only send thank you message when marked as seen
            if (appointment.isEmergency) {
                if (updates.status === 'seen' && oldStatus !== 'seen') {
                    await whatsBoostService.sendThankYouMessage(appointment.phone, {
                        patientName: appointment.fullName
                    });
                }
                // No other messages for emergency appointments
            } else {
                // For REGULAR appointments - send cancellation and thank you messages
                if (updates.status === 'cancelled' && oldStatus !== 'cancelled') {
                    await whatsBoostService.sendAppointmentCancellation(appointment.phone, {
                        patientName: appointment.fullName,
                        date: formattedDate,
                        timeSlot: appointment.timeSlot
                    });
                }

                if (updates.status === 'seen' && oldStatus !== 'seen') {
                    await whatsBoostService.sendThankYouMessage(appointment.phone, {
                        patientName: appointment.fullName
                    });
                }
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