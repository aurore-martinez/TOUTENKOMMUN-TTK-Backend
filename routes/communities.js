const express = require('express');
const router = express.Router();
const Community = require('../models/communities');

function generateRandomAccessCode(length) {
    const characters = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
    let accessCode = '';
    for (let i = 0; i < length; i++) {
        const randomIndex = Math.floor(Math.random() * characters.length);
        accessCode += characters[randomIndex];
    }
    return accessCode;
}

router.post('/create', async (req, res) => {
    const {
        name,
        localisation,
        description,
        photo,
        isPrivate,
    } = req.body;

    // Vérifier si il y a une commu avec le même nom dans la base de données
    const existingCommunity = await Community.findOne({ name });

    console.log("LOC", localisation);
    if (existingCommunity) {
        // Une commu avec le même nom existe déjà
        return res.json({ result: false, error: 'Une communauté avec le même nom existe déjà' });
    }

    const accessCode = generateRandomAccessCode(5);

    // Creation de la nouvelle communauté
    const newCommunity = new Community({
        name,
        localisation,
        accessCode, 
        description,
        photo,
        creationDate: (new Date()),
        isPrivate,
    });

    newCommunity.save()
        .then(() => {
            res.json({ result: true });
        })
        .catch(err => {
            res.json({ result: false, error: err });
        });
});

module.exports = router;
