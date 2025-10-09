import { NextResponse } from 'next/server';
import connectDB from '@/lib/mongodb';
import Appointment from '@/models/Appointment';
import BlockedSlot from '@/models/BlockedSlot';
import BlockedDay from '@/models/BlockedDay';

export async function GET(request) {
    try {
        await connectDB();

        const { searchParams } = new URL(request.url);
        const date = searchParams.get('date');

        if (!date) {
            return NextResponse.json(
                { error: 'Date parameter is required' },
                { status: 400 }
            );
        }

        const targetDate = new Date(date);
        targetDate.setHours(0, 0, 0, 0);

        // Check if entire day is blocked
        const blockedDay = await BlockedDay.findOne({ date: targetDate });

        if (blockedDay) {
            return NextResponse.json({
                available: false,
                reason: blockedDay.reason,
                slots: []
            });
        }

        // Define all possible time slots
        const allTimeSlots = [
            '10:30 AM - 11:30 AM',
            '11:30 AM - 12:30 PM',
            '12:30 PM - 1:30 PM',
            '1:30 PM - 2:00 PM',
            '4:30 PM - 5:30 PM',
            '5:30 PM - 6:00 PM'
        ];

        // Get booked appointments for this date
        const bookedAppointments = await Appointment.find({
            appointmentDate: targetDate,
            status: 'upcoming'
        }).select('timeSlot');

        // Get blocked slots for this date
        const blockedSlots = await BlockedSlot.find({
            date: targetDate
        }).select('timeSlot');

        const bookedTimeSlots = bookedAppointments.map(apt => apt.timeSlot);
        const blockedTimeSlots = blockedSlots.map(slot => slot.timeSlot);

        // Calculate available slots
        const availableSlots = allTimeSlots.filter(
            slot => !bookedTimeSlots.includes(slot) && !blockedTimeSlots.includes(slot)
        );

        return NextResponse.json({
            available: true,
            date: targetDate,
            totalSlots: allTimeSlots.length,
            availableSlots: availableSlots.length,
            slots: allTimeSlots.map(slot => ({
                time: slot,
                available: availableSlots.includes(slot),
                status: blockedTimeSlots.includes(slot) ? 'blocked' :
                    bookedTimeSlots.includes(slot) ? 'booked' : 'available'
            }))
        });

    } catch (error) {
        console.error('Get available slots error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch available slots' },
            { status: 500 }
        );
    }
}
