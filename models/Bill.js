import mongoose from 'mongoose';

const BillSchema = new mongoose.Schema({
    patientId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User',
        required: true
    },
    appointmentId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'Appointment'
    },
    service: {
        type: String,
        required: true
    },
    amount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid', 'partial'],
        default: 'unpaid'
    },
    billDate: {
        type: Date,
        default: Date.now
    },
    paidDate: {
        type: Date
    },
    paymentMethod: {
        type: String,
        enum: ['cash', 'card', 'upi', 'online']
    },
    createdBy: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
    },
    createdAt: {
        type: Date,
        default: Date.now
    }
}, {
    timestamps: true
});

BillSchema.index({ patientId: 1, billDate: -1 });

export default mongoose.models.Bill || mongoose.model('Bill', BillSchema);