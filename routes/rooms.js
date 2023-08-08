const express = require('express');
const router = express.Router();


const Room = require('../models/room');
const User = require('../models/users');




router.post('/create-room/:token', (req, res) => {
  const { lenderUserId, borrowerUserId } = req.body; 

  const newRoom = new Room({
    lenderUser: lenderUserId,
    borrowerUser: borrowerUserId,
  });


  newRoom.save()
    .then((room) => {

      res.json({ result: true, message :'Cest bon c est fait  '});
    })
    .catch((error) => {
  
      res.json({ result: false, error: 'Error while creating the room' });
    });
});

module.exports = router;













