const mongoose = require('mongoose');

const communitySchema = mongoose.Schema({
  name: String,
  localisation: String,
  accessCode: String,
  description: String,
  photo: String,
  creationDate: Date,
  isPrivate: Boolean,
});

const Community = mongoose.model('communities', communitySchema);

module.exports = Community;
