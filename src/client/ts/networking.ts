import io from 'socket.io-client';
import Constants from "../../shared/Constants";
import { processGameUpdate } from "./state";

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
// window.location.host
export const socket = io(`${socketProtocol}://localhost:3000`, { reconnection: false, forceNew: true });

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






