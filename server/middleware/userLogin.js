const bcrypt = require('bcrypt'); 
const { createSession } = require('../middleware/session');

function userLogin(req, res) {
  const data = req.body; // Get user login details from request

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
    createSession(req.db, student, res).then(() => {
        res.json({ success: true, message: "Login successful!" });
    }).catch(errorInternal);
  }
}

module.exports = userLogin;