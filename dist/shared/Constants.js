"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
let Constants = {
    FIELD_WIDTH: 375,
    FIELD_HEIGHT: 667,
    CONSTRAINT_WIDTH: 50,
    MAX_VELOCITY: 25,
    PLAY_TO_SCORE: 5,
    SOCKET_UPDATE: 'update',
    SOCKET_NEW_PLAYER: 'new-player',
    SOCKET_PLAYER_ACTION: 'player-action',
    SOCKET_ROLE_ASSIGN: 'role-asign',
    SOCKET_GOAL_EVENT: 'goal',
    SOCKET_GAME_OVER_EVENT: 'game-over',
    SOCKET_DISCONNECT: 'disconnect',
    SOCKET_PLAYERS_READY: 'ready',
    SOCKET_PLAYER_LEAVE: 'opponent-left',
    SOCKET_STRIKER_HIT: 'striker-hit',
    SOCKET_FIELD_HIT: 'field-hit',
};
Constants.FIELD_RATIO = Constants.FIELD_WIDTH / Constants.FIELD_HEIGHT;
Constants.WIDTH = Constants.FIELD_WIDTH + Constants.CONSTRAINT_WIDTH * 2;
Constants.HEIGHT = Constants.FIELD_HEIGHT + Constants.CONSTRAINT_WIDTH * 2;
Constants.GATE_WIDTH = Constants.FIELD_WIDTH / 2;
Constants.PLAYER_WIDTH = Constants.GATE_WIDTH * 0.45;
Constants.PUCK_WIDTH = Constants.PLAYER_WIDTH * 0.45;
Constants.MAX_VELOCITY_SQRD = Constants.MAX_VELOCITY * Constants.MAX_VELOCITY;
Constants.PUCK_REL_WIDTH = Constants.PUCK_WIDTH / (Constants.PUCK_WIDTH + Constants.PLAYER_WIDTH);
exports.default = Constants;
//# sourceMappingURL=Constants.js.map