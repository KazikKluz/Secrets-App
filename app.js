//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const encrypt = require("mongoose-encryption");
const bcrypt = require("bcrypt");
let saltRounds = 10;

const app = express();

mongoose.connect("mongodb://localhost:27017/secretsDB", {
  useNewUrlParser: true,
  useUnifiedTopology: true
});

require('dotenv')
  .config();

const userSchema = new mongoose.Schema({
  email: String,
  password: String
});

userSchema.plugin(encrypt, {
  secret: process.env.SECRET,
  encryptedFields: [
    "password"
  ]
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({ extended: false }));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.listen(3000, (err) => {
  if (!err) {
    console.log("server running at port 3000");
  }
});

app.get("/", (req, res) => {
  res.render("home");
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.post("/login", (req, res) => {
  User.findOne({ email: req.body.username }, (err, foundUser) => {
    if (!foundUser) {
      res.send("user doessn't exist");
    } else {
      bcrypt.compare(req.body.password, foundUser.password, (err,
        result) => {
        if (result === true) {
          res.render("secrets");
        } else {
          res.send("wrong password");
        }
      });
    }
  });
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.post("/register", (req, res) => {

  bcrypt.hash(req.body.password, saltRounds, (err, hash) => {
    const newUSer = new User({
      email: req.body.username,
      password: hash
    });
    newUSer.save((err) => {
      if (!err) {
        res.render("secrets");
      } else {
        res.send("failure!");
      }
    });
  });
});
