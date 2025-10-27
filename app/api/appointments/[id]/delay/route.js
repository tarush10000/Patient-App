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

        // Don't send delay messages for emergency appointments
        if (appointment.isEmergency) {
            return NextResponse.json({
                message: 'Delay notification skipped for emergency appointment',
                appointment
            });
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

        // Calculate NEW time (OLD time + delay)
        let newTotalMinutes = oldTotalMinutes + delayMinutes;
        const newActualHours = Math.floor(newTotalMinutes / 60) % 24;
        const newActualMinutes = newTotalMinutes % 60;
        const newActualPeriod = newActualHours >= 12 ? 'PM' : 'AM';
        const newDisplayHours = newActualHours > 12 ? newActualHours - 12 : (newActualHours === 0 ? 12 : newActualHours);
        
        const newActualTime = `${newDisplayHours}:${newActualMinutes.toString().padStart(2, '0')} ${newActualPeriod}`;

        // Send delay notification via WhatsApp (only for non-emergency appointments)
        const appointmentDateObj = new Date(appointment.appointmentDate);
        const formattedDate = appointmentDateObj.toLocaleDateString('en-IN', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric'
        });

        const consultationTypeFormatted = appointment.consultationType
            .replace(/-/g, ' ')
            .replace(/\b\w/g, l => l.toUpperCase());

        try {
            await whatsBoostService.sendAppointmentDelay(
                appointment.phone,
                {
                    patientName: appointment.fullName,
                    date: formattedDate,
                    oldTime: oldActualTime,
                    newTime: newActualTime,
                    delayMinutes,
                    consultationType: consultationTypeFormatted
                }
            );
        } catch (messageError) {
            console.error('Failed to send delay message:', messageError);
            // Continue even if message fails
        }

        return NextResponse.json({
            message: 'Delay notification sent successfully',
            appointment,
            oldTime: oldActualTime,
            newTime: newActualTime
        });

    } catch (error) {
        console.error('Delay appointment error:', error);
        return NextResponse.json(
            { error: 'Failed to delay appointment' },
            { status: 500 }
        );
    }
}