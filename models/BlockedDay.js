import mongoose from 'mongoose';

const BlockedDaySchema = new mongoose.Schema({
    date: {
        type: Date,
        required: true,
        unique: true
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

export default mongoose.models.BlockedDay || mongoose.model('BlockedDay', BlockedDaySchema);