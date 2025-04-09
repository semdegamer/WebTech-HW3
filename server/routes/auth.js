const express = require('express');
const router = express.Router();

const userLogin = require('../middleware/userLogin');
const userRegistration = require('../middleware/userRegistration');

router.use(function(req, res, next) {
  var loggedIn = req.session && req.session.user ? true : false; // Check if user is logged in
  if (loggedIn) {
    res.redirect('/');
  } else {
    next();
  }
});

/* GET Login Page */
router.get('/login', function(req, res) {
  res.render('auth/login');
});

router.post('/login', userLogin);

/* GET Register Page */
router.get('/register', async function(req, res) {
  try {
    const courses = await req.db.allSql("SELECT courseID, name FROM Course;");
    const programs = await req.db.allSql("SELECT * FROM Program;");
    res.render('auth/register', {
      courses: courses || [],
      programs: programs || []
    });
  } catch (err) {
    console.error("Error fetching courses/ programs:", err);
    res.render('auth/register', {
      courses: [],
      error: "Failed to load courses/ programs. Please try again later."
    });
  }
});

router.post('/register', userRegistration);

module.exports = router;
