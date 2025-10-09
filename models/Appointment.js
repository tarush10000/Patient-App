import mongoose from 'mongoose';

const AppointmentSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    fullName: {
        type: String,
        required: true
    },
    phone: {
        type: String,
        required: true
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
        enum: ['upcoming', 'completed', 'cancelled', 'no-show'],
        default: 'upcoming'
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    },
    updatedAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Index for efficient queries
AppointmentSchema.index({ patientId: 1, appointmentDate: 1 });
AppointmentSchema.index({ appointmentDate: 1, timeSlot: 1 });

export default mongoose.models.Appointment || mongoose.model('Appointment', AppointmentSchema);