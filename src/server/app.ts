import createError from 'http-errors';
import path from 'path';
// import cookieParser from 'cookie-parser';
import express, { Request, Response, NextFunction} from 'express';


var app = express();

app.use(express.json());
app.use(express.urlencoded({ extended: false }));
// app.use(c ookieParser());
app.use(express.static(path.join(__dirname, '../../', 'public')));
app.use(express.static(path.join(__dirname, '../', 'client')));

app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'index.html'));
});

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

export default app;
