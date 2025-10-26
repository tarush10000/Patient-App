import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import whatsBoostService from '@/lib/whatsboost';

/**
 * API endpoint to check and send appointment reminders
 * This should be called by a cron job every 5-10 minutes
 */
export async function GET(request) {
    try {
        // Optional: Add authentication to prevent unauthorized access
        const authHeader = request.headers.get('authorization');
        const cronSecret = process.env.CRON_SECRET || 'your-secret-key-here';

        if (authHeader !== `Bearer ${cronSecret}`) {
            return NextResponse.json(
                { error: 'Unauthorized' },
                { status: 401 }
            );
        }

        await connectDB();

        // Get current time
        const now = new Date();

        // Calculate time range: 55 minutes to 65 minutes from now
        // This gives us a 10-minute window to catch appointments
        const reminderStart = new Date(now.getTime() + 55 * 60 * 1000);
        const reminderEnd = new Date(now.getTime() + 65 * 60 * 1000);

        // Find upcoming appointments in the reminder window that haven't been reminded yet
        const appointmentsToRemind = await Appointment.find({
            status: 'upcoming',
            reminderSent: { $ne: true }, // Only appointments that haven't been reminded
            appointmentDate: {
                $gte: reminderStart,
                $lte: reminderEnd
            }
        }).populate('patientId');

        console.log(`Found ${appointmentsToRemind.length} appointments to remind`);

        const results = [];
        const errors = [];

        // Send reminder for each appointment
        for (const appointment of appointmentsToRemind) {
            try {
                // Format appointment details
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

                // Send reminder via WhatsBoost
                const result = await whatsBoostService.sendAppointmentReminder(
                    appointment.phone,
                    {
                        patientName: appointment.fullName,
                        date: formattedDate,
                        timeSlot: appointment.timeSlot,
                        consultationType: consultationTypeFormatted
                    }
                );

                if (result.success) {
                    // Mark reminder as sent
                    appointment.reminderSent = true;
                    appointment.reminderSentAt = new Date();
                    await appointment.save();

                    results.push({
                        appointmentId: appointment._id,
                        patientName: appointment.fullName,
                        phone: appointment.phone,
                        timeSlot: appointment.timeSlot,
                        status: 'sent'
                    });

                    console.log(`✅ Reminder sent for appointment ${appointment._id}`);
                } else {
                    throw new Error(result.error || 'Failed to send reminder');
                }

            } catch (error) {
                console.error(`❌ Failed to send reminder for appointment ${appointment._id}:`, error);
                errors.push({
                    appointmentId: appointment._id,
                    patientName: appointment.fullName,
                    error: error.message
                });
            }
        }

        return NextResponse.json({
            success: true,
            message: `Processed ${appointmentsToRemind.length} appointments`,
            remindersSent: results.length,
            errors: errors.length,
            results,
            errors
        });

    } catch (error) {
        console.error('Reminder cron error:', error);
        return NextResponse.json(
            {
                success: false,
                error: 'Failed to process reminders',
                details: error.message
            },
            { status: 500 }
        );
    }
}

// Also support POST for manual triggering
export async function POST(request) {
    return GET(request);
}