// Notar que no hace falta que exportemos este array si no lo tenemos que acceder en server.js, las funciones pueden utilizarlo desde aca. Si queremos accederlo en server.js podemos exportarlo en el module.exports e importarlo luego alla, tal como hacemos con las funciones
const users = [];

// Join user to chat
function userJoin(id, username, room) {
  const user = { id, username, room };
  users.push(user);
  return user;
}

// Get current user
function getCurrentUser(id) {
  // find retorna el primer elemento del array que coincida con lo que especificamos (sera un objeto dado que es un array de objetos)
  return users.find((user) => user.id === id);
}

// User leaves chat
function userLeave(id) {
  // Vemos en que index del array esta el user
  const index = users.findIndex((user) => user.id === id);

  // Lo removemos del array y lo retornamos (notar que splice retorna un array, por eso el 0)
  return users.splice(index, 1)[0];
}

// Get room users
function getRoomUsers(room) {
  // Retorna un array solo con los elementos que cumplen la condicion
  return users.filter((user) => user.room === room);
}

module.exports = {
  userJoin,
  getCurrentUser,
  userLeave,
  getRoomUsers,
};
