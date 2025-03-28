var express = require('express');
var router = express.Router();

/* GET Home Page */
// homepage for user
router.get('/', (req, res, next) => false /* check for logged in, something like: req.user.loggedIn */ ? next() : next('route'), function(req, res) {
  res.render('user/home');
});

let storedRes = 0;

// default homepage
router.get('/', function(req, res) {
  res.render('public/home');
});

router.get('/events', function(req, res) {
  res.writeHead(200, {
    'Content-Type': 'text/event-stream',
    'Cache-Control': 'no-cache',
    'Access-Control-Allow-Origin': '*'
  });
  res.write(`data: ${JSON.stringify({name: "test", data: "dtataatatatat"})}\n\n`);
  return;

  setInterval(() => {
    console.log("event send");
    res.write(`data: ${JSON.stringify({name: "test", data: "dtataatatatat"})}\n\n`);
    //storedRes.write(JSON.stringify({name: "test", data: "dtataatatatat"}));
    //storedRes.flush();
  }, 2000);
});

module.exports = router;