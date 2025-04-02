const express = require('express');

const router = express.Router();

const dayjs = require('dayjs'); // Library for handling date and time operations
const pug = require('pug');
const createMessageHtml = pug.compileFile('views/user/messageGen.pug');

/* temp formatting of data */
router.use(function (req, res, next) {
	// for normalized usage of session data, so i can make the message router.
	// TODO: this may need to be changed later depending on how the session gives its data.
	req.session = {
		loggedIn: true,
		user: {
			id: req.user.Id,
			name: "name"
		}
	};

	next();
});

/* PARAM handler for chat variable */
router.param('chat', function (req, res, next, chat) {
	var chatId = parseInt(chat);
	// check if chatId is valid
	if (isNaN(chatId) || chatId > 1000000) return;

	// check if current user has access to the chat.
	hasChatAccess(req.db, req.session.user.id, chatId)
		.then(chat => {
			// no access to chat, so deny further routing.
			if (!chat)
				return error(new Error("no access to requested chat"), res, next, "User does not have access to requested Chat.");

			// add chatId and info to session for easy access by other later functions.
			req.session.chat = {
				id: chat.id,
				name: chat.name
			};

			next();
		})
		.catch(err => next(err));
});

/* Handlers for messages root */
router.get('/', function (req, res, next) {
	let data = {};
	var user = req.session.user;

	getUserChats(req.db, user.id)
		.then(result => data.chats = result)
		.then(() => getUserFriends(req.db, user.id))
		.then(result => data.friends = result)
		.then(() => {
			res.render('user/messages_empty', { user, ...data });
		})
		.catch(err => error(err, res, next, "Unable to load chat page"));
});

router.post('/', function (req, res, next) {
	var user = req.session.user;
	var chat; // TODO: check function scope

	var name = req.body.name;
	if (name.length > 100 || !onlyLettersAndNumbers(name))
		return res.sendStatus(422); // invalid post data

	var memberJsonList = req.body.members;
	var memberList = JSON.parse(memberJsonList);
	if (!Array.isArray(memberList) || memberList.length == 0 || memberList.some(el => typeof el !== 'number'))
		return res.sendStatus(422); // invalid post data

	// verifies that the group participents are the users friends
	verifyFriends(req.db, user.id, memberList)
		.then(result => {
			if (result)
				return res.sendStatus(422);
			else {
				// the creating user also has access the chat.
				memberList.push(user.id);

				createChat(req.db, name)
					.then(data => {
						let promises = [];
						chat = data.lastID;

						memberList.forEach(member => promises.push(createChatParticipent(req.db, chat, user.id)));

						return Promise.all(promises);
					})
					.then(() => {
						res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
						res.setHeader("Content-Type", "text/plain");
						res.render("user/chatGen", { chat: { name, chatId: chat } });
					})
					.catch(err => error(err, res, next, "Unable to create Chat"));
			}
		})
});

/* Handlers for messages chat */
router.get('/:chat', function (req, res, next) {
	var data = {};
	var user = req.session.user;
	var chat = req.session.chat;

	getUserChats(req.db, user.id)
		.then(result => data.chats = result)
		.then(() => getUserFriends(req.db, user.id))
		.then(result => data.friends = result)
		.then(() => getChatMessages(req.db, chat.id))
		.then(result => data.messages = result)
		.then(() => {
			res.render('user/messages_chatbox', { userId: user.id, chatName: chat.name, ...data });
		})
		.catch(err => error(err, res, next, "Unable to load chat page"));
});

router.post('/:chat', function (req, res, next) {
	var user = req.session.user;
	var chat = req.session.chat;

	// create the message data.
	var date = dayjs().format("YYYY-MM-DD");
	var time = dayjs().format("HH:mm:ss:SSS");

	// because we render messages with pug, there is no need to escape symbols in the content of the message
	var message = req.body.content;
	if (!message || message.length == 0 || message.length > 1000)
		return req.sendStatus(422); // invalid post data

	createMessage(req.db, chat.id, user.id, message, date, time)
		.then(() => {
			// send the chat to the other users
			ChatManager.getChat(chat.id).sendMessage({ name: user.name, content: message, date, time: time.substring(0, 5) }, user.id);

			// return ok status without body and no caching
			res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
			res.sendStatus(204);
		})
		.catch(err => error(err, res, next, "Unable to create or send message"));
});

/* GET handler for chat event stream */
router.get('/:chat/events', function (req, res, next) {
	// https://dev.to/andreyen/sending-messages-to-clients-in-realtime-using-server-sent-events-nodejs-and-react-2g90
	const headers = {
		// The 'text/event-stream' connection type
		// is required for SSE
		'Content-Type': 'text/event-stream',
		'Access-Control-Allow-Origin': '*',
		// Setting the connection open 'keep-alive'
		'Connection': 'keep-alive',
		'Cache-Control': 'no-cache'
	};
	// Write successful response status 200 in the header
	res.writeHead(200, headers);

	// add user to the chat as listener to new messages.
	ChatManager.getChat(req.session.chat.id).addUser(req.session.user.id, res);
});

