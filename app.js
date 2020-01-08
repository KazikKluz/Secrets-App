//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");
const mongoose = require("mongoose");

const app = express();

mongoose.connect("mongodb://localhost:27017/secretsDB", {
    useNewUrlParser: true,
    useUnifiedTopology: true
});

const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

const User = mongoose.model("User", userSchema);

app.use(bodyParser.urlencoded({extended: false}));
app.use(express.static("public"));
app.set('view engine', 'ejs');

app.listen(3000, (err)=>{
    if(!err){
        console.log("server running at port 3000");
    }
});

app.get("/", (req, res)=>{
    res.render("home");
});

app.get("/login", (req, res)=>{
    res.render("login");
});

app.post("/login", (req,res)=>{
    User.findOne({email: req.body.username}, (err, foundUser)=>{
        if(!foundUser){
            res.send("user doessn't exist");
         } else {
                if(foundUser.password === req.body.password){
                    res.render("secrets");
                } else {
                    res.send("wrong password");
                }
         }
    });
});

app.get("/register", (req, res)=>{
    res.render("register");
});

app.post("/register", (req, res)=>{

    const newUSer = new User({
        email: req.body.username,
        password: req.body.password
    });
    newUSer.save((err)=>{
        if(!err){
            res.render("secrets");
        } else {
            res.send("failure!");
        }
    });
});

