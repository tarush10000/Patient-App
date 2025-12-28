import mongoose from 'mongoose';

const SystemLogSchema = new mongoose.Schema({
    timestamp: {
        type: Date,
        default: Date.now,
        required: true
    },
    status: {
        type: String,
        enum: ['healthy', 'degraded', 'down'],
        required: true
    },
    services: {
        mongodb: {
            status: { type: String, enum: ['up', 'down'], required: true },
            latency: { type: Number } // in ms, optional
        },
        whatsboost: {
            status: { type: String, enum: ['connected', 'disconnected', 'error'], required: true },
            details: { type: String }
        },
        auth: {
            status: { type: String, enum: ['secure', 'monitor'], required: true },
            details: { type: String }
        }
    },
    details: {
        type: mongoose.Schema.Types.Mixed // For storing flexible additional info
    }
});

// Auto-delete logs older than 30 days to save space
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 30 * 24 * 60 * 60 });

export default mongoose.models.SystemLog || mongoose.model('SystemLog', SystemLogSchema);
