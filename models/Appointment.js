import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: false
    },
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        trim: true
    },
    appointmentDate: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    consultationType: {
        type: String,
        required: true,
        enum: ['routine-checkup', 'prenatal-care', 'postnatal-care', 'gynecological-exam', 'consultation', 'follow-up']
    },
    additionalMessage: {
        type: String,
        default: ''
    },
    status: {
        type: String,
        enum: ['upcoming', 'seen', 'cancelled'],
        default: 'upcoming'
    },
    // Reminder tracking fields
    reminderSent: {
        type: Boolean,
        default: false
    },
    reminderSentAt: {
        type: Date,
        default: null
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    }
}, {
    timestamps: true
});

// Index for efficient querying of upcoming appointments needing reminders
AppointmentSchema.index({ status: 1, reminderSent: 1, appointmentDate: 1 });

// Index for finding appointments by phone and date
AppointmentSchema.index({ phone: 1, appointmentDate: 1 });

const Appointment = mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);

export default Appointment;