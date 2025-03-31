const addButton = document.getElementById("add-chat-button");
const chatlist = document.querySelector(".chats__container");
const chatFormWrapper = document.querySelector(".chats__create");
const chatForm = document.getElementById("create-chat-form");

const chatName = document.querySelector(".chats__create__name");
const chatMembers = document.querySelectorAll(".chats__member");

const addButtonText = addButton.textContent;
var formToggle = false;

addButton.addEventListener('click', (event) => {
  if (formToggle) {
    formToggle = false;
    chatlist.style.display = "inline-flex";
    chatFormWrapper.style.display = "none";
    addButton.textContent = addButtonText;
  } else {
    formToggle = true;
    chatlist.style.display = "none";
    chatFormWrapper.style.display = "inline-flex";
    addButton.textContent = "🗙 Cancel";
  }
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = chatName.value;
  const members = Array.from(chatMembers).map(member => member.checked ? ',' + member.getAttribute("studentId") : "").join();

  if (!name || !members) return;

  var link;
  if (window.location.pathname.endsWith("messages"))
    link = "messages";
  else
    link = "../messages";

  // TODO: remove search
  fetch(link + location.search, {
    method: 'POST',
    headers: {
      'Accept': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({name: name, members: members})
  }).then(res => res.text())
    .then(res => {
    chatName.value = '';
    chatMembers.forEach((member) => member.checked = false);

    // dummy div
    var div = document.createElement('div');
    div.innerHTML = res;
    var chat = div.firstElementChild;
    chatlist.querySelector("ul").prepend(chat);
  }).catch(err => {
    console.log(err);
  });
});

chatlist.addEventListener("click", (event) => {
  var item;
  if (event.target.tagName == "LI")
    item = event.target;
  if (!item) return;

  // TODO: remove search
  var path = window.location.pathname;
  if (path.endsWith('/'))
    path = path.substring(0, path.length - 1);

  if (path.endsWith('messages'))
    window.location.href = "messages/" + item.getAttribute("chatId") + location.search;
  else
    window.location.href = item.getAttribute("chatId") + location.search;
});

window.addEventListener("load", () => {
  const toggles = document.querySelectorAll(".toggle-chats");
  const chatbox = document.querySelector(".chatbox");
  const chats = document.querySelector(".chats");
  
  var chatToggle = false;

  function toggleOn() {
    chatbox.style.display = "none";
    chats.style.display = "flex";
    chats.style.maxWidth = "100%";
    chats.style.flexGrow = "1";
    toggles.forEach(el => el.textContent = "Hide Chats");
  }
  function toggleOff() {
    chatbox.style.display = "flex";
    chats.style.display = "none";
    chats.style.maxWidth = "";
    chats.style.flexGrow = "";
    toggles.forEach(el => el.textContent = "Show Chats");
  }

  function toggleListener(event) {
    if (chatToggle) {
      chatToggle = false;
      toggleOff();
    } else {
      chatToggle = true;
      toggleOn();
    }
  }

  toggles.forEach(element => element.addEventListener("click", toggleListener));

  const mediaQuery = window.matchMedia("(max-width: 600px)");
  mediaQuery.addEventListener("change", (event) => {
    if (event.matches) {
      if (chatToggle) {
        toggleOn();
      } else {
        toggleOff();
      }
    } else {
      toggleOff();
    }
  });
});