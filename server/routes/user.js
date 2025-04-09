/* === User Pages Route Handler === */
const express = require('express');
const router = express.Router();

const messagesRouter = require('./userMessages');
const coursesRouter = require('./userCourses');
const friendsRouter = require('./userFriends');
const profileRouter = require('./userProfile');

router.use(function (req, res, next) {
  if (!req.loggedIn) {
    switch (req.method) {
      case 'GET':
        return res.status(401);
      case 'POST':
        return res.status(401);
      case 'PUT':
        return res.status(401);
      default:
        return res.status(401);
    }
  }

  next();
});

/* GET Messages Page */
router.use('/messages', messagesRouter);

/* GET Courses Page */
router.use('/courses', coursesRouter);

/* GET Friends Page */
router.use('/friends', friendsRouter);

/* GET Profile Page */
router.use('/profile', profileRouter);

module.exports = router;