require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require("express-session");
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");

const app = express();

app.use(express.static("public"));
app.set('view engine', 'ejs');
app.use(bodyParser.urlencoded({
  extended: true
}));

// Tell app to use express-session package.
app.use(session({
    // Secret is not added in .env file, 'cause .env file is in .gitignore and it could be lost if .env file is deleted.
    secret: "Our little secret.",
    resave: false,
    saveUninitialized: false
}));

// Tell app to use passport and initialize it.
app.use(passport.initialize());
// Tell app to use passport for dealing with sessions.
app.use(passport.session());

mongoose.connect("mongodb://localhost:27017/userDB", {useNewUrlParser: true});




const userSchema = new mongoose.Schema({
    email: String,
    password: String
});

// For using passport-local-mongoose, Add it to mongoose schema as a plugin.
userSchema.plugin(passportLocalMongoose) // This plugin is used to hash and salt a password.

// requires the model with Passport-Local Mongoose plugged in
const User = new mongoose.model("User", userSchema);

// use static authenticate method of model in LocalStrategy
// CHANGE: USE "createStrategy" INSTEAD OF "authenticate"
passport.use(User.createStrategy());


// use static serialize and deserialize of model for passport session support
passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());




app.get('/', (req, res) => {
    res.render("home");
});

app.get('/login', (req, res) => {
    res.render("login");
});

app.get('/register', (req, res) => {
    res.render("register");
});

app.get('/secrets', (req, res) => {

    // The below line was added so we can't display the "/secrets" page
    // after we logged out using the "back" button of the browser, which
    // would normally display the browser cache and thus expose the 
    // "/secrets" page we want to protect. 
    res.set(
        'Cache-Control', 
        'no-cache, private, no-store, must-revalidate, max-stal e=0, post-check=0, pre-check=0'
    );

    if(req.isAuthenticated()){
        res.render("secrets");
    } else {
        res.redirect("/login");
    };
});

app.get('/logout', (req, res) => {
    req.logout();
    res.redirect("/");
});

app.post('/register', (req, res) => {
    User.register({username: req.body.username}, req.body.password, (err, user) => {
        if(err) {
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req, res, function(){
                res.redirect("/secrets");
            });
        }
    });
});

app.post('/login', passport.authenticate('local', { failureRedirect: '/login' }),  function(req, res) {
	res.redirect('/secrets');
});











app.listen(process.env.PORT || 3000, function () { 
    console.log("Server is started on port 3000");
})
