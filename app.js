//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongooose = require("mongoose");
const bcrypt = require("bcrypt");
const saltRounds = 10;

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

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
app.get("/", function (req, res) {
    res.render("home");
});

// GET Login route
app.get("/login", function (req, res) {
    res.render("login");
});

// POST Login route
app.post("/login", function (req, res) {


    

    const username = req.body.username;
    const password = req.body.password;

    User.findOne({ email: username }).then(function (user) {
        if (user) {

            bcrypt.compare(password, user.password, function(err, result) {

                if(result === true){
                    res.render("secrets");
                }else{
                    res.send("Username doesn't match the password!");
                }
                
            });
    
        }else{
            res.send("You aren't registered!");
        }
    }).catch(function (err) {
        console.log(err);
    });
});

// GET Register route
app.get("/register", function (req, res) {
    res.render("register");
});

// POST Register route
app.post("/register", function (req, res) {

    bcrypt.hash(req.body.password, saltRounds, function (err, hash) {

        // Creating the new User
        const newUser = new User({
            email: req.body.username,
            password: hash
        });

        newUser.save().then(function () {
            res.render("secrets");
        }).catch(function (err) {
            console.log(err);
        });

    });

});


app.listen(3000, function () {
    console.log("Server started on port 3000.");
});

