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
    chatbox.style.display = "";
    chats.style.display = "";
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