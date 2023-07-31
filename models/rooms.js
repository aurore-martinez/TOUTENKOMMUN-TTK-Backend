const mongoose = require('mongoose');

const roomSchema = mongoose.Schema({
    lenderUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
    borrowerUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
});

const Room = mongoose.model('rooms', roomSchema);

module.exports = Room;
