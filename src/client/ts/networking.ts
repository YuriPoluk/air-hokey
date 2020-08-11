import io from 'socket.io-client';
import Constants from "../../shared/Constants";
import { processGameUpdate } from "./state";

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
let url: string;
if(window.location.host == 'localhost:8080')
    url = 'localhost:3000';
else {
    url = window.location.host;
}

export const socket = io(`${socketProtocol}://${url}`, { reconnection: false, forceNew: true });

console.log({originalSocket: socket})

const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
        console.log('Connected to server!');
        resolve();
    });
});

export const connect = async () => {
    await connectedPromise;
    socket.emit(Constants.SOCKET_NEW_PLAYER);
    socket.on(Constants.SOCKET_UPDATE, processGameUpdate);
    socket.on('disconnect', () => {
        console.log('Disconnected from server.');
    });
};






