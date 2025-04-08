const express = require('express');
const router = express.Router();

/* Handlers for messages root */
router.get('/', function (req, res, next) {
	var user = req.session.user;

	getUserFriends(req.db, user.studentId)
		.then((friends) => res.render('user/friends', { friends }))
		.catch(err => error(err, res, next, "Failed to load friends page."));
});

router.post('/', function (req, res, next) {
	var user = req.session.user;
	var friend = req.body.friendId;

	if (!friend || typeof friend !== 'number' || friend < 0 || friend > 1000000)
		return res.sendStatus(422);

	getFriendship(req.db, user.studentId, friend)
		.then(data => removeFriend(req.db, data.friendshipId).then(removeFriendship(req.db, data.friendshipId)))
		.then(() => res.json({ success: true }))
		.catch(err => error(err, res, next, "Failed to remove friendship."));
});


/* Helpfull functions */
function error(err, res, next, message) {
	console.log(message);
	res.locals.message = message;
	next(err);
}

/* Helpfull functions */
function getUserFriends(db, userId) {
	return db.allSql(`
    SELECT S2.studentId AS id, concat(S2.firstName, ' ', S2.lastName) AS name, S2.photoLink
    FROM Student S1
    NATURAL JOIN Friend
    NATURAL JOIN Friendship FS
    JOIN Friend F
    ON FS.friendshipId = F.friendshipId AND F.studentId != S1.studentId
    JOIN Student S2
    ON S2.studentId = F.studentId
    WHERE S1.studentId = ?;`, [userId]);
}

function getFriendship(db, userId, friendId) {
	return db.getSql(`
		SELECT FS.friendshipId
		FROM Friendship FS
		JOIN Friend F1
		ON F1.studentId = ?
		JOIN Friend F2
		ON F2.studentId = ?
		WHERE F1.friendshipId = FS.friendshipId AND F2.friendshipId = FS.friendshipId;`, [userId, friendId]);
}
function removeFriend(db, friendshipId) {
	return db.runSql(`
		DELETE FROM Friend
		WHERE friendshipId = ?;`, [friendshipId]);
}
function removeFriendship(db, friendshipId) {
	return db.runSql(`
		DELETE FROM Friendship
		WHERE friendshipId = ?;`, [friendshipId]);
}

module.exports = router;