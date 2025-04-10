/* === Handles real-time chat message sending and receiving using Fetch and Server-Sent Events (SSE). === */
const form = document.getElementById("message-form");
const messageBox = document.getElementById("message-box");
const messageCon = document.querySelector(".chatbox__container");

form.addEventListener("submit", (event) => {
    event.preventDefault();
    
    var message = messageBox.value;
    if (message.length == 0)
      return;

    fetch('', {
      method: 'POST',
      headers: {
        'Accept': 'text/plain',
        'Content-Type': 'application/json'
      },
      body: JSON.stringify({content: message})
    }).then(res => res.text())
      .then(res => {
        messageBox.value = '';
    }).catch(err => {
      //alert("1");
      //alert(JSON.stringify(err));
      console.log(err);
    });
});

var removedFiller = false;
const pathnameParts = window.location.pathname.split('/');
const eventSource = new EventSource(pathnameParts[pathnameParts.length-1] + "/events" + window.location.search);
eventSource.onmessage = (event) => {
  if (!removedFiller){
    removedFiller = true;

    if (!messageCon.querySelector(".chatbox__message")){
      // clear filler text when the first message is received
      messageCon.innerHTML = '';
    }
  }

  let data = JSON.parse(event.data);
  // dummy div
  var div = document.createElement('div');
  div.innerHTML = data.message;
  var message = div.firstElementChild;
  messageCon.prepend(message);

  // focus is true when it is your own message, so that you directly focus on your own message.
  if (data.focus) {
    message.scrollIntoView();
  }
};
eventSource.onerror = (err) => {
  console.log(err);
};