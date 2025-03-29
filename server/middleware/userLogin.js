const bcrypt = require('bcrypt'); // Library for hashing passwords securely
const crypto = require('crypto'); // Library for generating secure random session tokens
const dayjs = require('dayjs'); // Library for handling date and time operations

function userLogin(req, res) {
  var data = req.body; // Get user login details from request

  // Check if the email exists in the database
  req.db.getSql("SELECT * FROM Student WHERE email = ?;", [data.email]
  ).then((row) => {
    if (!row)
      wrongEmail();
    else
      bcrypt.compare(data.password, row.password).then((result) => {
        if (result)
          success(row);
        else
          wrongPassword();
      }).catch(errorInternal);
  }).catch(errorInternal);

  function errorInternal(err) {
    console.log(err);
    res.send(JSON.stringify({
      success: false,
      message: "an internal error occured, try again later."
    }));
  }

  function wrongEmail() {
    res.send(JSON.stringify({
      success: false,
      message: "email address not found, register first."
    }));
  }

  function wrongPassword() {
    res.send(JSON.stringify({
      success: false,
      message: "incorrect password, please try again."
    }));
  }

  // Student is being logged in
  function success(student) {
    // Generate a secure session token
    const sessionId = crypto.randomBytes(32).toString('hex');

    // Set session expiration (1 hour from now)
    const expiresAt = dayjs().add(1, 'hour').unix();
    const createdAt = dayjs().unix(); // Current time (session creation time)

    // Store the session in the database
    req.db.runSql("INSERT INTO Sessions(sessionId, studentId, expiresAt, createdAt) VALUES (?, ?, ?, ?);", 
      [sessionId, student.id, expiresAt, createdAt]
    ).then(() => {
      // Send session token to the client
      res.cookie("sessionId", sessionId, { 
        httpOnly: true, 
        secure: true, 
        maxAge: 3600000 }); // Cookie expires in 1 hour
      res.send(JSON.stringify({
        success: true,
        message: "Login successful!"
      }));
    }).catch(errorInternal);
  }
}

module.exports = userLogin;