const mongoose = require('mongoose');

const messageSchema = mongoose.Schema({
    room: { type: mongoose.Schema.Types.ObjectId, ref: 'rooms' },
    user: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    sendingDate: Date,
    messageContent: String,
});

const Message = mongoose.model('messages', messageSchema);

module.exports = Message;
