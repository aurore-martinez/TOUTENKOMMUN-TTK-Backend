const mongoose = require('mongoose');

const transactionSchema = mongoose.Schema({
    lenderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    borrowerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    object: { type: mongoose.Schema.Types.ObjectId, ref: 'objects' },
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'rooms' },
    startDate: Date,
    endDate: Date,
    isFinished: Boolean,
});

const Transaction = mongoose.model('transactions', transactionSchema);

module.exports = Transaction;
