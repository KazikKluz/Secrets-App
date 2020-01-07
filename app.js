//jshint esversion:6

const express = require("express");
const bodyParser = require("body-parser");

const app = express();

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

app.get("/register", (req, res)=>{
    res.render("register");
});
