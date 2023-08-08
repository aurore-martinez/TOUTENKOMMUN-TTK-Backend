const express = require('express');
const router = express.Router();

const Object = require('../models/objects');
const User = require('../models/users');
const { default: mongoose } = require('mongoose');
const { checkBody } = require('../modules/checkBody');
const { greatCircleDistance } = require('../modules/calcDistance');

/**
 * GET - Route pour rechercher les objets d'une communauté à laquelle le user a adhéré
 * body: 'token', 'name', 'communitiesId'
 */
router.post('/', async (req, res) => {
	if (!checkBody(req.body, ['token', 'name'])) {
		res.json({ result: false, error: 'Missing or invalid field' });
		return;
	}

	/* Récupération de base, par communité */
	const user = await User.findOne({ token: req.body.token });

	// Construction du filtre
	const objFilter = {
		isAvailable: true,
		name: new RegExp(req.body.name.trim(), 'i')
	};

	// On retire des résultats de la requête les objets du User disponibles dans les communautés qu'il ne veut pas voir
	// Il faut transformer les strings en mongoose.Types.ObjectId
	let listCommu = null;
	if (req.body.communitiesId) { listCommu = req.body.communitiesId.map(id => new mongoose.Types.ObjectId(id)); }
	else { listCommu = user.community.map(id => new mongoose.Types.ObjectId(id)); }

	objFilter['availableIn'] = { $in: listCommu };

	// On enlève les objets de User
	const ownObjects = await Object.find({ idUser: user._id, name: new RegExp(req.body.name.trim(), 'i') }, '_id');
	if (ownObjects.length > 0) { objFilter['_id'] = { $nin: ownObjects }; }

	// On trouve les objets disponibles dans les communautés du User
	const objectsfound = await Object.find(objFilter).populate('idUser').populate('availableIn');

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

	res.json({ result: true, searchresult: items });
});


module.exports = router;






