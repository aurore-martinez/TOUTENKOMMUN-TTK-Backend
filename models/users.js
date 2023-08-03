const mongoose = require('mongoose');

const addressSchema = mongoose.Schema({
	street: String,
	zipCode: String,
	city: String,
	latitude: Number,
	longitude: Number,
})

const userSchema = mongoose.Schema({
	firstname: String,
	lastname: String,
	username: String,
	token: String,
	password: String,
	email: String,
	phone: String,
	photo: String,
	address: [addressSchema],
	community: [{ type: mongoose.Schema.Types.ObjectId, ref: 'communities' }],
});

const User = mongoose.model('users', userSchema);

module.exports = User;
