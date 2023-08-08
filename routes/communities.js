var express = require('express');
var router = express.Router();

const User = require('../models/users');
const Community = require('../models/communities');
const { checkBody } = require('../modules/checkBody');
const { default: mongoose } = require('mongoose');
const Object = require('../models/objects');
const { greatCircleDistance } = require('../modules/calcDistance');

/**
 * POST - Join a community
 */
router.post('/join', async (req, res) => {
	if (!checkBody(req.body, ['token', 'accessCode', 'name'])) {
		res.json({ result: false, error: 'Missing or invalid field' });
		return;
	}

	const { token, accessCode, name } = req.body;

	const commu = await Community.findOne({ name });
	const user = await User.findOne({ token });

	if (user.community.includes(commu._id)) {
		res.json({ result: false, error: 'Community already joined' });
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
		res.json({ result: false, error: 'Wrong access code' });
	}
});

const generateRandomAccessCode = (length) => {
	const characters =
		'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
	let accessCode = '';
	for (let i = 0; i < length; i++) {
		const randomIndex = Math.floor(Math.random() * characters.length);
		accessCode += characters[randomIndex];
	}
	return accessCode;
};

/**
 * POST - Création d'une communauté par User
 */
router.post('/create/:token', async (req, res) => {

	if (!checkBody(req.body, ['name'])) {
		res.json({ result: false, error: 'Missing or invalid field' });
		return;
	}

	const { name, localisation, description, photo, isPrivate } = req.body;

	// Récupère l'utilisateur en fonction du token
	const user = await User.findOne({ token : req.params.token });

  	if (!user) {
    	return res.json({ result: false, error: 'User not found' });
  	}

	// Vérifier si il y a une commu avec le même nom dans la base de données
	const existingCommunity = await Community.findOne({ name });
	if (existingCommunity) {
		// Une commu avec le même nom existe déjà
		return res.json({
			result: false,
			error: 'Une communauté avec le même nom existe déjà',
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

  	// Enregistrer la nouvelle communauté dans la base de données
  	await newCommunity.save();

	res.json({
		result: true,
		accessCode: newCommunity.accessCode,
		name: newCommunity.name,
	});

	// Partie qui adhère à la commu crée 
  	// Ajoute l'ID de la nouvelle communauté à la liste des communautés du user
  	user.community.push(newCommunity._id);

  	// Enregistrer les modifications apportées au user (ajout de la communauté)
  	await user.save();
	  console.log("L'utilisateur a bien adhéré à sa communauté crée");
});


/**
 * GET - Récupération des objets dispo dans les communautés de User (sauf les siens)
 */
router.get('/feed/:token', async (req, res) => {
	const user = await User.findOne({ token: req.params.token });

	const listCommu = user.community.map(id => new mongoose.Types.ObjectId(id));
	const ownObjects = await Object.find({ idUser: user._id }, '_id');
	const objectsfound = await Object.find({ _id: { $nin: ownObjects }, isAvailable: true, availableIn: { $in: listCommu } }).populate('idUser').populate('availableIn');

	/* Calcul de la distance des objets (en km) */
	const items = objectsfound.map((obj) => {
		const nameAndIdCommu = obj.availableIn.map(commu => {
			if (user.community.includes(commu._id)) return { id: commu._id, nameCommu: commu.name };
		}).filter(Boolean);
		
		// Reconstruction de l'objet (imposible de write un retour de mongoose ??)
		let res = { 
			_id: obj._id,
			name: obj.name,
			isAvailable: obj.isAvailable,
			availableIn: nameAndIdCommu,
      photo: obj.photo,
      description: obj.description,
			owner: {
				token: obj.idUser.token,
				username: obj.idUser.username,
				address: {
					street: obj.idUser.address[0].street,
					zipCode: obj.idUser.address[0].zipCode,
					city: obj.idUser.address[0].city,
					latitude: obj.idUser.address[0].latitude,
					longitude: obj.idUser.address[0].longitude,
				}
			}
		};

		// Distance avec l'objet
		const myLoc = { latitude: user.address[0].latitude, longitude: user.address[0].longitude };
		const objLoc = { latitude: obj.idUser.address[0].latitude, longitude: obj.idUser.address[0].longitude };

		const distance = greatCircleDistance(
			myLoc.latitude,
			myLoc.longitude,
			objLoc.latitude,
			objLoc.longitude
		);

		res['distance'] = distance;
		return res;
	}); 

	res.json({ result: true, items });
});

/**
 * GET - Récupération des communautés de USER
 */
router.get('/:token', async (req, res) => {
	const user = await User.findOne({ token: req.params.token }, 'community').populate('community');

	if (!user) {
		res.json({ result: false, error: 'User not found' });
		return;
	}

	res.json({ result: true, communities: user.community });
});

// supprimer une communauté

module.exports = router;
