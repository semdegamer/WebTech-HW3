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
      }

      return req.db.allSql("SELECT * FROM Course;");
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
  const currentUserId = req.session.user.studentId;

  // Query to get course details
  req.db.getSql("SELECT * FROM Course WHERE courseID = ?;", [courseId])
    .then(course => {
      if (!course) {
        return res.status(404).send("Course not found");
      }

      const sql = `
        SELECT 
          S.studentId, 
          S.firstName, 
          S.lastName, 
          S.photoLink,
          EXISTS (
            SELECT 1 FROM FriendRequest 
            WHERE studentId_sender = ? 
              AND studentId_receiver = S.studentId
          ) AS requestSent
        FROM Student S
        JOIN CourseEnrollment E ON E.studentId = S.studentId
        WHERE E.courseId = ? AND S.studentId != ?;
      `;

      return req.db.allSql(sql, [currentUserId, courseId, currentUserId])
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
    return res.status(401).json({ error: 'Not logged in' });
  }

  const studentId_receiver = req.body.studentId;
  const studentId_sender = req.session.user.studentId;

  req.db.runSql(`
    INSERT INTO FriendRequest (studentId_sender, studentId_receiver, date)
    VALUES (?, ?, DATE('now'))
  `, [studentId_sender, studentId_receiver])
    .then(() => {
      res.status(200).json({ success: true });
    })
    .catch(err => {
      console.error("Error sending friend request:", err);
      res.status(500).json({ error: "Failed to send friend request" });
    });
});

module.exports = router;
