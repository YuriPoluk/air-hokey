#!/usr/bin/env node

import app from './app'
import http from 'http';
import socketIO from 'socket.io'
import { HttpError } from "http-errors";
import Field from './Field';
import Constants from '../shared/Constants';
import { PlayerRoles } from '../shared/PlayerRoles';

const port = normalizePort(process.env.PORT || '3000');
app.set('port', port);
const server = http.createServer(app);

server.listen(port);
server.on('error', onError);
server.on('listening', onListening);

const io = socketIO(server);
let field: Field;
let playerRoles: PlayerRoles[];

const initGame = () => {
  field = new Field(io);
  playerRoles = [PlayerRoles.Player1, PlayerRoles.Player2];
  for(let socket in io.sockets.sockets) {
    io.sockets.sockets[socket].disconnect();
  }
}

initGame();

const getPlayerRole = (): PlayerRoles | undefined => {
  return playerRoles.shift();
}

io.on('connection', socket => {
  socket.on(Constants.SOCKET_NEW_PLAYER, () => {
    const role = getPlayerRole();
    console.log({ROLE: role});
    if(role != undefined) {
        field.addPlayer(socket);
        socket.emit(Constants.SOCKET_ROLE_ASSIGN, role);

        if(playerRoles.length == 0) {
          io.sockets.emit(Constants.SOCKET_PLAYERS_READY);
        }
    }
  });

  socket.on(Constants.SOCKET_PLAYER_ACTION, data => {
    field.addPlayerInput(socket.id, data)
  });

  socket.on(Constants.SOCKET_DISCONNECT, () => {
    io.sockets.emit(Constants.SOCKET_PLAYER_LEAVE);
    clearInterval(field.updateInterval)
    initGame();
  });
})


/**
 * Normalize a port into a number, string, or false.
 */

function normalizePort(val: string) {
  const port = parseInt(val, 10);

  if (isNaN(port)) {
    // named pipe
    return val;
  }

  if (port >= 0) {
    // port number
    return port;
  }

  return false;
}

/**
 * Event listener for HTTP server "error" event.
 */

function onError(error: HttpError) {
  if (error.syscall !== 'listen') {
    throw error;
  }

  const bind = typeof port === 'string' ?
      'Pipe ' + port :
      'Port ' + port;

  // handle specific listen errors with friendly messages
  switch (error.code) {
    case 'EACCES':
      console.error(bind + ' requires elevated privileges');
      process.exit(1);
      break;
    case 'EADDRINUSE':
      console.error(bind + ' is already in use');
      process.exit(1);
      break;
    default:
      throw error;
  }
}

/**
 * Event listener for HTTP server "listening" event.
 */

function onListening() {
  const addr = server.address();

  const bind = typeof addr === 'string' ?
      'pipe ' + addr :
      // @ts-ignore
      'port ' + addr.port;
  console.log('Listening on ' + bind);
}