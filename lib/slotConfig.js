/**
 * Centralized Slot Configuration
 * This file contains all slot-related configurations including capacities and durations.
 * Update this file to modify slot settings across the entire application.
 */

// Define all time slots with their capacities and durations (in minutes)
export const TIME_SLOTS = [
    { time: '10:30 AM - 11:30 AM', capacity: 4, duration: 60 },
    { time: '11:30 AM - 12:30 PM', capacity: 6, duration: 60 },
    { time: '12:30 PM - 1:30 PM', capacity: 6, duration: 60 },
    { time: '1:30 PM - 2:00 PM', capacity: 3, duration: 30 },
    { time: '4:30 PM - 5:30 PM', capacity: 6, duration: 60 },
    { time: '5:30 PM - 6:00 PM', capacity: 2, duration: 30 }
];

/**
 * Get slot configuration by time slot string
 * @param {string} timeSlot - Time slot string (e.g., "10:30 AM - 11:30 AM")
 * @returns {object|null} Slot configuration object or null if not found
 */
export function getSlotConfig(timeSlot) {
    return TIME_SLOTS.find(slot => slot.time === timeSlot) || null;
}

/**
 * Calculate the time gap between appointments in a slot
 * Formula: slot duration / slot capacity
 * @param {string} timeSlot - Time slot string
 * @returns {number} Time gap in minutes
 */
export function getSlotGap(timeSlot) {
    const config = getSlotConfig(timeSlot);
    if (!config) {
        return 15; // Default fallback
    }
    return Math.floor(config.duration / config.capacity);
}

/**
 * Get slot capacity
 * @param {string} timeSlot - Time slot string
 * @returns {number} Slot capacity
 */
export function getSlotCapacity(timeSlot) {
    const config = getSlotConfig(timeSlot);
    return config ? config.capacity : 1; // Default to 1 if not found
}

/**
 * Calculate actual appointment time based on slot start time and existing appointments
 * @param {string} timeSlot - Time slot string (e.g., "10:30 AM - 11:30 AM")
 * @param {number} existingCount - Number of existing appointments in this slot
 * @returns {string} Formatted appointment time (e.g., "10:30 AM")
 */
export function calculateAppointmentTime(timeSlot, existingCount) {
    const slotGap = getSlotGap(timeSlot);

    // Parse slot start time
    const [slotStartTime, slotPeriod] = timeSlot.split(' - ')[0].split(' ');
    const [startHours, startMinutes] = slotStartTime.split(':').map(Number);

    // Calculate total minutes from midnight
    let totalMinutes = startHours * 60 + startMinutes + (existingCount * slotGap);

    // Adjust for AM/PM
    if (slotPeriod === 'PM' && startHours !== 12) {
        totalMinutes += 12 * 60;
    }
    if (slotPeriod === 'AM' && startHours === 12) {
        totalMinutes -= 12 * 60;
    }

    // Convert back to hours and minutes
    const actualHours = Math.floor(totalMinutes / 60) % 24;
    const actualMinutes = totalMinutes % 60;

    // Format for display
    const actualPeriod = actualHours >= 12 ? 'PM' : 'AM';
    const displayHours = actualHours > 12 ? actualHours - 12 : (actualHours === 0 ? 12 : actualHours);

    return `${displayHours}:${actualMinutes.toString().padStart(2, '0')} ${actualPeriod}`;
}

/**
 * Get all time slots as a simple object map (for backward compatibility)
 * @returns {object} Object with time slot strings as keys and capacities as values
 */
export function getSlotCapacities() {
    const capacities = {};
    TIME_SLOTS.forEach(slot => {
        capacities[slot.time] = slot.capacity;
    });
    return capacities;
}
