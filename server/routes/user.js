const express = require('express');
const sessionMiddleware = require('../middleware/session');

const router = express.Router();
const nav = ["messages", "courses"];

router.use(sessionMiddleware);

/* GET Messages Page */
router.get('/messages', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/messages', { nav, user: req.session.user });
});

/* GET Courses Page */
router.get('/courses', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/courses', { nav, user: req.session.user });
});

/* GET Profile Page */
router.get('/profile', function (req, res) {
    if (!req.session || !req.session.user) {
        return res.redirect('/auth/login');
    }
    res.render('user/profile', { nav, user: req.session.user });
});

module.exports = router;
