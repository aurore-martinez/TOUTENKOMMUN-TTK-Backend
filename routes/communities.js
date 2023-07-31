var express = require('express');
var router = express.Router();

const User = require('../models/users');
const Community = require('../models/communities');
const { checkBody } = require('../modules/checkBody');

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
	if (commu.accessCode === accessCode) {
		const updateRes = await User.updateOne({ token }, { $push: { community: commu._id } });
		res.json({ result: updateRes.modifiedCount === 1 });
	} else {
		res.json({ result: false, error: "Wrong access code" });
	}
});

module.exports = router;
