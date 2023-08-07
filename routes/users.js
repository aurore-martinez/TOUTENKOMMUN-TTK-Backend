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
  User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => {
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
  User.findOne({ email: { $regex: new RegExp(req.body.email, 'i') } }).then(data => {
    if (data && bcrypt.compareSync(req.body.password, data.password)) {
      res.json({ result: true, token: data.token });
    } else {
      res.json({ result: false, error: 'User not found or wrong password' });
    }
  });
});

/* GET users profil */
router.get('/profil/:token', (req, res) => {
  User.findOne({ token: req.params.token }).then(userfound => {
    console.log(userfound.address)
    if (userfound) {
      res.json({
        result: true,
        firstname: userfound.firstname,
        lastname: userfound.lastname,
        username: userfound.username,
        email: userfound.email,
        phone: userfound.phone,
        photo: userfound.photo,
        address: userfound.address,
        community: userfound.community,
        // object: userfound.object,
      });
    } else {
      res.json({ result: false, error: 'User not found' });
    }
  });
});


//routes ProfileScreen

//POST Route 1) Ajouter un objet pour un user, dans une communauté
// Route pour ajouter un objet pour un utilisateur et l'inscrire dans une ou plusieurs communautés
router.post('/profil/object/:token', async (req, res) => {
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

  // Vérifier si l'objet existe déjà dans la base de données pour le user concerné
  const existingObject = await Object.findOne({ name: { $regex: new RegExp(req.body.name, 'i') }, idUser: user._id });
  if (existingObject) {
    res.json({ result: false, error: 'Object already exists for this user' });
    return;
  }

  // Créer un nouvel objet avec les données fournies dans le corps de la requête
  const newObject = new Object({
    idUser: user._id,
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
  // user.object.push(newObject._id);

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



//GET : Route 2) Afficher les objets d'un user, peu importe la/les communautés rattachées aux objets
router.get('/profil/objects/:token', (req, res) => {
  // Vérifier si des objets existent en fonction du token fourni dans l'URL
  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: 'User not found' });
        return;
      }

      // Rechercher tous les objets associés à l'utilisateur par son idUser
      Object.find({ idUser: user._id })
        .populate('availableIn')
        .then((objects) => {
          // Vérifier si l'objet existe déjà dans la base de données pour l'utilisateur concerné
          if (objects.length === 0) {
            res.json({ result: false, error: 'No objects for this user' });
            return;
          } else {
            const objectNames = objects.map((obj) => obj);  // a verif ??? obj.name 
            res.json({ result: true, objects: objectNames });
          }
        })
        .catch((err) => {
          // En cas d'erreur, renvoyer une réponse JSON avec le statut d'erreur
          res.json({ result: false, error: 'An error occurred' });
        });
    })
    .catch((err) => {
      // En cas d'erreur, renvoyer une réponse JSON avec le statut d'erreur
      res.json({ result: false, error: 'An error occurred' });
    });
});

// POST : Route pour ajouter une adresse à un utilisateur ou la mettre à jour
//TODO 1) générer et enregistrer latitude et longitude api gouvernement
router.post('/profil/:token/address', async (req, res) => {
  // Vérifier si les champs obligatoires sont présents dans le corps de la requête
  if (!checkBody(req.body, ['street', 'zipCode', 'city'])) {
    res.json({ result: false, error: 'Complete address is required' });
    return;
  }

  try {
    // Vérifier si l'utilisateur existe en fonction du token fourni dans l'URL
    const user = await User.findOne({ token: req.params.token });

    if (!user) {
      res.json({ result: false, error: 'User not found' });
      return;
    }

    // Vérifier si l'adresse existe déjà dans le profil de l'utilisateur
    const addressIndex = user.address.findIndex((addr) => addr.street !== req.body.street);

    if (addressIndex !== -1) {
      // Si l'adresse existe déjà, mettre à jour l'adresse
      user.address[addressIndex] = {
        // name: req.body.name,
        street: req.body.street,
        zipCode: req.body.zipCode,
        city: req.body.city,
        latitude: req.body.latitude,
        longitude: req.body.longitude
      };
    } else {
      // Si l'adresse n'existe pas, l'ajouter à la liste des adresses de l'utilisateur
      user.address.push({
        // name: req.body.name,
        street: req.body.street,
        zipCode: req.body.zipCode,
        city: req.body.city,
        // TODO :  ====>  trouver un moyen de récupérer la latitude et la longitude avec l'API du gouvernement
        latitude: req.body.latitude,
        longitude: req.body.longitude
      });
    }

    // Sauvegarder les modifications dans la base de données
    await user.save();

    // Réponse JSON indiquant que l'adresse a été ajoutée ou mise à jour avec succès
    res.json({ result: true, message: 'Address added/updated successfully' });
  } catch (err) {
    // En cas d'erreur, renvoyer une réponse JSON avec le statut d'erreur
    res.json({ result: false, error: 'An error occurred' });
  }
});

