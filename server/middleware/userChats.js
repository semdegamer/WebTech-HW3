const dayjs = require('dayjs'); // Library for handling date and time operations
const Mutex = require('async-mutex').Mutex;
const pug = require('pug');

const createMessage = pug.compileFile('views/user/messageGen.pug');

const chatList = {};
const chatRoom = {
  getChat: (chatId) => {
    var chat = chatList[chatId];
    if (!chat) {
      chat = {};
      chatList[chatId] = chat;
    }
    return chat;
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
  res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
  //res.sendStatus(204);

  var chat = chatRoom.getChat(req.chatId);

  var time = dayjs().format("HH:mm");
  const sendData = `data: ${JSON.stringify({message: createMessage({name: "sem", content: req.body.content, time: time, left: false})})}\n\n`;
  res.render('user/messageGen', {name: "sem", content: req.body.content, time: time, left: false});
  if (Object.keys(chat).length > 0)
    for (let userId of Object.keys(chat))
      if (userId != req.user.Id)
        chat[userId].write(sendData);
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

  // var time = dayjs().format("HH:mm");
  // const sendData = `data: ${JSON.stringify({message: createMessage({name: "sem", content: "test", time: time, left: false})})}\n\n`;
  // res.write(sendData);

  console.log("new events");
  // if (chatList[0].users.length == 0) chatList[0].users.push(res);
  chatRoom.getChat(req.chatId)[req.user.Id] = res;
  //getChat().then((chat) => (chat.users.length == 0) ? chat.users.push(res) : null);
  res.on("close", (event) => {
    console.log(event);
    delete chatRoom.getChat(req.chatId)[req.user.Id];
  });


  return;
  setInterval(() => {
    const sendData = `data: ${JSON.stringify({message: createMessage({name: "sem", content: "test", time: time, left: false})})}\n\n`;
    res.write(sendData);
  }, 5000);
}

module.exports = {paramMessageChat, getMessageChat, postMessageChat, eventMessageChat};