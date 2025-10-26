import { NextResponse } from 'next/server';
import { authenticate } from '@/middleware/auth';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import whatsBoostService from '@/lib/whatsboost';

export async function PATCH(request, { params }) {
    try {
        const authResult = await authenticate(request);
        if (authResult.error) {
            return NextResponse.json({ error: authResult.error }, { status: authResult.status });
        }

        const { user } = authResult;

        // Only admin and reception can delay appointments
        if (user.role !== 'admin' && user.role !== 'reception') {
            return NextResponse.json(
                { error: 'Only staff can delay appointments' },
                { status: 403 }
            );
        }

        await connectDB();
        const { id } = await params;
        const { delayMinutes } = await request.json();

        if (!delayMinutes || delayMinutes <= 0) {
            return NextResponse.json(
                { error: 'Invalid delay time' },
                { status: 400 }
            );
        }

        const appointment = await Appointment.findById(id).populate('patientId');

        if (!appointment) {
            return NextResponse.json({ error: 'Appointment not found' }, { status: 404 });
        }

        // Parse the current time slot to get the ACTUAL appointment time
        const oldTimeSlot = appointment.timeSlot;

        // Count how many appointments were BEFORE this one in the same slot
        const appointmentsBefore = await Appointment.countDocuments({
            appointmentDate: appointment.appointmentDate,
            timeSlot: appointment.timeSlot,
            createdAt: { $lt: appointment.createdAt },
            status: { $in: ['upcoming', 'seen'] }
        });

        // Calculate the OLD actual appointment time based on queue position
        const [oldStartTime, oldPeriod] = oldTimeSlot.split(' - ')[0].split(' ');
        const [oldHours, oldMinutes] = oldStartTime.split(':').map(Number);

        let oldTotalMinutes = oldHours * 60 + oldMinutes + (appointmentsBefore * 15);
        if (oldPeriod === 'PM' && oldHours !== 12) oldTotalMinutes += 12 * 60;
        if (oldPeriod === 'AM' && oldHours === 12) oldTotalMinutes -= 12 * 60;

        const oldActualHours = Math.floor(oldTotalMinutes / 60) % 24;
        const oldActualMinutes = oldTotalMinutes % 60;
        const oldActualPeriod = oldActualHours >= 12 ? 'PM' : 'AM';
        const oldDisplayHours = oldActualHours > 12 ? oldActualHours - 12 : (oldActualHours === 0 ? 12 : oldActualHours);
        const oldActualTime = `${oldDisplayHours}:${oldActualMinutes.toString().padStart(2, '0')} ${oldActualPeriod}`;

        // Calculate NEW time by adding delay to the actual appointment time
        const newTotalMinutes = oldTotalMinutes + delayMinutes;

        const newHours = Math.floor(newTotalMinutes / 60) % 24;
        const newMinutes = newTotalMinutes % 60;
        const newPeriod = newHours >= 12 ? 'PM' : 'AM';
        const displayHours = newHours > 12 ? newHours - 12 : (newHours === 0 ? 12 : newHours);

        const newStartTime = `${displayHours}:${newMinutes.toString().padStart(2, '0')} ${newPeriod}`;

        // Calculate new end time (15 minutes after start)
        const endTotalMinutes = newTotalMinutes + 15;
        const endHours = Math.floor(endTotalMinutes / 60) % 24;
        const endMins = endTotalMinutes % 60;
        const endPeriod = endHours >= 12 ? 'PM' : 'AM';
        const endDisplayHours = endHours > 12 ? endHours - 12 : (endHours === 0 ? 12 : endHours);
        const newEndTime = `${endDisplayHours}:${endMins.toString().padStart(2, '0')} ${endPeriod}`;

        const newTimeSlot = `${newStartTime} - ${newEndTime}`;

        // Update appointment
        appointment.timeSlot = newTimeSlot;
        await appointment.save();

        // Send reschedule notification via WhatsApp with ACTUAL times
        try {
            const formattedDate = new Date(appointment.appointmentDate).toLocaleDateString('en-IN', {
                day: 'numeric',
                month: 'long',
                year: 'numeric'
            });
            await whatsBoostService.sendAppointmentReschedule(
                appointment.phone,
                {
                    patientName: appointment.fullName,
                    oldDate: formattedDate,
                    oldTimeSlot: oldActualTime,  // Use calculated actual time
                    newDate: formattedDate,
                    newTimeSlot: newStartTime    // Use the new actual time
                }
            );
        } catch (msgError) {
            console.error('Failed to send reschedule notification:', msgError);
            // Don't fail the request if messaging fails
        }

        return NextResponse.json({
            message: 'Appointment delayed successfully',
            appointment: {
                ...appointment.toObject(),
                patientId: appointment.patientId._id
            }
        });

    } catch (error) {
        console.error('Delay appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to delay appointment' },
            { status: 500 }
        );
    }
}