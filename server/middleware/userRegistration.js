const bcrypt = require('bcrypt');
const { createSession } = require('../middleware/session');

function userRegister(req, res) {
    const { firstName, lastName, email, password } = req.body;

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
            return req.db.runSql(
                "INSERT INTO Student (firstName, lastName, email, password) VALUES (?, ?, ?, ?);",
                [firstName, lastName, email, hashedPassword]
            );
        })
        .then(() => {
            // Fetch the newly created student to create a session
            return req.db.getSql("SELECT * FROM Student WHERE email = ?;", [email]);
        })
        .then((student) => {
            if (!student) {
                return res.json({ success: false, message: "User not found after registration." });
            }
            return createSession(req.db, student, res);
        })
        .then(() => {
            res.json({ success: true, message: "Registration successful! Logged in automatically." });
        })
        .catch((err) => {
            console.error("Registration error:", err);
            res.json({ success: false, message: "An internal error occurred. Please try again later." });
        });
}

module.exports = userRegister;
