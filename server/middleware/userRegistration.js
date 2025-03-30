const bcrypt = require('bcrypt');

function userRegistration(req, res) {
  const data = req.body;

  // Validate input fields
  if (!data.firstName || !data.lastName || !data.email || !data.password) {
    return res.send(JSON.stringify({ success: false, message: "All fields are required!" }));
  }

  // Check if the email already exists
  req.db.getSql("SELECT * FROM Student WHERE email = ?;", [data.email])
    .then((row) => {
      if (row) {
        return res.send(JSON.stringify({ success: false, message: "Email is already registered!" }));
      }

      // Hash the password
      return bcrypt.hash(data.password, 10);
    })
    .then((hashedPassword) => {
      if (!hashedPassword) return; // Prevent further execution if email exists
      
      return req.db.runSql("INSERT INTO Student (firstName, lastName, email, password) VALUES (?, ?, ?, ?);", 
        [data.firstName, data.lastName, data.email, hashedPassword]);
    })
    .then(() => {
      res.send(JSON.stringify({ success: true, message: "Registration successful!" }));
    })
    .catch((err) => {
      console.error(err);
      res.send(JSON.stringify({ success: false, message: "An internal error occurred. Please try again later." }));
    });
}

module.exports = userRegistration;
