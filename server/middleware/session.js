const crypto = require('crypto');
const dayjs = require('dayjs');

// Middleware to check session validity
module.exports = function sessionMiddleware(req, res, next) {
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
