var express = require('express');
var router = express.Router();

require('../models/connection');
const { checkBody } = require('../modules/checkBody');
const User = require('../models/users');
const Object = require('../models/objects');
const Community = require('../models/communities');
const uid2 = require('uid2');
const bcrypt = require('bcrypt');


/* POST users signup. */
router.post('/signup', (req, res) => {
  if (!checkBody(req.body, ['firstname', 'lastname', 'username', 'password', 'email',])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }
  // Check if the user has not already been registered, then user is saved in database
  User.findOne({ email: {$regex: new RegExp(req.body.email, 'i')}}).then(data => {
    if (data === null) {
      const hash = bcrypt.hashSync(req.body.password, 10);

      const newUser = new User({
        firstname: req.body.firstname,
        lastname: req.body.lastname,
        username: req.body.username,
        token: uid2(32),
        password: hash,
        email: req.body.email,
        phone: req.body.phone,
        photo: req.body.photo,
        address: [],
        community: [],
        object: [],
      });

      newUser.save().then(data => {
        res.json({ result: true, token: data.token });
      });
    } else {
      // User already exists in database
      res.json({ result: false, error: 'User already exists' });
    }
  });
});


/* POST users signin. */
router.post('/signin', (req, res) => {
  if (!checkBody(req.body, ['email', 'password'])) {
    res.json({ result: false, error: 'Missing or empty fields' });
    return;
  }

  // Check if the user has an account, so he can login
  User.findOne({ email: {$regex: new RegExp(req.body.email, 'i')} }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

/* GET users profil */
router.get('/profil/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(userfound => {
    console.log(userfound.address)
    if (userfound) {
      res.json({ result: true, 
        firstname: userfound.firstname,
        lastname: userfound.lastname,
        username: userfound.username ,
        email: userfound.email,
        phone: userfound.phone,
        photo: userfound.photo,
        address: userfound.address,
        community: userfound.community,
        object: userfound.object,
      });
    } else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});


//routes ProfileScreen

//Route 1) Ajouter un objet pour un user, dans une communauté
// Route pour ajouter un objet pour un utilisateur et l'inscrire dans une ou plusieurs communautés
router.post('/profil/:token/object', async (req, res) => {
  // Vérifier si les champs obligatoires sont présents dans le corps de la requête
  if (!checkBody(req.body, ['name'])) {
    res.json({ result: false, error: 'Object name is required' });
    return;
  }

  // Vérifier si l'utilisateur existe en fonction du token fourni dans l'URL
  const user = await User.findOne({ token: req.params.token });
  if (!user) {
    res.json({ result: false, error: 'User not found' });
    return;
  }

  // Vérifier si l'objet existe déjà dans la base de données
  const existingObject = await Object.findOne({ name: { $regex: new RegExp(req.body.name, 'i') } });
  if (existingObject) {
    res.json({ result: false, error: 'Object already exists' });
    return;
  }

  // Créer un nouvel objet avec les données fournies dans le corps de la requête
  const newObject = new Object({
    name: req.body.name,
    description: req.body.description,
    photo: req.body.photo,
    creationDate: new Date(),
    isAvailable: true,
    availableIn: [],
  });

  // Enregistrer le nouvel objet dans la base de données
  await newObject.save();

  // Ajouter l'ID de l'objet nouvellement créé à la liste des objets de l'utilisateur
  user.object.push(newObject._id);

  // Vérifier si des communautés sont spécifiées pour cet objet
  if (req.body.communities && Array.isArray(req.body.communities)) {
    // Parcourir les IDs des communautés spécifiées et les ajouter à la liste des communautés disponibles pour cet objet
    for (const communityId of req.body.communities) {
      const community = await Community.findById(communityId);
      if (community) {
        newObject.availableIn.push(community._id);
      }
    }
  }

  // Enregistrer les modifications apportées à l'utilisateur (ajout de l'objet) et à l'objet (ajout des communautés)
  await user.save();
  await newObject.save();

  // Réponse JSON indiquant le succès de l'opération et le token de l'objet créé
  res.json({ result: true, token: newObject.token });
});



//Route 2) Afficher les objets d'un user, peu importe la/les communautés rattachées aux objets
router.get('/profil/:token/objects', (req, res) => {
  // Vérifier si l'utilisateur existe en fonction du token fourni dans l'URL
  User.findOne({ token: req.params.token })

    //path: 'object' indique que nous voulons peupler le champ object de l'utilisateur, qui contient les références aux objets.
    //populate: { path: 'availableIn', model: 'communities' } indique que nous voulons peupler le champ availableIn de chaque objet, qui contient les références aux communautés.
    /*"Peupler" les données signifie remplacer les IDs des références par les documents complets associés, en effectuant une requête supplémentaire pour récupérer les données associées.
    Lorsque nous appelons .populate() sur ce champ "object", Mongoose exécute une requête pour récupérer les détails complets de chaque objet associé à l'utilisateur, et remplace les IDs des objets par les documents d'objets complets. */
    //model: 'communities' indique que nous utilisons le modèle "communities" pour peupler les détails des communautés

    .populate({ path: 'object', populate: { path: 'availableIn', model: 'communities' } })
    .then((user) => {
      if (!user) {
        // Si l'utilisateur n'est pas trouvé, renvoyer une réponse JSON avec un message d'erreur
        res.json({ result: false, error: 'User not found' });
      } else {
        // Récupérer la liste des objets de l'utilisateur avec les communautés correspondantes
        const userObjects = user.object;

        // Réponse JSON avec la liste des objets de l'utilisateur
        res.json({ result: true, objects: userObjects });
      }
    })
    .catch((err) => {
      // En cas d'erreur, renvoyer une réponse JSON avec le statut d'erreur
      res.json({ result: false, error: 'An error occurred' });
    });
});


//Route 3) Afficher l'historique des prêts d'un user, dans toutes les communautés (sans doublons)

//Route 4) Afficher l'historique des emprunts d'un user, dans toutes les communautés (sans doublons)



module.exports = router;
