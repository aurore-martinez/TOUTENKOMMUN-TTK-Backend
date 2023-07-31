const mongoose = require('mongoose');

const connectionString = process.env.CONNECTION_STRING;

mongoose.connect(connectionString, { connectTimeoutMS: 2000 })
  .then(() => console.log("Oh mon gaté t'es sur la TTK Database !"))
  .catch(error => console.error(error));
