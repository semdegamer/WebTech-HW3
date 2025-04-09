/* === Manages chat creation UI, form submission, and navigation to selected chats. === */
const addButton = document.getElementById("add-chat-button");
const chatlist = document.querySelector(".chats__container");
const chatFormWrapper = document.querySelector(".chats__create");
const chatForm = document.getElementById("create-chat-form");

const chatName = document.querySelector(".chats__create__name");
const chatMembers = document.querySelectorAll(".chats__member");

const addButtonText = addButton.textContent;
var formToggle = false;

function hideForm() {
  chatlist.style.display = "inline-flex";
  chatFormWrapper.style.display = "none";
  addButton.textContent = addButtonText;
}
function showForm() {
  chatlist.style.display = "none";
  chatFormWrapper.style.display = "inline-flex";
  addButton.textContent = "🗙 Cancel";
}

addButton.addEventListener('click', (event) => {
  if (formToggle) {
    formToggle = false;
    hideForm();
  } else {
    formToggle = true;
    showForm()
  }
});

chatForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const name = chatName.value;
  const members = Array.from(chatMembers).filter(el => el.checked).map(el => parseInt(el.getAttribute("studentId")));

  if (!name || !members || members.length == 0) return;

  var link;
  if (window.location.pathname.endsWith("messages"))
    link = "messages";
  else
    link = "../messages";

  fetch(link, {
    method: 'POST',
    headers: {
      'Accept': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({name: name, members: JSON.stringify(members)})
  }).then(res => res.text())
    .then(res => {
    chatName.value = '';
    chatMembers.forEach((member) => member.checked = false);

    // dummy div
    var div = document.createElement('div');
    div.innerHTML = res;
    var chat = div.firstElementChild;
    chatlist.querySelector("ul").prepend(chat);
    
    formToggle = false;
    hideForm();
  }).catch(err => {
    console.log(err);
  });
});

chatlist.addEventListener("click", (event) => {
  var item;
  if (event.target.tagName == "LI")
    item = event.target;
  if (!item) return;

  var path = window.location.pathname;
  if (path.endsWith('/'))
    path = path.substring(0, path.length - 1);

  if (path.endsWith('messages'))
    window.location.href = "messages/" + item.getAttribute("chatId");
  else
    window.location.href = item.getAttribute("chatId");
});