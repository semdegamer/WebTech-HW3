/* === Manages user sessions: checks session validity, creates sessions, and attaches user info to response locals for templating. === */
const crypto = require('crypto');
const dayjs = require('dayjs');

// Middleware to check session validity
module.exports = function sessionMiddleware(req, res, next) {
    req.endSession = function() {
        return req.db.runSql("DELETE FROM Session WHERE sessionId = ?;", [req.cookies.sessionId]);
    };

    // TODO: waarvoor is dit?
    const excludedRoutes = ['/auth/login', '/auth/register']; // Exclude only auth-related routes
    if (excludedRoutes.includes(req.path)) {
        return next(); // Skip middleware for these routes
    }

    const sessionId = req.cookies.sessionId;
    req.loggedIn = false; // Default to not logged in
    req.session = null; 
    req.user = null; 

    if (!sessionId) {
        return next(); // No session, but don't redirect for public routes like `/`
    }
    // TODO: check sessionId length, if length is not correct, no need for the query.

    req.db.getSql("SELECT studentId, expiresAt FROM Session WHERE sessionId = ?", [sessionId])
        .then((session) => {
            if (!session || session.expiresAt < dayjs().unix()) {
                res.clearCookie('sessionId');
                return next(); // Session expired or invalid, but don't redirect
            }
            // TODO: extend expiration time of session, since the user is still active.
            return req.db.getSql("SELECT * FROM Student WHERE studentId = ?", [session.studentId]);
        })
        .then((student) => {
            if (student) {
                req.session = { user: student };
                req.loggedIn = true;
                req.user = student;
            }
            next(); 
        })
        .catch((err) => {
            console.error("Session error:", err);
            // TODO: if an error happened, it might be better to call next with error
            next(); 
        });
};

// Function to create a new session
module.exports.createSession = function (db, student, res) {
    const studentId = student.studentId; 

    if (!studentId) {
        console.error("Invalid student object passed to createSession:", student);
        return Promise.reject(new Error("Invalid student object"));
    }

    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = dayjs().add(1, 'hour').unix();
    const createdAt = dayjs().unix();

    return db.runSql(
        "INSERT INTO Session(sessionId, studentId, expiresAt, createdAt) VALUES (?, ?, ?, ?);",
        [sessionId, studentId, expiresAt, createdAt]
    ).then(() => {
        res.cookie("sessionId", sessionId, {
            httpOnly: true,
            // secure: true,
            sameSite: 'Strict',
            maxAge: 3600000 
        });
    });
};

// Ensure the name and photolink is available on all pages
module.exports.attachUserToLocals = function (req, res, next) {
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
};
