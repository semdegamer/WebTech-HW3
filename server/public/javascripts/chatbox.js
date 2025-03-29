const form = document.getElementById("message-form");
const messageBox = document.getElementById("message-box");
const messageCon = document.querySelector(".chatbox__container");
const parser = new DOMParser();

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
        // dummy div
        var div = document.createElement('div');
        div.innerHTML = res;
        var message = div.firstElementChild;
        messageCon.prepend(message);
        messageBox.value = '';
        message.scrollIntoView();
    }).catch(err => {
      //alert("1");
      //alert(JSON.stringify(err));
      console.log(err);
    });
});

if (true || window.location.pathname == "/user/messages/1" && window.location.search == "?name=sem2"){
  const eventSource = new EventSource(window.location.pathname + "/events" + window.location.search);
  eventSource.onmessage = (event) => {
    let data = JSON.parse(event.data);
    console.log(data.message);
    // dummy div
    var div = document.createElement('div');
    div.innerHTML = data.message;
    var message = div.firstElementChild;
    messageCon.prepend(message);
  };
  eventSource.onerror = (err) => {
    console.log(err);
  };
}