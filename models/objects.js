const mongoose = require('mongoose');

const objectSchema = mongoose.Schema({
  name: String,
  description: String,
  photo: String,
  creationDate: Date,
  isAvailable: Boolean,
});

const Object = mongoose.model('objects', objectSchema);

module.exports = Object;
