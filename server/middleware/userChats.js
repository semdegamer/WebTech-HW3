const dayjs = require('dayjs'); // Library for handling date and time operations
const pug = require('pug');

const createMessage = pug.compileFile('views/user/messageGen.pug');

class ChatRoom {
  #users = {}

  constructor(Id) {
    this.chatId = Id;
  }

  sendMessage(message, senderId) {
    const lMessage = `data: ${JSON.stringify({message: createMessage({name: message.name, content: message.content, time: message.time, left: true}), focus: false})}\n\n`;
    const rMessage = `data: ${JSON.stringify({message: createMessage({name: message.name, content: message.content, time: message.time, left: false}), focus: true})}\n\n`; // , focus: false

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
    if (user){
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

// TODO: verify whether user has access to this chat
function paramMessageChat(req, res, next, chat) {
  var chatId = parseInt(chat);
  if (chatId > 1000000) return;

  req.db.getSql(`
    SELECT chatId
    FROM Chat C
    NATURAL JOIN ChatParticipent
    NATURAL JOIN Student S
    WHERE C.chatId = ? AND S.studentId = ?;`, [chatId, req.user.Id])
  .then((row) => {
    if (row){
      req.chatId = chatId;
      next();
    }
    else
      next(new Error("no access to this chat"));
  })
}

function getFriendsAndChats(req) {
  return req.db.allSql(`
    SELECT S2.studentId, concat(S2.firstName, ' ', S2.lastName) AS name
    FROM Student S1
    NATURAL JOIN Friend
    NATURAL JOIN Friendship FS
    JOIN Friend F
    ON FS.friendshipId = F.friendshipId AND F.studentId != S1.studentId
    JOIN Student S2
    ON S2.studentId = F.studentId
    WHERE S1.studentId = ?;`, [req.user.Id])
  .then((friends) => ({friends}))
  .then((data) => {
    return req.db.allSql(`
      SELECT chatId, name
      FROM Student S
      NATURAL JOIN ChatParticipent
      NATURAL JOIN Chat
      WHERE S.studentId = ?;`, [req.user.Id])
    .then((chats) => {
      data.chats = chats;
      return data;
  })});
}

function getChatsPage(req, res) {
  getFriendsAndChats(req).then(data => {
    res.render('user/messages_empty', { user: req.session.user, friends: data.friends, chats: data.chats});
  });
}

function getMessagePage(req, res) {
  getFriendsAndChats(req).then((data) => {
    return req.db.allSql(`
      SELECT studentId, concat(firstName, ' ', lastName) AS name, content, date, SUBSTR(Message.time, 1, 5) AS time
      FROM Message
      INNER JOIN Student
      ON Student.studentId = Message.studentId_sender
      WHERE Message.chatId = ?
      ORDER BY Message.date DESC, Message.time DESC;`, [req.chatId])
    .then(messages => {
      data.messages = messages;
      return data;
    });
  }).then((data) => {
    res.render('user/messages_chatbox', { messages: data.messages, friends: data.friends, chats: data.chats, userId: req.user.Id});
  }).catch(err => console.log(err))
}

function postMessage(req, res) {
  // create the message data.
  var date = dayjs().format("YYYY-MM-DD");
  var exactTime = dayjs().format("HH:mm:ss:SSS");
  if (!req.body.content || req.body.content.length == 0) throw new Error("incorrect message");

  req.db.getSql(`
    SELECT concat(firstName, ' ', lastName) AS name
    FROM Student
    WHERE studentId = ?;`, [req.user.Id])
  .then((row) => {
    var message = {name: row.name, content: req.body.content, date: date, time: exactTime.substring(0, 5)};
    
    // because we render messages with pug, there is no need to escape symbols in the content of the message
    // save the message in the db
    return req.db.runSql("INSERT INTO Message (chatId, studentId_sender, content, date, time) VALUES (?, ?, ?, ?, ?)", [req.chatId, req.user.Id, message.content, message.date, exactTime])
    .then(() => {
      // send the chat to the other users
      ChatManager.getChat(req.chatId).sendMessage(message, req.user.Id);
  
      // return ok status without body and no caching
      res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
      res.sendStatus(204);
    });
  }).catch(err => console.log(err));
}

function createChat(req, res) {
  var name = req.body.name;
  var members = req.body.members;

  var lastID;

  // verify that members are friends
  var memberList = members.split(",");
  if (memberList.length == 0) throw new Error("no chat members");
  memberList.splice(0, 1); // remove first item as that one is empty
  req.db.getSql(`
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
    );`, [req.user.Id, JSON.stringify(memberList)])
  .then((row) => {
    // if there is a row, that means one member was not a friend
    if (row)
      res.sendStatus(422);
    else{
      memberList.push(req.user.Id);
      req.db.runSql(`
        INSERT INTO Chat(creationDate, name)
        VALUES (strftime('%Y-%m-%d','now'), ?);`, [name])
      .then((data) => {
        var promises = [];
        lastID = data.lastID;

        memberList.forEach(member => {
          promises.push(req.db.runSql(`
              INSERT INTO ChatParticipent(chatId, studentId)
              VALUES (?, ?)`, [lastID, member]));
        });

        return Promise.all(promises);
      }).then(() => {
        res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
        res.setHeader("Content-Type", "text/plain");
        res.render("user/chatGen", {chat: { name, chatId: lastID } });
      }).catch(err => console.log(err));
    }
  })
  .catch(err => console.log(err));
}

// strftime('%Y-%m-%d %H-%M-%S','now')
function messageStream(req, res) {
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
  ChatManager.getChat(req.chatId).addUser(req.user.Id, res);
}

module.exports = {paramMessageChat, getMessagePage, postMessage, messageStream, createChat, getChatsPage};