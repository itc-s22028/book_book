const express = require("express");
const path = require("path");
const cookieParser = require("cookie-parser");
const logger = require("morgan");
const indexRouter = require("./routes/index.js");
const usersRouter = require("./routes/users.js");
const cors = require('cors');
const passport = require("passport");
const session = require("express-session");

const app = express();

app.use(session({
  secret: "</2aiG^bd29iC5rj)=G?mKTm",
  resave: false,
  saveUninitialized: false,
  cookie: { maxAge: 60 * 60 * 1000 }
}));

app.use(passport.initialize());
app.use(passport.session());

app.use((req, res, next) => {
  const messages = req.session.messages || [];
  res.locals.messages = messages;
  res.locals.hasMessages = !!messages.length;
  req.session.messages = [];
  next();
});

// CORS middleware
app.use(cors({
  origin: 'http://localhost:3000',
  credentials: true,
  optionsSuccessStatus: 200
}));

// ビューエンジンの設定
app.use(logger("dev"));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, "routes")));

app.use("/", indexRouter);
app.use("/users", usersRouter);

module.exports = app;
