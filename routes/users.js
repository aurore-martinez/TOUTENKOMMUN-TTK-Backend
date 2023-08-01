var express = require('express');
var router = express.Router();

require('../models/connection');
const { checkBody } = require('../modules/checkBody');
const User = require('../models/users');
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

module.exports = router;
