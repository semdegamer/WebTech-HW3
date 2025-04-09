var createError = require('http-errors');
var express = require('express');
var path = require('path');
var cookieParser = require('cookie-parser');
var logger = require('morgan');
var bcrypt = require('bcrypt');
//var helmet = require('helmet'); // security headers

var dbhelper = require('./middleware/databaseHelper');
var sessionMiddleware = require('./middleware/session');
var insertDataIntoDb = require('./private/populateDatabase');

var publicRouter = require('./routes/public');
var authRouter = require('./routes/auth');
var userRouter = require('./routes/user');

var app = express();

// Populate the database
insertDataIntoDb()
  .then(() => {
    console.log('Database populated successfully!');
  })
  .catch((err) => {
    console.error('Error populating the database:', err);
  });

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'pug');
app.locals.pretty = true;

// logging to access.log file
var fs = require('fs');
var accessLogStream = fs.createWriteStream('./app.log', {flags: 'a'});
app.use(logger("dev", {stream: accessLogStream}));
app.disable('x-powered-by');
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use(dbhelper);
app.use(sessionMiddleware);
app.use(sessionMiddleware.attachUserToLocals);

app.use('/', publicRouter);
app.use('/auth', authRouter);
app.use('/user', userRouter);

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
  res.locals.errStatus = err.status;

  // render the error page
  res.status(err.status || 500);
  res.render('public/error');
});

module.exports = app;
