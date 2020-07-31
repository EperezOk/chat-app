const chatForm = document.getElementById("chat-form");
const chatMessages = document.querySelector(".chat-messages");

// Get username and room from URL (esto es mucho mas clean hacerlo con un template engine o con algun framework frontend pero lo hacemos asi para simplificar)
// location contiene datos sobre el protocolo que se esta usando, puerto, host y tambien sobre la url, location.search nos devuelve desde el ? en adelante
const { username, room } = Qs.parse(location.search, {
  // Esto es para que ignore el &, ?, =
  ignoreQueryPrefix: true,
});

// Nos conectamos a websockets con el cliente, haciendo un upgrade de http
const socket = io();

// Join chatroom
socket.emit("joinRoom", { username, room });

// Get room and users to refresh sidebar
socket.on("roomUsers", ({ room, users }) => {
  outputRoomName(room);
  outputUsers(users);
});

// Message from server
socket.on("message", (message) => {
  outputMessage(message);

  // Scroll down when message is received
  // scrollTop indica cuanto scroll desde arriba tiene el elemento, y scrollHeight indica la altura minima (sin contar bordes y margenes) que necesita el elemento para no tener la barra de scroll. La cosa es que scrollHeight va incrementando a medida que vamos mandando mensajes y nos asegura que va a quedar todo scrolleado para abajo, aunque en realidad me sobra.
  chatMessages.scrollTop = chatMessages.scrollHeight;
});

const msgInput = document.getElementById("msg");

// Message submit
chatForm.addEventListener("submit", (e) => {
  e.preventDefault();

  // Emit message to server
  socket.emit("chatMessage", msgInput.value);
  // Clear input and focus it to keep writing
  socket.emit("finTyping", username, room);
  msgInput.value = "";
  msgInput.focus();
});

const typing = document.getElementById("typing");

// Typing message
msgInput.addEventListener("input", (e) => {
  if (msgInput.value !== "") {
    socket.emit("typing", username, room);
  } else {
    socket.emit("finTyping", username, room);
  }
});

// Lo hacemos de forma tal que si ya hay alguien escribiendo y otro se pone a escribir, solo me quede con el primero
socket.on("userTyping", (username) => {
  if (typing.style.opacity == 0) {
    typing.style.opacity = 0.85;
    typing.innerText = `${username} está escribiendo...`;
  }
});

// Solamente se va el mensaje si termino de escribir la persona que estoy viendo
socket.on("userFinTyping", (username) => {
  if (typing.innerText.indexOf(username) === 0) {
    typing.style.opacity = 0;
  }
});

// Output message to DOM
function outputMessage(message) {
  // Creamos un div, le agregamos la clase para css y le ponemos el contenido dentro
  const div = document.createElement("div");
  div.classList.add("message");

  // Si el mensaje lo mandamos nosotros, le damos un styling especial
  if (message.username == username) {
    div.classList.add("own");
    message.username = "";
  }

  div.innerHTML = `
    <p class="meta">${message.username} <span>${message.time}</span></p>
    <p class="text">${message.text}</p>
  `;
  document
    .querySelector(".chat-messages")
    // Usamos insertBefore en vez de append para que quede siempre el p de typing al final
    .insertBefore(div, document.getElementById("typing"));
}

const roomName = document.getElementById("room-name");
const userList = document.getElementById("users");

// Add room name to DOM
function outputRoomName(room) {
  roomName.innerText = room;
}

// Add users to DOM
function outputUsers(users) {
  // map nos da un nuevo array aplicandole a cada elemento la funcion que le pedimos, y luego a ese array le aplicamos join que nos permite unir los elementos del array usando el delimitador indicado, en este caso ninguno, por lo que nos devolvera un string de li pegados
  userList.innerHTML = `
    ${users.map((user) => `<li>${user.username}</li>`).join("")}
  `;
}
