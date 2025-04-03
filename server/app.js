var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bcrypt = require('bcrypt');
//var helmet = require('helmet'); // security headers

var dbhelper = require('./middleware/databaseHelper');
var sessionMiddleware = require('./middleware/session');

var publicRouter = require('./routes/public');
var authRouter = require('./routes/auth');
var userRouter = require('./routes/user');
var userProfileRouter = require('./routes/userProfile');
var userCoursesRouter = require('./routes/userCourses');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.pretty = true;

var fs = require('fs');
var accessLogStream = fs.createWriteStream('./access.log', {flags: 'a'});
app.use(logger("dev")); // ,{stream: accessLogStream}
//app.use(helmet());
//app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(dbhelper);
app.use(sessionMiddleware);

app.use((req, res, next) => {
  console.log("_1");
  next();
});

// Ensure the name and photolink is available on all pages
app.use((req, res, next) => {
  if (req.session && req.session.user) {
    req.db.getSql(
      "SELECT firstName, lastName, photoLink FROM Student WHERE studentId = ?;",
      [req.session.user.studentId]
    )
      .then((user) => {
        res.locals.user = user || req.session.user; // Attach user to res.locals
        console.log("User object in middleware:", res.locals.user); // Debug statement
        next();
      })
      .catch((err) => {
        console.error("Error fetching user:", err);
        res.locals.user = req.session.user || null; // Fallback to session user
        next();
      });
  } else {
    res.locals.user = null; // No user logged in
    console.log("No user logged in."); // Debug statement
    next();
  }
});

app.use('/', publicRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);
app.use('/user', userProfileRouter); 
app.use('/user/courses', userCoursesRouter);

// catch 404 and forward to error handler
app.use(function(req, res, next) {
  next(createError(404));
});

// error handler
app.use(function(err, req, res, next) {
  console.log(err.message);
  console.log(err);

  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.render('public/error');
});

module.exports = app;
