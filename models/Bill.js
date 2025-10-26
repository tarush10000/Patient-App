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
    items: {
        type: String,
        required: true
    },
    totalAmount: {
        type: Number,
        required: true
    },
    status: {
        type: String,
        enum: ['paid', 'unpaid'],
        default: 'unpaid'
    },
    billDate: {
        type: Date,
        default: Date.now
    },
    paidDate: {
        type: Date
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

BillSchema.methods.getParsedItems = function () {
    const itemsArray = this.items.split(', ');
    const parsed = [];

    for (let i = 0; i < itemsArray.length; i += 3) {
        if (itemsArray[i] && itemsArray[i + 1] && itemsArray[i + 2]) {
            parsed.push({
                service: itemsArray[i],
                amount: parseFloat(itemsArray[i + 1]),
                paymentMethod: itemsArray[i + 2]
            });
        }
    }

    return parsed;
};

export default mongoose.models.Bill || mongoose.model('Bill', BillSchema);