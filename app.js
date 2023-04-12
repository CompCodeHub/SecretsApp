//jshint esversion:6
require("dotenv").config();
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongooose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');

const app = express();
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));
app.set("view engine", "ejs");


app.use(session({
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

app.use(passport.initialize());
app.use(passport.session());

// Connecting to database
mongooose.connect("mongodb://localhost:27017/userDB");

// Creating our schema
const userSchema = new mongooose.Schema({
    email: String,
    password: String,
    googleId: String
});


userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);

// Creating the Users collection
const User = new mongooose.model("User", userSchema);

passport.use(User.createStrategy());

passport.serializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, {
            id: user.id,
            username: user.username,
            picture: user.picture
        });
    });
});

passport.deserializeUser(function (user, cb) {
    process.nextTick(function () {
        return cb(null, user);
    });
});

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
},
    function (accessToken, refreshToken, profile, cb) {
        User.findOrCreate({ googleId: profile.id }, function (err, user) {
            return cb(err, user);
        });
    }
));

// Home get route
app.get("/", function (req, res) {
    res.render("home");
});

// GET Google auth route
app.get("/auth/google",
    passport.authenticate('google', { scope: ["profile"] })
);

// GET callback route
app.get("/auth/google/secrets",
    passport.authenticate("google", { failureRedirect: "/login" }),
    function (req, res) {
        // Successful authentication, redirect secrets.
        res.redirect("/secrets");
    });


// GET Login route
app.get("/login", function (req, res) {
    res.render("login");
});

// POST Login route
app.post("/login", function (req, res) {

    const user = new User({
        username: req.body.username,
        password: req.body.password
    });

    req.login(user, function (err) {
        if (err) {
            console.log(err);
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

// GET Register route
app.get("/register", function (req, res) {
    res.render("register");
});

// GET Secrets route
app.get("/secrets", function (req, res) {
    if (req.isAuthenticated()) {
        res.render("secrets");
    } else {
        res.redirect("/login");
    }
});

// POST Register route
app.post("/register", function (req, res) {

    User.register({ username: req.body.username }, req.body.password, function (err, user) {
        if (err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function () {
                res.redirect("/secrets");
            });
        }
    });

});

// GET logout route
app.get("/logout", function (req, res) {

    req.logout(function (err) {
        if (err) {
            console.log(err);
        }
        res.redirect('/');
    });
});

app.listen(3000, function () {
    console.log("Server started on port 3000.");
});

