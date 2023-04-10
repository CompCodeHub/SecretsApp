//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongooose = require("mongoose");
const md5 = require("md5");

const app = express();
app.use(bodyParser.urlencoded({extended: true}));

app.use(express.static("public"));
app.set("view engine", "ejs");


// Connecting to database
mongooose.connect("mongodb://localhost:27017/userDB");

// Creating our schema
const userSchema = new mongooose.Schema({
    email: String,
    password: String
});

// Creating the Users collection
const User = new mongooose.model("User", userSchema);


// Home get route
app.get("/", function(req, res){
    res.render("home");
});

// GET Login route
app.get("/login", function(req, res){
    res.render("login");
});

// POST Login route
app.post("/login", function(req, res){
    const username = req.body.username;
    const password = md5(req.body.password);
    
    User.findOne({email: username}).then(function(user){
        if(user){
            if(user.password === password){
                res.render("secrets");
            }else{
                res.send("Username doesn't match the password!");
            }
        }
    }).catch(function(err){
        console.log(err);
    });
});

// GET Register route
app.get("/register", function(req, res){
    res.render("register");
});

// POST Register route
app.post("/register", function(req, res){

    // Creating the new User
    const newUser = new User({
        email: req.body.username,
        password: md5(req.body.password)
    });

    newUser.save().then(function(){
        res.render("secrets");
    }).catch(function(err){
        console.log(err);
    });

});


app.listen(3000, function(){
    console.log("Server started on port 3000.");
})

