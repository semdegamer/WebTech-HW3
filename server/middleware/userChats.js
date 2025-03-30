const dayjs = require('dayjs'); // Library for handling date and time operations
//const Mutex = require('async-mutex').Mutex;
const pug = require('pug');

const createMessage = pug.compileFile('views/user/messageGen.pug');

class ChatRoom {
  #users = {}

  constructor(Id) {
    this.chatId = Id;
  }

  sendMessage(message, senderId) {
    var time = dayjs().format("HH:mm");
    const lMessage = `data: ${JSON.stringify({message: createMessage({name: message.name, content: message.content, time: time, left: true}), focus: false})}\n\n`;
    const rMessage = `data: ${JSON.stringify({message: createMessage({name: message.name, content: message.content, time: time, left: false}), focus: true})}\n\n`; // , focus: false

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
  res.render('user/messages');
}

function postMessageChat(req, res) {
  // send the chat to the other users
  ChatManager.getChat(req.chatId).sendMessage({name: "sem", content: req.body.content}, req.user.Id);

  // return ok status without body
  res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
  res.sendStatus(204);
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

  ChatManager.getChat(req.chatId).addUser(req.user.Id, res);

  // var time = dayjs().format("HH:mm");
  // const sendData = `data: ${JSON.stringify({message: createMessage({name: "sem", content: "test", time: time, left: false})})}\n\n`;
  // res.write(sendData);

  console.log("new events");
  // if (chatList[0].users.length == 0) chatList[0].users.push(res);
  // chatRoom.getChat(req.chatId)[req.user.Id] = res;
  //getChat().then((chat) => (chat.users.length == 0) ? chat.users.push(res) : null);
  // res.on("close", (event) => {
  //   console.log(event);
  //   delete chatRoom.getChat(req.chatId)[req.user.Id];
  // });
}

module.exports = {paramMessageChat, getMessageChat, postMessageChat, eventMessageChat};