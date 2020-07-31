const moment = require("moment");

// Con esta funcion auxiliar vamos a poder agregarle a los mensajes quien los mando y a que hora y wrappear todo en un objeto
function formatMessage(username, text) {
  return {
    username, // abreviacion de username: username
    text,
    // Formateamos la fecha para que nos muestre solo la hora, los minutos y si es am o pm
    time: moment().format("h:mm a"),
  };
}

// La exportamos para usarla en server.js
module.exports = formatMessage;
