const crypto = require('crypto');
const dayjs = require('dayjs');

// This middleware checks if a session exists for the user and if it is valid
module.exports = function sessionMiddleware(req, res, next) {
    const sessionId = req.cookies.sessionId;

    if (!session || session.expiresAt < dayjs().unix()) {
        res.clearCookie('sessionId');
        return res.redirect('/auth/login'); 
    }

    req.db.getSql("SELECT studentId, expiresAt FROM Sessions WHERE sessionId = ?", [sessionId])
        .then((session) => {
            if (!session || session.expiresAt < dayjs().unix()) {
                res.clearCookie('sessionId');
                return next(); // No valid session found, redirect to login
            }

            req.db.getSql("SELECT * FROM Student WHERE id = ?", [session.studentId])
                .then((student) => {
                    if (!student) {
                        res.clearCookie('sessionId');
                        return next();
                    }

                    req.session = { user: student }; // Store the student data in the session
                    next();
                })
                .catch((err) => {
                    console.error("Error fetching student:", err);
                    next();
                });
        })
        .catch((err) => {
            console.error("Error checking session:", err);
            next();
        });
};

// This function creates a new session for the student and sets a cookie in the response
module.exports.createSession = function (db, student, res) {
    const sessionId = crypto.randomBytes(32).toString('hex');
    const expiresAt = dayjs().add(1, 'hour').unix();
    const createdAt = dayjs().unix();

    return db.runSql("INSERT INTO Sessions(sessionId, studentId, expiresAt, createdAt) VALUES (?, ?, ?, ?);",
        [sessionId, student.id, expiresAt, createdAt]
    ).then(() => {
        res.cookie("sessionId", sessionId, {
            httpOnly: true,
            secure: true, 
            sameSite: 'Strict', // Prevent CSRF attacks
            maxAge: 3600000 // 1 hour
            
        });
    });
};
