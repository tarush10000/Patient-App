import mongoose from 'mongoose';

const OTPSchema = new mongoose.Schema({
    phone: {
        type: String,
        required: true
    },
    otp: {
        type: String,
        required: true
    },
    expiresAt: {
        type: Date,
        required: true,
        default: () => new Date(Date.now() + 10 * 60 * 1000) // 10 minutes
    },
    verified: {
        type: Boolean,
        default: false
    },
    createdAt: {
        type: Date,
        default: Date.now,
        expires: 600 // Document will be automatically deleted after 10 minutes
    }
});

OTPSchema.index({ phone: 1, createdAt: -1 });

export default mongoose.models.OTP || mongoose.model('OTP', OTPSchema);