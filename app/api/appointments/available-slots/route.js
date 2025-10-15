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

        // Check if it's Sunday (0 = Sunday in JavaScript)
        if (targetDate.getDay() === 0) {
            return NextResponse.json({
                available: false,
                reason: 'Clinic is closed on Sundays',
                slots: []
            });
        }

        // Check if entire day is blocked
        const blockedDay = await BlockedDay.findOne({
            date: {
                $gte: targetDate,
                $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            }
        });

        if (blockedDay) {
            return NextResponse.json({
                available: false,
                reason: blockedDay.reason,
                slots: []
            });
        }

        // Define all possible time slots with capacity
        const allTimeSlots = [
            { time: '10:30 AM - 11:30 AM', capacity: 4 },
            { time: '11:30 AM - 12:30 PM', capacity: 4 },
            { time: '12:30 PM - 1:30 PM', capacity: 4 },
            { time: '1:30 PM - 2:00 PM', capacity: 2 },
            { time: '4:30 PM - 5:30 PM', capacity: 4 },
            { time: '5:30 PM - 6:00 PM', capacity: 2 }
        ];

        // Get booked appointments for this date (only count upcoming and seen)
        const bookedAppointments = await Appointment.find({
            appointmentDate: {
                $gte: targetDate,
                $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            },
            status: { $in: ['upcoming', 'seen'] }
        }).select('timeSlot');

        // Get blocked slots for this date
        const blockedSlots = await BlockedSlot.find({
            date: {
                $gte: targetDate,
                $lt: new Date(targetDate.getTime() + 24 * 60 * 60 * 1000)
            }
        }).select('timeSlot');

        const blockedTimeSlots = blockedSlots.map(slot => slot.timeSlot);

        // Count bookings per slot
        const bookingCounts = {};
        bookedAppointments.forEach(apt => {
            bookingCounts[apt.timeSlot] = (bookingCounts[apt.timeSlot] || 0) + 1;
        });

        // Calculate available slots
        const slots = allTimeSlots.map(slot => {
            const booked = bookingCounts[slot.time] || 0;
            const available = slot.capacity - booked;
            const isBlocked = blockedTimeSlots.includes(slot.time);

            return {
                time: slot.time,
                capacity: slot.capacity,
                booked: booked,
                available: Math.max(0, available),
                status: isBlocked ? 'blocked' : (available > 0 ? 'available' : 'full')
            };
        });

        return NextResponse.json({
            available: true,
            date: targetDate,
            slots: slots
        });

    } catch (error) {
        console.error('Get available slots error:', error);
        return NextResponse.json(
            { error: 'Failed to fetch available slots' },
            { status: 500 }
        );
    }
}