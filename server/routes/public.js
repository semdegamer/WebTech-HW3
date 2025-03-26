var express = require('express');
var router = express.Router();

/* GET Home Page */
router.get('/', function(req, res) {
  res.render('public/home');
});

module.exports = router;