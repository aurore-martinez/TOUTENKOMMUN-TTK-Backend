const express = require('express');
const router = express.Router();

const Object = require('../models/objects');
const User = require('../models/users');
const Transaction = require('../models/transactions');
const ObjectID = require('mongoose').Types.ObjectId;
const Room = require('../models/rooms');


/**
 * POST - Route pour emprunter un objet
 */

router.post("/borrow/:token", async (req, res) => {
    try {
      // Récupérer l'utilisateur emprunteur à partir du token
      const borrowerUser = await User.findOne({ token: req.params.token });
      if (!borrowerUser) {
        res.json({ result: false, error: 'Utilisateur emprunteur non trouvé' });
        return;
      }
  
      // Récupérer l'objet à emprunter
      const object = await Object.findById(req.body._id);
      if (!object || !object.isAvailable) {
        res.json({ result: false, error: 'Objet non trouvé ou non disponible pour emprunt' });
        return;
      }
  
      // Récupérer l'utilisateur prêteur à partir du schéma Object
      const lenderUser = await User.findById(object.idUser);
      if (!lenderUser) {
        res.json({ result: false, error: 'Utilisateur prêteur non trouvé' });
        return;
      }
  
      // Créer une nouvelle transaction = emprunt
      const newTransaction = new Transaction({
        lenderUser: lenderUser._id,
        borrowerUser: borrowerUser._id,
        object: object._id,
        startDate: new Date(),
        isFinished: false,
      });
  
      // Sauvegarder la transaction dans la DB
      await newTransaction.save();
  
      // Mettre à jour le statut de disponibilité de l'objet
      object.isAvailable = false;
      await object.save();
  
      res.json({ message: "Objet emprunté avec succès !! :D" });
    } catch (error) {
      console.error("Erreur emprunt objet:", error.message);
      res.status(500).json({ error: "Internal server error." });
    }
  });
  
  
  router.post("/return/:token", async (req, res) => {
    try {
      // Récupérer l'utilisateur emprunteur à partir du token
      const borrowerUser = await User.findOne({ token: req.params.token });
      if (!borrowerUser) {
        res.json({ result: false, error: 'Utilisateur emprunteur non trouvé' });
        return;
      }
  
      // Récupérer l'objet emprunté
      const object = await Object.findById(req.body.objectId);
      if (!object) {
        res.json({ result: false, error: 'Objet emprunté non trouvé' });
        return;
      } 
  
      // Récupérer l'utilisateur prêteur à partir du schéma Object
      const lenderUser = await User.findById(object.idUser);
      if (!lenderUser) {
        res.json({ result: false, error: 'Utilisateur prêteur non trouvé' });
        return;
      } 
      
      //Récupérer la transaction
      const transaction = await Transaction.findById(req.body.transactionId);
      if (!transaction) {
        res.json({ result: false, error: 'Transaction non trouvée' });
        return;
      } 
  
      // Mettre à jour le statut de la transaction
      transaction.isFinished = true;
      await transaction.save();

      // Mettre à jour le statut de disponibilité de l'objet
      object.isAvailable = true;
      await object.save();
  
      res.json({ message: "Objet rendu avec succès !! :D" });
    } catch (error) {
      console.error("Erreur retour objet:", error.message);
      res.status(500).json({ error: "Internal server error." });
    }
  })


  //GET borrow : Route Afficher les emprunts d'un user, peu importe la/les communautés rattachées aux objets
router.get('/borrow/:token', (req, res) => {
  // Vérifier si des objets existent en fonction du token fourni dans l'URL
  User.findOne({ token: req.params.token })
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: 'User not found' });
        return;
      }

      // Rechercher tous les emprunts associés à l'utilisateur par son id_borrowerUser
      Transaction.find({ borrowerUser: user._id })
        .populate('object')
        .populate('lenderUser', 'username') // Charger les détails de lenderUser avec uniquement le champ username
        .populate('borrowerUser', 'username') // Charger les détails de borrowerUser avec uniquement le champ username
        .then((emprunts) => {
          // Vérifier si l'emprunt existe déjà dans la base de données pour l'utilisateur concerné
          if (emprunts.length === 0) {
            res.json({ result: false, error: 'No borrow for this user' });
            return;
          } else {
            const empruntsList = emprunts.map((obj) => obj);  
            res.json({ result: true, emprunts: empruntsList });
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


  //GET lend : Afficher les emprunts d'un user, peu importe la/les communautés rattachées aux objets
  router.get('/lend/:token', (req, res) => {
    // Vérifier si des objets existent en fonction du token fourni dans l'URL
    User.findOne({ token: req.params.token })
      .then((user) => {
        if (!user) {
          res.json({ result: false, error: 'User not found' });
          return;
        }
  
        // Rechercher tous les emprunts associés à l'utilisateur par son id_borrowerUser
        Transaction.find({ lenderUser: user._id })
          .populate('object')
          .populate('lenderUser', 'username') // Charger les détails de lenderUser avec uniquement le champ username
          .populate('borrowerUser', 'username') // Charger les détails de borrowerUser avec uniquement le champ username
          .then((prets) => {
            // Vérifier si l'emprunt existe déjà dans la base de données pour l'utilisateur concerné
            if (prets.length === 0) {
              res.json({ result: false, error: 'No borrow for this user' });
              return;
            } else {
              const pretsList = prets.map((obj) => obj);  
              res.json({ result: true, prets: pretsList });
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


// Route pour afficher la liste des chat rooms d'un utilisateur en fonction du token
router.get('/:token', (req, res) => {
  const userToken = req.params.token;

  User.findOne({ token: userToken })
    .then((user) => {
      if (!user) {
        res.json({ result: false, error: 'User not found' });
        return;
      }

      // Récupérer toutes les chat rooms où l'utilisateur est soit prêteur (lender) soit emprunteur (borrower)
      Room.find({ $or: [{ lenderUser: new ObjectID(user._id) }, { borrowerUser: new ObjectID(user._id) }] })
        .populate('lenderUser', '_id firstname lastname') // Remplacer les champs souhaités du modèle User
        .populate('borrowerUser', '_id firstname lastname') // Remplacer les champs souhaités du modèle User
        .then((rooms) => {
          console.log('rooms', rooms);
          if (!rooms || rooms.length === 0) {
            res.json({ result: false, error: 'No chat rooms found for the user' });
            return;
          }

          // Vous pouvez maintenant effectuer une redirection vers l'écran approprié
          // composé du token des deux utilisateurs (lender et borrower) de chaque chat room
          // Par exemple, vous pouvez renvoyer simplement la liste des chat rooms dans la réponse
          res.json({ result: true, rooms });
        })
        .catch((error) => {
          res.json({ result: false, error: 'Error while fetching chat rooms' });
        });
    })
    .catch((error) => {
      res.json({ result: false, error: 'Error while finding user' });
    });
});


// afficher la liste des chats room d'un utilisateur
// récuperer toutes les chats room ou notre user est soit un lender soit un borrower avec token et non idUser
// une redirection vers le bon écran composé du token des 2 utilisateurs
  
  module.exports = router;