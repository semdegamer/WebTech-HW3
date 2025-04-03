const express = require('express');
const router = express.Router();

// GET Courses Page
router.get('/', (req, res) => {
    if (!req.loggedIn) {
      return res.redirect('/auth/login');
    }
  
    req.db.getSql("SELECT * FROM Course;")
      .then((courses) => {
        
        if (!courses) {
          courses = [];
        }
  
        res.render('user/courses', { courses: courses });
      })
      .catch((err) => {
        console.error("Courses fetch error:", err);
        res.render('user/courses', { courses: [], error: "An error occurred while fetching the courses." });
      });
  });
  


module.exports = router;
