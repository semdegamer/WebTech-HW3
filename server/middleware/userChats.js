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
    if (user)
      user.res.removeListener("close", user.func);

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

function paramMessageChat(req, res, next, chat) {
  console.log(parseInt(chat));
  req.chatId = parseInt(chat);
  next();
}

function getMessageChat(req, res) {
  req.db.allSql(
    "SELECT studentId, concat(firstName, ' ', lastName) AS name, content, date, SUBSTR(Message.time, 1, 5) AS time " +
    "FROM Message " +
    "INNER JOIN Student " +
    "ON Student.studentId = Message.studentId_sender " +
    "WHERE Message.chatId = ? " +
    "ORDER BY Message.date DESC, Message.time DESC;", [req.chatId])
  .then((rows) => {
    res.render('user/messages', { messages: rows, userId: req.user.Id});
  })
}

function postMessageChat(req, res) {
  // create the message data.
  var date = dayjs().format("YYYY-MM-DD");
  var time = dayjs().format("HH:mm:ss:SSS");
  var message = {name: "sem", content: req.body.content, date: date, time: time};

  // save the message in the db
  req.db.runSql("INSERT INTO Message (chatId, studentId_sender, content, date, time) VALUES (?, ?, ?, ?, ?)", [req.chatId, req.user.Id, message.content, message.date, message.time])
  .then(() => {
    // send the chat to the other users
    ChatManager.getChat(req.chatId).sendMessage(message, req.user.Id);

    // return ok status without body and no caching
    res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
    res.sendStatus(204);
  })
}

function eventMessageChat(req, res) {
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

module.exports = {paramMessageChat, getMessageChat, postMessageChat, eventMessageChat};