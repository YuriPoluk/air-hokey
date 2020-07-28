"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const http_errors_1 = __importDefault(require("http-errors"));
const express_1 = __importDefault(require("express"));
const path_1 = __importDefault(require("path"));
var app = express_1.default();
app.use(express_1.default.json());
app.use(express_1.default.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express_1.default.static(path_1.default.join(__dirname, 'public')));
app.use(express_1.default.static(path_1.default.join(__dirname, 'dist/client')));
// catch 404 and forward to error handler
app.use(function (req, res, next) {
    next(http_errors_1.default(404));
});

app.get('/', (req, res) => {
    res.sendFile(__dirname + '/index.html');
});

// error handler
app.use(function (err, req, res, next) {
    // set locals, only providing error in development
    res.locals.message = err.message;
    res.locals.error = req.app.get('env') === 'development' ? err : {};
    // render the error page
    res.status(err.status || 500);
    res.send('error');
});
module.exports = app;
//# sourceMappingURL=server.js.map