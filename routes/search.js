const express = require('express');
const router = express.Router();
const Object = require('../models/objects');
const User = require("../models/users");
const Community = require("../models/communities");
const { default: mongoose } = require('mongoose');

/**
 * GET - Route pour rechercher les objets d'une communauté à laquelle le user a adhéré
 * body: "token", "name", "communitiesId"
 */
router.post('/', async (req, res) => {
    // On regarde les communités accessibles du User
    const user = await User.findOne({ token: req.body.token }).populate('community');

    // On retire des résultats de la requête les objets du User disponibles dans les communautés qu'il ne veut pas voir
    // Il faut transformer les strings en mongoose.Types.ObjectId
    const listCommu = req.body.communitiesId.map(id => new mongoose.Types.ObjectId(id));

    // On trouve les objets disponibles dans les communautés du User
    const objectsfound = await Object.find({ name: new RegExp(req.body.name.trim(), 'i'), isAvailable: true, availableIn: { $in: listCommu } });
    res.json({ result: true, searchresult : objectsfound });
});

  
module.exports = router;
  
  
  
  
  
  
