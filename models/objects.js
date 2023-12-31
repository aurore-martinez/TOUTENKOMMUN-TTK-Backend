const mongoose = require('mongoose');

const objectSchema = mongoose.Schema({
  idUser: { type: mongoose.Schema.Types.ObjectId, ref: 'users' },
  name: String,
  description: String,
  photo: String,
  creationDate: Date,
  isAvailable: Boolean,
  availableIn: [{ type: mongoose.Schema.Types.ObjectId, ref: 'communities' }],
});

const Object = mongoose.model('objects', objectSchema);

module.exports = Object;
