//jshint esversion:6


const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");





const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));


// place this code exactly here 
app.use(session({
    secret: 'keyboard cat',
    resave: false,
    saveUninitialized: false
  }));

app.use(passport.initialize());
app.use(passport.session());



// Connecting to mongoDB and if diaryDB does not exists, create one
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

// Schema for the journals
const userSchema = new mongoose.Schema({
    username : String,
    password : String,
  });

// Only use mongodb schema
userSchema.plugin(passportLocalMongoose);


// Creating the DB with the defined user
const User = mongoose.model("User", userSchema);

//Exatly same position of code is required
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());



app.get("/", function(req,res){
    res.render("home")
});

app.get("/login", function(req,res){
    res.render("login")
});

app.get("/register", function(req,res){
    res.render("register")
});


app.get("/secrets", function(req,res){
    if(req.isAuthenticated()){
        res.render("secrets");
       // console.log("secret route")
       // console.log(req.isAuthenticated())
    } else {
        res.redirect("/login")
       // console.log("login route")
       // console.log(req.isAuthenticated())
    }
});

app.post("/register", function(req,res){
    User.register({username: req.body.username}, req.body.password, function(err,user){
        if(err){
            console.log(err);
            res.redirect("/register");
        } else {
            passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
            })
        }
    })

});

app.post("/login", function(req,res){
   const new_user = new User ({
    username: req.body.username,
    password: req.body.password
   });
   req.login(new_user, function(err){
    if(err){
        console.log(err)
    } else{
        passport.authenticate("local")(req,res, function(){
            res.redirect("/secrets");
            })
    }
   })
})


app.get("/logout", function(req, res){
    req.logout(function(err) {
        if (err) { return next(err); }
        res.redirect('/');
      });
})

app.listen(3000, function () {
    console.log("Server started on port 3000");
});
  