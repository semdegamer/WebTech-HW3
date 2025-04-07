const unfriendButtons = document.querySelectorAll(".friend-banner__unfriend");

unfriendButtons.forEach(el => el.addEventListener('click', unfriend));

function unfriend(event) {
  var friend = event.target;
  var friendId = parseInt(friend.getAttribute('studentId'));

  event.preventDefault();

  fetch("friends", {
    method: 'POST',
    headers: {
      'Accept': 'text/plain',
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({friendId})
    })
    .then(res => res.json())
    .then(res => {
      if (res.success)
        friend.parentElement.remove(friend);
    })
    .catch(err => {
      alert("failed to remove friend...");
    })
}