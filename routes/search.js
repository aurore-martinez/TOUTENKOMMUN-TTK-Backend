const express = require('express');
const router = express.Router();

const Object = require('../models/objects');
const User = require('../models/users');
const Community = require('../models/communities');
const { default: mongoose } = require('mongoose');
const { checkBody } = require('../modules/checkBody');

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

	// On trouve les objets disponibles dans les communautés du User
	const objectsfound = await Object.find(objFilter).populate('idUser');

	/* Calcul de la distance des objets */
	// {...}


	res.json({ result: true, searchresult: objectsfound });
});


module.exports = router;






