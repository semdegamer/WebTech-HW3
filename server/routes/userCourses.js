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

// GET Course Details Page
router.get('/:courseId', (req, res) => {
  if (!req.loggedIn) {
    return res.redirect('/auth/login');
  }

  const courseId = req.params.courseId;

  // Query to get course details
  req.db.getSql("SELECT * FROM Course WHERE courseID = ?;", [courseId])
    .then(course => {
      if (!course) {
        return res.status(404).send("Course not found");
      }

      // Query to get enrolled students
      req.db.allSql(`
        SELECT S.studentId, S.firstName, S.lastName, S.photoLink
        FROM Student S
        JOIN CourseEnrollment E ON E.studentId = S.studentId
        WHERE E.courseId = ?;
      `, [courseId])
        .then(students => {
          res.render('user/courseDetails', {
            user: req.session.user,
            course: course,
            students: students || [],
            error: null
          });
        })
        .catch(err => {
          console.error("Error fetching students:", err);
          res.render('user/courseDetails', {
            user: req.session.user,
            course: course,
            students: [],
            error: "An error occurred while fetching the students."
          });
        });
    })
    .catch(err => {
      console.error("Error fetching course details:", err);
      res.render('user/courseDetails', {
        user: req.session.user,
        course: null,
        students: [],
        error: "An error occurred while fetching course details."
      });
    });
});

// POST - Send a friend request to a student
router.post('/:courseId/friend-request', (req, res) => {
  if (!req.loggedIn) {
    return res.redirect('/auth/login');
  }

  const studentId = req.body.studentId;

  // Send a friend request (implement your logic here, e.g., insert into 'FriendRequest' table)
  req.db.runSql("INSERT INTO FriendRequest (senderId, receiverId) VALUES (?, ?)", [req.session.user.studentId, studentId])
    .then(() => {
      // Redirect back to course details page
      res.redirect('/user/courses/' + req.params.courseId);  
    })
    .catch(err => {
      console.error("Error sending friend request:", err);
      // Redirect back with error
      res.redirect('/user/courses/' + req.params.courseId);  
    });
});

module.exports = router;