module.exports = router;

/* Chat management classes*/

class ChatRoom {
	#users = {}

	constructor(Id) {
		this.chatId = Id;
	}

	sendMessage(message, senderId) {
		const lMessage = `data: ${JSON.stringify({ message: createMessageHtml({ name: message.name, content: message.content, time: message.time, left: true }), focus: false })}\n\n`;
		const rMessage = `data: ${JSON.stringify({ message: createMessageHtml({ name: message.name, content: message.content, time: message.time, left: false }), focus: true })}\n\n`; // , focus: false

		Object.keys(this.#users).forEach(userId => {
			let user = this.#users[userId];

			if (userId == senderId)
				user.res.write(rMessage);
			else
				user.res.write(lMessage);
		});
	}

	addUser(userId, res) {
		var user = this.#users[userId];
		if (user) {
			user.res.removeListener("close", user.func);
			user.res.end();
		}

		var func = () => this.#removeUser(userId);
		res.on("close", func);
		this.#users[userId] = { res: res, func: func };
	}

	#removeUser(userId) {
		delete this.#users[userId];
	}
}

class ChatManager {
	static #chatRooms = {}

	static getChat(chatId) {
		var chatRoom = this.#chatRooms[chatId];
		if (!chatRoom) {
			chatRoom = new ChatRoom(chatId);
			this.#chatRooms[chatId] = chatRoom;
		}
		return chatRoom;
	}
}

/* Helpfull functions */
function error(err, res, next, message) {
	console.log(message);
	res.locals.message = message;
	next(err);
}
function onlyLettersAndNumbers(str) {
	return /^[A-Za-z0-9]*$/.test(str);
}

/* Query functions */
function hasChatAccess(db, userId, chatId) {
	return db.getSql(`
		SELECT chatId AS id, name
		FROM Chat C
		NATURAL JOIN ChatParticipent
		NATURAL JOIN Student S
		WHERE S.studentId = ? AND C.chatId = ?;`, [userId, chatId]
	);
}

function getUserFriends(db, userId) {
	return db.allSql(`
    SELECT S2.studentId, concat(S2.firstName, ' ', S2.lastName) AS name
    FROM Student S1
    NATURAL JOIN Friend
    NATURAL JOIN Friendship FS
    JOIN Friend F
    ON FS.friendshipId = F.friendshipId AND F.studentId != S1.studentId
    JOIN Student S2
    ON S2.studentId = F.studentId
    WHERE S1.studentId = ?;`, [userId]);
}
function getUserChats(db, userId) {
	return db.allSql(`
		SELECT chatId, name
		FROM Student S
		NATURAL JOIN ChatParticipent
		NATURAL JOIN Chat
		WHERE S.studentId = ?;`, [userId]);
}
function getChatMessages(db, chatId) {
	return db.allSql(`
		SELECT studentId, concat(firstName, ' ', lastName) AS name, content, date, SUBSTR(Message.time, 1, 5) AS time
		FROM Message
		INNER JOIN Student
		ON Student.studentId = Message.studentId_sender
		WHERE Message.chatId = ?
		ORDER BY Message.date DESC, Message.time DESC;`, [chatId]);
}

function createMessage(db, chatId, userId, message, date, time) {
	return db.runSql(`
		INSERT INTO Message (chatId, studentId_sender, content, date, time)
		VALUES (?, ?, ?, ?, ?)`, [chatId, userId, message, date, time]);
}

function verifyFriends(db, userId, idList) {
	return db.getSql(`
    SELECT studentId
    FROM Student S
    WHERE S.studentId = ? AND EXISTS (
      SELECT value
      FROM json_each(?)
      WHERE NOT EXISTS (
        SELECT *
        FROM Friend F1
        NATURAL JOIN Friendship FS
        JOIN Friend F2
        ON F2.friendshipId = FS.friendshipId AND F2.studentId != S.studentId
        WHERE F1.studentId = S.studentId AND F2.studentId = value
      )
    );`, [userId, JSON.stringify(idList)]);
}

function createChat(db, name) {
	return db.runSql(`
		INSERT INTO Chat(creationDate, name)
		VALUES (strftime('%Y-%m-%d','now'), ?);`, [name]);
}

function createChatParticipent(db, chatId, userId) {
	return req.db.runSql(`
		INSERT INTO ChatParticipent(chatId, studentId)
		VALUES (?, ?)`, [lastID, member]);
}