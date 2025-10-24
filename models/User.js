import mongoose from 'mongoose';

const UserSchema = new mongoose.Schema({
    fullName: {
        type: String,
        required: true,
        trim: true
    },
    phone: {
        type: String,
        required: true,
        unique: true,
        trim: true
    },
    role: {
        type: String,
        enum: ['patient', 'reception', 'admin'],
        default: 'patient'
    },
    isPhoneVerified: {
        type: Boolean,
        default: false
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

export default mongoose.models.User || mongoose.model('User', UserSchema);