//GET : Route pour afficher toutes les adresses d'un user
router.get('/profil/:token/addresses', (req, res) => {
  User.findOne({ token: req.params.token })
    .populate('adresses')
    .then((user) => {
      if (!user) {
        // Si l'utilisateur n'est pas trouvé, renvoyer une réponse JSON avec un message d'erreur
        res.json({ result: false, error: 'User not found' });
      } else {
        // Récupérer la liste des adresses de l'utilisateur avec les communautés correspondantes
        const userAddresses = user.addresses;

        // Réponse JSON avec la liste des adresses de l'utilisateur
        res.json({ result: true, addresses: userAddresses });
      }
    })
    .catch((err) => {
      // En cas d'erreur, renvoyer une réponse JSON avec le statut d'erreur
      res.json({ result: false, error: 'An error occurred' });
    });
});


//GET : Route pour afficher les communautés d'un utilisateur
router.get('/profil/:token/communities', (req, res) => {
  User.findOne({ token: req.params.token })
    .populate('community')
    .then((user) => {
      if (!user) {
        // Si l'utilisateur n'est pas trouvé, renvoyer une réponse JSON avec un message d'erreur
        res.json({ result: false, error: 'User not found' });
      } else {
        // Récupérer la liste des objets de l'utilisateur avec les communautés correspondantes
        const userCommunities = user.community;

        // Réponse JSON avec la liste des objets de l'utilisateur
        res.json({ result: true, communities: userCommunities });
      }
    })
    .catch((err) => {
      // En cas d'erreur, renvoyer une réponse JSON avec le statut d'erreur
      res.json({ result: false, error: 'An error occurred' });
    });
});

//ROUTES DELETE
//DELETE : Supprimer un user 
router.delete("/profil/:token", (req, res) => {
  User.deleteOne({
    token: { $regex: new RegExp(req.params.token, "i") },
  }).then(deletedDoc => {
    console.log('deletedDoc1', deletedDoc)
    if (deletedDoc.deletedCount > 0) {
      console.log('deletedDoc2', deletedDoc)
      // document successfully deleted
      //afficher la liste des users restants
      User.find().then(data => {
        res.json({ result: true, user: data });
      });
    } else {
      res.json({ result: false, error: "User not found" });
    }
  });
});

//DELETE : Se désinscrire d'une communauté ==> NON TESTEE
router.delete('/profil/:token/:communityId', (req, res) => {
  const token = req.params.token;
  const communityId = req.params.communityId;

  User.findOneAndUpdate(
    { token: token },
    { $pull: { community: communityId } },
    { new: true }
  )
    .populate('community') // Pour peupler la liste des communautés de l'utilisateur après la mise à jour
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: 'User not found' });
      } else {
        res.json({ result: true, communities: user.community });
      }
    })
    .catch((err) => {
      res.json({ result: false, error: 'An error occurred' });
    });
});

// DELETE : Route pour supprimer une adresse spécifique d'un utilisateur
router.delete('/profil/:token/address/:addressId', async (req, res) => {
  const token = req.params.token;
  const addressId = req.params.addressId;

  try {
    const user = await User.findOne({ token: token });

    if (!user) {
      return res.json({ result: false, error: 'User not found' });
    }

    // Vérifier si 'user.addresses' est défini et est un tableau avant d'utiliser 'findIndex'
    if (!Array.isArray(user.address)) {
      return res.json({ result: false, error: 'Addresses not found or not an array' });
    }

    // Vérifier si l'adresse avec l'ID spécifié existe dans le tableau 'addresses'
    const addressIndex = user.address.findIndex((address) => address._id.toString() === addressId);

    if (addressIndex === -1) {
      return res.json({ result: false, error: 'Address not found' });
    }

    // Supprimer l'adresse du tableau 'addresses'
    user.address.splice(addressIndex, 1);

    // Enregistrer les modifications dans la base de données
    await user.save();

    // Répondre avec les adresses restantes de l'utilisateur
    return res.json({ result: true, addresses: user.address });
  } catch (err) {
    console.error(err); // Afficher l'erreur dans la console pour le débogage
    return res.json({ result: false, error: 'An error occurred' });
  }
});

//DELETE : supprimer un objet
router.delete('/objects/:token/:objectId', async (req, res) => {
  try {
    const token = req.params.token;
    const objectId = req.params.objectId;

    // Vérifier si l'utilisateur existe en fonction du token fourni dans l'URL
    const user = await User.findOne({ token });
    if (!user) {
      return res.json({ result: false, error: 'User not found' });
    }

    // Vérifier si l'objet existe avant de le supprimer
    const object = await Object.findById(objectId);
    if (!object) {
      return res.status(404).json({ message: "L'objet n'existe pas." });
    }

    // Vérifier si l'objet appartient à l'utilisateur avant de le supprimer
    if (!object.idUser.equals(user._id)) {
      return res.status(403).json({ message: "Vous n'êtes pas autorisé à supprimer cet objet." });
    }

    // Supprimer l'objet de la base de données
    await Object.findByIdAndDelete(objectId);

    res.json({ message: "L'objet a été supprimé avec succès." });
  } catch (error) {
    res.status(500).json({ message: "Une erreur est survenue lors de la suppression de l'objet." });
  }
});
//Autre route ProfileScreen: Afficher l'historique des prêts d'un user, dans toutes les communautés (sans doublons)

//Autre route bis ProfileScreen: Afficher l'historique des emprunts d'un user, dans toutes les communautés (sans doublons)



module.exports = router;
