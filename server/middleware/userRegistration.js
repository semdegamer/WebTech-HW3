const bcrypt = require('bcrypt');
const { createSession } = require('../middleware/session');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

// Setup for storing user avatars
const userImagesPath = path.join(__dirname, '../public/images/user-images');
if (!fs.existsSync(userImagesPath)) {
  fs.mkdirSync(userImagesPath, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, userImagesPath); // Save avatars in the user-images folder
  },
  filename: (req, file, cb) => {
    const uniqueName = `${Date.now()}-${file.originalname}`;
    cb(null, uniqueName); // Give each uploaded avatar a unique name
  }
});

const upload = multer({ storage });

// Handle Avatar Upload in Registration and Update Avatar Path
function userRegister(req, res) {
  // If the avatar is being uploaded
  upload.single('avatar')(req, res, (err) => {
    if (err) {
      return res.json({ success: false, message: "Error uploading avatar!" });
    }

    // debugging
    console.log('Request body:', req.body);
    console.log('File uploaded:', req.file);

    const { firstName, lastName, email, password, birthDate, hobbies, courseIds, programId } = req.body;
    const avatarPath = req.file ? `/images/user-images/${req.file.filename}` : null; // Avatar file path

    // Validate input fields
    if (!firstName || !lastName || !email || !password) {
      return res.json({ success: false, message: "All fields are required!" });
    }

    // Character limits
    if (
      firstName.length < 2 || firstName.length > 50 ||
      lastName.length < 2 || lastName.length > 50 ||
      email.length > 100 ||
      password.length < 8 || password.length > 100
    ) {
      return res.json({ success: false, message: "Invalid input length!" });
    }

    // Name validation (only letters allowed)
    const nameRegex = /^[a-zA-Z]+$/;
    if (!nameRegex.test(firstName) || !nameRegex.test(lastName)) {
      return res.json({ success: false, message: "Names can only contain letters!" });
    }

    // Email validation
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return res.json({ success: false, message: "Invalid email format!" });
    }

    // Check if the email already exists in the database
    req.db.getSql("SELECT * FROM Student WHERE email = ?;", [email])
      .then((existingStudent) => {
        if (existingStudent) {
          return res.json({ success: false, message: "Email is already registered!" });
        }
        // Hash the password
        return bcrypt.hash(password, 10);
      })
      .then((hashedPassword) => {
        // Insert new student into the database with avatar path
        return req.db.runSql(
          "INSERT INTO Student (firstName, lastName, email, password, birthDate, hobbies, photoLink, programId) VALUES (?, ?, ?, ?, ?, ?, ?, ?);",
          [
            firstName,
            lastName,
            email,
            hashedPassword,
            birthDate || null,
            hobbies || null,
            avatarPath,
            programId || null
          ]
        );
      })
      .then(() => {
        // Retrieve the student record after insertion to get studentId
        return req.db.getSql("SELECT * FROM Student WHERE email = ?;", [email]);
      })
      .then((student) => {
        // If student record can't be found after registration, return an error
        if (!student) {
          return res.json({ success: false, message: "User not found after registration." });
        }

        // Enroll the student in the selected program
        const programEnroll = req.db.runSql(
          "INSERT INTO ProgramEnrollment (studentId, programId) VALUES (?, ?);",
          [student.studentId, programId]
        );

        // Enroll the student in selected courses, if any
        const enrollments = (courseIds || []).map(courseId =>
          req.db.runSql("INSERT INTO CourseEnrollment (studentId, courseId) VALUES (?, ?)", [student.studentId, courseId])
        );

        // Create a session for the newly registered student and process course enrollments
        return Promise.all([programEnroll, createSession(req.db, student, res), ...enrollments]);
      })
      .then(() => {
        // Respond to the client with a success message
        res.json({ success: true, message: "Registration successful! Logged in automatically." });
      })
      .catch((err) => {
        // Handle and log any unexpected errors during registration
        console.error("Registration error:", err);
        res.json({ success: false, message: "An internal error occurred. Please try again later." });
      });
  });
}

module.exports = userRegister;
