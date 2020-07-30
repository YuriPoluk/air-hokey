import io from 'socket.io-client';
import Constants from "../../shared/Constants";
import { processGameUpdate } from "./state";
import GameController from "./core/GameController";

const socketProtocol = (window.location.protocol.includes('https')) ? 'wss' : 'ws';
console.log(window.location.host)
export const socket = io(`${socketProtocol}://localhost:3000`, { reconnection: false, forceNew: true });
export let playerRole: string;

console.log({originalSocket: socket})

const connectedPromise = new Promise(resolve => {
    socket.on('connect', () => {
        console.log('Connected to server!');
        socket.emit(Constants.SOCKET_NEW_PLAYER);
        resolve();
    });
});

const getRolePromise = new Promise(resolve => {
    socket.on(Constants.SOCKET_ROLE_ASSIGN, (role: string) => {
        playerRole = role;
        resolve();
    });
});

export const connect = async () => {
    await connectedPromise;
    await getRolePromise;
    socket.on(Constants.SOCKET_UPDATE, processGameUpdate);
    socket.on('disconnect', () => {
        console.log('Disconnected from server.');
    });
};






