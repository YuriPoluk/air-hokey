import createError from 'http-errors';
import express from 'express';
import path from 'path';
// import cookieParser from 'cookie-parser';
import { Request, Response, NextFunction, ErrorRequestHandler } from 'express';


var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(path.join(__dirname, 'dist/client')));

// catch 404 and forward to error handler
app.use(function(req: Request, res: Response, next: NextFunction) {
  next(createError(404));
});

// error handler
app.use(function(err: any, req: Request, res: Response, next: NextFunction) {
  // set locals, only providing error in development
  res.locals.message = err.message;
  res.locals.error = req.app.get('env') === 'development' ? err : {};

  // render the error page
  res.status(err.status || 500);
  res.send('error');
});

app.get('/', (req, res) => {
  res.sendFile(__dirname + '/index.html');
});

module.exports = app;
