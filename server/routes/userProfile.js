const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs');
const router = express.Router();

// Create user-images folder if it doesn't exist
const userImagesPath = path.join(__dirname, '../public/images/user-images');
if (!fs.existsSync(userImagesPath)) {
  fs.mkdirSync(userImagesPath, { recursive: true });
  console.log("Created folder:", userImagesPath);
}

// Multer config
const storage = multer.diskStorage({
  destination: (req, file, cb) => cb(null, userImagesPath),
  filename: (req, file, cb) => {
    const uniqueName = `${req.session.user.studentId}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});
const upload = multer({ storage });

/* ========== ROUTES ========== */

// GET Own Profile
router.get('/', async (req, res, next) => {
  const studentId = req.session.user.studentId;
  try {
    const [profile, allCourses, enrolledCourses, programs, friendRequests] = await Promise.all([
      req.db.getSql(`SELECT studentId, firstName, lastName, email, birthDate, photoLink, programId, hobbies FROM Student WHERE studentId = ?`, [studentId]),
      req.db.allSql(`SELECT * FROM Course;`),
      req.db.allSql(`SELECT c.* FROM Course c JOIN CourseEnrollment ce ON c.courseID = ce.courseId WHERE ce.studentId = ?`, [studentId]),
      req.db.allSql(`SELECT * FROM Program;`),
      req.db.allSql(`
        SELECT s.studentId, s.firstName, s.lastName, s.photoLink
        FROM FriendRequest fr
        JOIN Student s ON fr.studentId_sender = s.studentId
        WHERE fr.studentId_receiver = ?
      `, [studentId])
    ]);

    res.render('user/profileOwn', {
      user: profile,
      allCourses,
      enrolledCourses,
      programs,
      friendRequests,
      viewType: 'own'
    });
  } catch (err) {
    console.error("Error loading own profile:", err);
    next(err);
  }
});

// GET Another User’s Profile
router.get('/:id', async (req, res, next) => {
  const viewerId = req.session.user.studentId;
  const viewedId = req.params.id;

  try {
    const profile = await req.db.getSql(`
      SELECT studentId, firstName, lastName, email, birthDate, photoLink, programId, hobbies
      FROM Student WHERE studentId = ?`, [viewedId]);

    if (!profile) {
      return res.status(404).render('user/profile', { error: "User not found", viewType: 'nofriend' });
    }

    const isFriend = await req.db.getSql(`
      SELECT COUNT(*) AS count
      FROM Friend f1 JOIN Friend f2 ON f1.friendshipId = f2.friendshipId
      WHERE f1.studentId = ? AND f2.studentId = ?
    `, [viewerId, viewedId]);

    const profileFile = isFriend.count > 0 ? 'user/profileFriend' : 'user/profileNoFriend';

    res.render(profileFile, {
      user: profile,
      allCourses: [],
      enrolledCourses: [],
      programs: [],
      friendRequests: [],
    });

  } catch (err) {
    console.error("Error viewing other profile:", err);
    next(err);
  }
});

// Update Profile
router.post('/update', (req, res) => {
  const { firstName, lastName, email, birthDate, programId, hobbies } = req.body;
  const studentId = req.session.user.studentId;

  if (!firstName || !lastName || !email) {
    return res.json({ success: false, message: "Missing required fields!" });
  }

  req.db.runSql(
    `UPDATE Student SET firstName = ?, lastName = ?, email = ?, birthDate = ?, programId = ?, hobbies = ? WHERE studentId = ?`,
    [firstName, lastName, email, birthDate || null, programId || null, hobbies || null, studentId]
  )
    .then(() => res.json({ success: true, message: "Profile updated!" }))
    .catch(err => {
      console.error("Update error:", err);
      res.json({ success: false, message: "Update failed." });
    });
});

// Upload Avatar
router.post('/upload-avatar', upload.single('avatar'), (req, res) => {
  const avatarPath = `/images/user-images/${req.file.filename}`;
  const studentId = req.session.user.studentId;

  req.db.runSql(`UPDATE Student SET photoLink = ? WHERE studentId = ?`, [avatarPath, studentId])
    .then(() => res.json({ success: true, message: "Avatar updated succesfully!" }))
    .catch(err => {
      console.error("Avatar error:", err);
      res.status(500).json({ success: false, message: "Avatar upload failed." });
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

// Accept Friend Request
router.post('/friend-request/accept', async (req, res) => {
  const senderId = req.body.studentIdSender; // The sender's ID, sent from the client
  const receiverId = req.session.user.studentId; // The receiver's ID from the session

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Missing student ID(s).' });
  }

  try {
    // 1. Create a new friendship record
    await req.db.runSql(`INSERT INTO Friendship (date) VALUES (DATE('now'))`);

    // 2. Get the newly created friendshipId
    const { id: friendshipId } = await req.db.getSql(`SELECT last_insert_rowid() AS id`);

    // 3. Add both students to the Friend table
    await req.db.runSql(
      `INSERT INTO Friend (friendshipId, studentId) VALUES (?, ?)`,
      [friendshipId, senderId]
    );

    await req.db.runSql(
      `INSERT INTO Friend (friendshipId, studentId) VALUES (?, ?)`,
      [friendshipId, receiverId]
    );

    // 4. Remove the friend request after accepting
    await req.db.runSql(
      `DELETE FROM FriendRequest WHERE studentId_sender = ? AND studentId_receiver = ?`,
      [senderId, receiverId]
    );

    // 5. Return a success response
    res.json({ success: true });
  } catch (err) {
    console.error('Error accepting friend request:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

// Decline Friend Request
router.post('/friend-request/decline', async (req, res) => {
  const senderId = req.body.studentIdSender; // The sender's ID from the client
  const receiverId = req.session.user.studentId; // The logged-in user's (receiver's) ID

  if (!senderId || !receiverId) {
    return res.status(400).json({ error: 'Missing student ID(s).' });
  }

  try {
    await req.db.runSql(`DELETE FROM FriendRequest WHERE studentId_sender = ? AND studentId_receiver = ?`, [senderId, receiverId]);
    res.json({ success: true });
  } catch (err) {
    console.error('Error declining friend request:', err);
    res.status(500).json({ error: 'Something went wrong.' });
  }
});

module.exports = router;
