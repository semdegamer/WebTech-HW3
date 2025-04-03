const express = require('express');
const router = express.Router();

// GET Courses Page
router.get('/', (req, res) => {
  if (!req.loggedIn) {
      return res.redirect('/auth/login');
  }

  req.db.allSql("SELECT * FROM Course;")
      .then((courses) => {
          console.log(courses);  // Check the output in the console
          if (!courses || courses.length === 0) {
              console.log("No courses available in the database");
              courses = [];  // If no courses are found, ensure we pass an empty array
          }
          res.render('user/courses', { courses: courses });
      })
      .catch((err) => {
          console.error("Courses fetch error:", err);
          res.render('user/courses', { courses: [], error: "An error occurred while fetching the courses." });
      });
});

module.exports = router;
