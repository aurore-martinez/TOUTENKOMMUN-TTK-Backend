var express = require('express');
var router = express.Router();

require('../models/connection');
const User = require('../models/users');
const Object = require('../models/objects');

const uniqid = require('uniqid');

const cloudinary = require('cloudinary').v2;
const fs = require('fs');
const uniqId = uniqid();

/* GET home page. */
router.get('/', function (req, res, next) {
  res.render('index', { title: 'Express' });
});

router.post('/:token/cloudinary/upload', async (req, res) => {
  const photoPath = `./tmp/${uniqId}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);
  const resultCloudinary = await cloudinary.uploader.upload(photoPath);

  if (!resultMove) {
    fs.unlinkSync(photoPath);
    await User.updateOne(
      { token: req.params.token },
      { photo: resultCloudinary.secure_url }
    );
    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultMove });
  }
});


router.post('/:token/object/cloudinary/upload', async (req, res) => {
  const photoPath = `./tmp/${uniqId}.jpg`;
  const resultMove = await req.files.photoFromFront.mv(photoPath);
  const resultCloudinary = await cloudinary.uploader.upload(photoPath);

  if (!resultMove) {
    fs.unlinkSync(photoPath);
    res.json({ result: true, url: resultCloudinary.secure_url });
  } else {
    res.json({ result: false, error: resultMove });
  }
});


module.exports = router;
