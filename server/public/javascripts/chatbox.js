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
        'Accept': 'text/html',
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
      alert(JSON.stringify(err));
    });
});


