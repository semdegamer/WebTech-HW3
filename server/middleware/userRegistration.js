const bcrypt = require('bcrypt');
const { createSession } = require('../middleware/session');

function userRegister(req, res) {
  const { firstName, lastName, email, password } = req.body;

  // Validate input fields
  if (!firstName || !lastName || !email || !password) {
    return res.json({ success: false, message: "All fields are required!" });
  }

  // Check if the email already exists in the database
  req.db.getSql("SELECT * FROM Student WHERE email = ?;", [email])
    .then((row) => {
      if (row) {
        return res.json({ success: false, message: "Email is already registered!" });
      }

      // Hash the password
      return bcrypt.hash(password, 10);
    })
    .then((hashedPassword) => {
      if (!hashedPassword) return; // Prevent further execution if password hashing failed

      // Insert the new student into the database
      return req.db.runSql(
        "INSERT INTO Student (firstName, lastName, email, password) VALUES (?, ?, ?, ?);",
        [firstName, lastName, email, hashedPassword]
      );
    })
    .then(() => {
      // Fetch the newly registered user from the database
      req.db.getSql("SELECT * FROM Student WHERE email = ?;", [email])
  .then((students) => {
    if (!students || students.length === 0) {
      return res.json({ success: false, message: "User not found after registration." });
    }

    const student = students[0]; // Get the first user


          // Create a session for the newly registered user
          createSession(req.db, student, res).then(() => {
            res.json({
              success: true,
              message: "Registration successful! Logged in automatically.",
            });
          }).catch(errorInternal);
        }).catch(errorInternal);
    }).catch(errorInternal);

  function errorInternal(err) {
    console.error("Registration error:", err);
    res.json({ success: false, message: "An internal error occurred. Please try again later." });
  }
}

module.exports = userRegister;
