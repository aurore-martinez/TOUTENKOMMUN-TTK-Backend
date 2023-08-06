const express = require('express');
const router = express.Router();

const Object = require('../models/objects');
const User = require('../models/users');
const Transaction = require('../models/transactions');


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
      object.isAvailable = false;
      await object.save();
  
      res.json({ message: "Objet rendu avec succès !! :D" });
    } catch (error) {
      console.error("Erreur retour objet:", error.message);
      res.status(500).json({ error: "Internal server error." });
    }
  })
  module.exports = router;