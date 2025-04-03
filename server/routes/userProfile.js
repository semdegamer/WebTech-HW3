const express = require('express');
const bcrypt = require('bcrypt');
const multer = require('multer');
const path = require('path');
const router = express.Router();

// multer for file uploads
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
      cb(null, path.join(__dirname, '../public/images/user-images')); 
    },
    filename: (req, file, cb) => {
      const uniqueName = `${req.session.user.studentId}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    },
  });
  const upload = multer({ storage });

// GET Profile Page
router.get('/', (req, res) => {
  if (!req.loggedIn) {
    return res.redirect('/auth/login');
  }

  req.db.getSql("SELECT firstName, lastName, email, birthDate, photoLink, programId, hobbies FROM Student WHERE studentId = ?;", 
    [req.session.user.studentId]
  )
  .then((profile) => {
    if (!profile) {
      return res.render('user/profile', { user: req.session.user, error: "Profile not found." });
    }
    res.render('user/profile', { user: profile });
  })
  .catch((err) => {
    console.error("Profile fetch error:", err);
    res.render('user/profile', { user: req.session.user, error: "An error occurred while fetching the profile." });
  });
});

// Update Profile
router.post('/update', (req, res) => {
  if (!req.loggedIn) {
    return res.status(401).json({ success: false, message: "Unauthorized" });
  }

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
    if (!req.loggedIn) {
      return res.status(401).json({ success: false, message: "Unauthorized" });
    }
  
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

module.exports = router;
