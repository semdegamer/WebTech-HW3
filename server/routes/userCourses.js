const express = require('express');
const router = express.Router();

// GET Courses Page
router.get('/', (req, res) => {
  if (!req.loggedIn) {
    return res.redirect('/auth/login');
  }

  // Check if the Course table exists before fetching data
  req.db.getSql("SELECT name FROM sqlite_master WHERE type='table' AND name='Course';")
    .then((table) => {
      if (!table) {
        console.error("Table 'Course' does not exist!");
        return res.render('user/courses', {
          user: req.session.user,
          courses: [],
          error: "The courses table does not exist in the database."
        });
      } else {
        console.log("Course table exists.");

        // Now fetch courses
        return req.db.allSql("SELECT * FROM Course;");
      }
    })
    .then((courses) => {
      if (courses) {
        console.log("Courses fetched from DB:", courses);
        res.render('user/courses', {
          user: req.session.user,
          courses: courses || []
        });
      }
    })
    .catch((err) => {
      console.error("Courses fetch error:", err);
      res.render('user/courses', {
        user: req.session.user,
        courses: [],
        error: "An error occurred while fetching the courses."
      });
    });
});

module.exports = router;
