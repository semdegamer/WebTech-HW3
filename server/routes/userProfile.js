const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create the user-images folder if it does not exist
const userImagesPath = path.join(__dirname, '../public/images/user-images');
if (!fs.existsSync(userImagesPath)) {
  fs.mkdirSync(userImagesPath, { recursive: true }); // Create the folder if it doesn't exist
  console.log("Created folder:", userImagesPath);
}

// multer for file uploads
const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, userImagesPath);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${req.session.user.studentId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  },
});
const upload = multer({ storage });

// GET Profile Page
router.get('/', (req, res) => {
  const studentId = req.session.user.studentId; 

  // Queries to fetch profile, all courses, and enrolled courses
  const profileQuery = `
    SELECT firstName, lastName, email, birthDate, photoLink, programId, hobbies 
    FROM Student 
    WHERE studentId = ?;
  `;
  const allCoursesQuery = "SELECT * FROM Course;";
  const enrolledCoursesQuery = `
    SELECT c.* FROM Course c
    JOIN CourseEnrollment ce ON c.courseID = ce.courseId
    WHERE ce.studentId = ?;
  `;
  const programQuery = `SELECT * FROM Program;`;

  // Fetch profile, all courses, and enrolled courses
  Promise.all([
    req.db.getSql(profileQuery, [studentId]),
    req.db.allSql(allCoursesQuery),
    req.db.allSql(enrolledCoursesQuery, [studentId]),
    req.db.allSql(programQuery),
  ])
    .then(([profile, allCourses, enrolledCourses, programs]) => {
      if (!profile) {
        return res.render('user/profile', { 
          user: req.session.user, 
          allCourses: [], 
          enrolledCourses: [], 
          programs: [],
          error: "Profile not found." 
        });
      }

      // Render the profile page with all required data
      res.render('user/profile', {
        user: profile,
        allCourses: allCourses || [],
        enrolledCourses: enrolledCourses || [],
        programs: programs || []
      });
    })
    .catch((err) => {
      console.error("Error fetching profile or courses:", err);
      res.render('user/profile', {
        user: req.session.user,
        allCourses: [],
        enrolledCourses: [],
        programs: [],
        error: "An error occurred while fetching the profile or courses."
      });
    });
});

// Update Profile
router.post('/update', (req, res) => {
  const { firstName, lastName, email, birthDate, programId, hobbies } = req.body;

  console.log("Received data:", req.body); // Debugging

  if (!firstName || !lastName || !email) {
    return res.json({ success: false, message: "First name, last name, and email are required!" });
  }

  req.db.runSql(
    "UPDATE Student SET firstName = ?, lastName = ?, email = ?, birthDate = ?, programId = ?, hobbies = ? WHERE studentId = ?;",
    [firstName, lastName, email, birthDate || null, programId || null, hobbies || null, req.session.user.studentId]
  )
  .then(() => {
    res.json({ success: true, message: "Profile updated successfully!" });
  })
  .catch((err) => {
    console.error("Profile update error:", err);
    res.json({ success: false, message: "An error occurred while updating the profile." });
  });
});

// Upload Avatar
router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  const avatarPath = `/images/user-images/${req.file.filename}`;

  req.db.runSql(
    "UPDATE Student SET photoLink = ? WHERE studentId = ?;",
    [avatarPath, req.session.user.studentId]
  )
    .then(() => {
      res.json({ success: true, message: "Avatar updated successfully!" });
    })
    .catch((err) => {
      console.error("Avatar update error:", err);
      res.status(500).json({ success: false, message: "An error occurred while updating the avatar." });
    });
});

// Enroll or Deselect a Course
router.post('/enroll', (req, res) => {
    const { courseId, action } = req.body;
    const studentId = req.session.user.studentId; 
  
    if (action === 'enroll') {
      req.db.runSql(
        'INSERT INTO CourseEnrollment (studentId, courseId) VALUES (?, ?)',
        [studentId, courseId]
      )
        .then(() => res.json({ success: true, message: 'Enrolled successfully!' }))
        .catch((err) => {
          if (err.code === 'SQLITE_CONSTRAINT') {
            // Handle duplicate enrollment
            res.status(400).json({ success: false, message: 'You are already enrolled in this course.' });
          } else {
            console.error('Enrollment error:', err);
            res.status(500).json({ success: false, message: 'Failed to enroll in the course.' });
          }
        });
    } else if (action === 'deselect') {
      req.db.runSql(
        'DELETE FROM CourseEnrollment WHERE studentId = ? AND courseId = ?',
        [studentId, courseId]
      )
        .then(() => res.json({ success: true, message: 'Deselected successfully!' }))
        .catch((err) => {
          console.error('Deselection error:', err);
          res.status(500).json({ success: false, message: 'Failed to deselect the course.' });
        });
    } else {
      res.status(400).json({ success: false, message: 'Invalid action.' });
    }
  });

module.exports = router;