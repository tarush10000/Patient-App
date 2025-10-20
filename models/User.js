import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

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
    pin: {
        type: String,
        required: true,
        validate: {
            validator: function(v) {
                return /^\d{6}$/.test(v); // Exactly 6 digits
            },
            message: 'PIN must be exactly 6 digits'
        }
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

// Hash PIN before saving
UserSchema.pre('save', async function (next) {
    if (!this.isModified('pin')) return next();

    try {
        const salt = await bcrypt.genSalt(10);
        this.pin = await bcrypt.hash(this.pin, salt);
        next();
    } catch (error) {
        next(error);
    }
});

// Compare PIN method
UserSchema.methods.comparePin = async function (candidatePin) {
    return await bcrypt.compare(candidatePin, this.pin);
};

export default mongoose.models.User || mongoose.model('User', UserSchema);