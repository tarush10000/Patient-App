import mongoose from 'mongoose';

const BlockedSlotSchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true
    },
    timeSlot: {
        type: String,
        required: true
    },
    reason: {
        type: String,
        required: true
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

// Compound index to prevent duplicate blocked slots
BlockedSlotSchema.index({ date: 1, timeSlot: 1 }, { unique: true });

export default mongoose.models.BlockedSlot || mongoose.model('BlockedSlot', BlockedSlotSchema);