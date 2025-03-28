const dayjs = require('dayjs'); // Library for handling date and time operations

function paramMessageChat(req, res, next, chat) {
  console.log(parseInt(chat));
  next();
}

function getMessageChat(req, res) {
  res.render('user/messages');
}

function postMessageChat(req, res) {
  res.setHeader("Cache-Control", "max-age=0, no-cache, must-revalidate, proxy-revalidate");
  var time = dayjs().format("HH:mm");
  res.render('user/messageGen', {name: "sem", content: req.body.content, time: time, left: false});
}

function eventMessageChat(req, res) {

}

module.exports = {paramMessageChat, getMessageChat, postMessageChat};