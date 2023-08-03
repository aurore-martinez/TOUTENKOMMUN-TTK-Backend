var express = require("express");
var router = express.Router();

const User = require("../models/users");
const Community = require("../models/communities");
const { checkBody } = require("../modules/checkBody");
const { default: mongoose } = require("mongoose");
const Object = require("../models/objects");

/**
 * POST - Join a community
 */
router.post("/join", async (req, res) => {
	if (!checkBody(req.body, ["token", "accessCode", "name"])) {
		res.json({ result: false, error: "Missing or invalid field" });
		return;
	}

	const { token, accessCode, name } = req.body;

	const commu = await Community.findOne({ name });
	const user = await User.findOne({ token });

	if (user.community.includes(commu._id)) {
		res.json({ result: false, error: "Community already joined" });
		return;
	} else if (commu.accessCode === accessCode) {
		const updateRes = await User.updateOne(
			{ token },
			{ $push: { community: commu._id } }
		);
		res.json({
			result: updateRes.modifiedCount === 1,
			localisation: commu.localisation,
			description: commu.description,
			name: commu.name,
		});
	} else {
		res.json({ result: false, error: "Wrong access code" });
	}
});

const generateRandomAccessCode = (length) => {
	const characters =
		"ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
	let accessCode = "";
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		accessCode += characters[randomIndex];
	}
	return accessCode;
};

/**
 * POST - Création d'une communauté par User
 */
router.post("/create", async (req, res) => {
	const { name, localisation, description, photo, isPrivate } = req.body;

	// Vérifier si il y a une commu avec le même nom dans la base de données
	const existingCommunity = await Community.findOne({ name });
	if (existingCommunity) {
		// Une commu avec le même nom existe déjà
		return res.json({
			result: false,
			error: "Une communauté avec le même nom existe déjà",
		});
	}

	const accessCode = generateRandomAccessCode(5);

	// Creation de la nouvelle communauté
	const newCommunity = await new Community({
		name,
		localisation,
		accessCode,
		description,
		photo,
		creationDate: new Date(),
		isPrivate,
	});


	await newCommunity.save();


	res.json({
		result: true,
		accessCode: newCommunity.accessCode,
		name: newCommunity.name,
	});
});

/**
 * GET - Récupération des objets dispo dans les communautés de User (sauf les siens)
 */
router.get('/feed/:token', async (req, res) => {
	const user = await User.findOne({ token: req.params.token });

	const listCommu = user.community.map(id => new mongoose.Types.ObjectId(id));
	const ownObjects = await Object.find({ idUser: user._id }, '_id');
	const objectsfound = await Object.find({ _id: { $nin: ownObjects }, isAvailable: true, availableIn: { $in: listCommu } }).populate('idUser');

	res.json({ result: true, items: objectsfound });
});

module.exports = router;
