const express = require("express");
const app = express();
const path = require("path");

// Para incorporar socket.io
const http = require("http");
// Creamos un server http a partir de la express app manualmente (leer comentario de abajo de todo en el server.listen) para poder reutilizar el server despues en socketio, sino queda muy feo el codigo
const server = http.createServer(app);
const socketio = require("socket.io");
const users = require("./utils/users");
// Hacemos un server websockets a partir del server http
const io = socketio(server);

// Set static folder
app.use(express.static(path.join(__dirname, "public")));

// Cuando un cliente se conecte
io.on("connection", (socket) => {
  // Traemos una funcion auxiliar que hicimos en otra carpeta para agregar al mensaje quien lo mando y a que hora (queda mas prolijo importarlo arriba de todo pero para que este todo agrupado lo que esta relacionado lo pongo aca)
  const formatMessage = require("./utils/messages");
  const botName = "CaposChat Bot";

  // Traemos las funcs auxiliares que hicimos en utils
  const {
    userJoin,
    getCurrentUser,
    userLeave,
    getRoomUsers,
  } = require("./utils/users");

  // Join room from client
  socket.on("joinRoom", ({ username, room }) => {
    // Usamos el id del socket como id de user
    const user = userJoin(socket.id, username, room);

    // Con socket.io ya viene integrada esta funcionalidad de rooms, y es tan sencillo como hacer esto (si omitimos esto, cualquiera que entre a la pagina de chat va a estar unido a un solo room)
    socket.join(user.room);

    // Emitimos un evento de bienvenida (al cliente que se conecto) y podemos pasarle las variables o cosas que queramos en los siguientes argumentos
    socket.emit(
      "message",
      formatMessage(botName, `Bienvenido a CaposChat ${user.username}!`)
    );

    // Broadcast (le avisa a todos los demas que esten en el room pero no a el mismo) when a user connects. Al hacerlo, hay que especificar en que room.
    socket.broadcast
      .to(user.room)
      .emit(
        "message",
        formatMessage(botName, `${user.username} se unió al chat`)
      );

    // Send users and room info to refresh sidebar
    io.to(user.room).emit("roomUsers", {
      room: user.room,
      users: getRoomUsers(user.room),
    });
  });

  // Listen for chat message (notar que es indistinto a donde escuche los eventos, o si los anido o no, es solo una cuestion de prolijidad y conveniencia. Este listener podria ponerlo adentro del listener joinRoom y seguiria funcionando perfectamente)
  socket.on("chatMessage", (msg) => {
    const user = getCurrentUser(socket.id);
    // Emite a todos, incluyendo al propio cliente (denuevo especificamos a que room)
    io.to(user.room).emit("message", formatMessage(user.username, msg));
  });

  // Notar que podriamos usar el mismo nombre de evento, pero prefiero diferenciarlos por prolijidad
  socket.on("typing", (username, room) => {
    socket.broadcast.to(room).emit("userTyping", username);
  });

  socket.on("finTyping", (username, room) => {
    socket.broadcast.to(room).emit("userFinTyping", username);
  });

  // Cuando el cliente se desconecta
  socket.on("disconnect", () => {
    const user = userLeave(socket.id);

    // Lo checkeamos porque a veces se bugea y nos puede crashear el programa, pero sino deberia funcionar sin esto
    if (user) {
      socket.broadcast
        .to(user.room)
        .emit(
          "message",
          formatMessage(botName, `${user.username} salió del chat`)
        );

      // Refresh everyone's sidebar
      socket.broadcast.to(user.room).emit("roomUsers", {
        room: user.room,
        users: getRoomUsers(user.room),
      });
    }
  });
});

const PORT = process.env.PORT || 3000;

// Generalmente aca usamos app.listen directamente cuando no incorporamos socketio ni nada raro, pero lo que eso hace en realidad es crear un http server a partir de app como hicimos arriba y correr eso, solo es un shortcut
server.listen(PORT, () => console.log(`Server running on port ${PORT}`));
