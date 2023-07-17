//jshint esversion:6

require('dotenv').config()
const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const session = require('express-session');
const passport = require("passport");
const passportLocalMongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate')





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
    googleId: String,
    secret: String
  });

// Only use mongodb schema
userSchema.plugin(passportLocalMongoose);
userSchema.plugin(findOrCreate);


// Creating the DB with the defined user
const User = mongoose.model("User", userSchema);

//Exatly same position of code is required
passport.use(User.createStrategy());


//Exactly the same position should be maintained
passport.serializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, {
        id: user.id,
        username: user.username,
        picture: user.picture
      });
    });
  });
  
  passport.deserializeUser(function(user, cb) {
    process.nextTick(function() {
      return cb(null, user);
    });
  });


// Exactly below user serilize and deserialize
passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    callbackURL: "http://localhost:3000/auth/google/secrets"
  },
  function(accessToken, refreshToken, profile, cb) {
    // console.log(profile);
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));

app.get("/", function(req,res){
    res.render("home")
});


//check session by isAuthenticated to see if the current user is logged in
app.get("/submit", function(req,res){
    if(req.isAuthenticated()){
        res.render("submit");
       
    } else {
        res.redirect("/login")

    }
})



// Use mongoose findByID and save the new date to that user
app.post("/submit", function(req,res){
    const submit_secret = req.body.secret;
    User.findById(req.user.id).then((result) => {
      if(result){
          result.secret = submit_secret;
          result.save().then((doc)=> {
            res.redirect("/secrets")
          })
      } else {
          console.log("User not found")
      }
    });
})


//get trigerred bt the google auth2.0
app.get('/auth/google',
  passport.authenticate('google', { scope: ['profile'] }));


  //Checks the user and if authenticated redirect to login page
app.get('/auth/google/secrets', 
  passport.authenticate('google', { failureRedirect: '/login' }),
  function(req, res) {
    // Successful authentication, redirect home.
    res.redirect('/secrets');
  });


app.get("/login", function(req,res){
    res.render("login")
});



app.get("/register", function(req,res){
    res.render("register")
});



//Only visisble if the users is authenticated and find all the object in the data base whone secret field is not null
app.get("/secrets", function(req,res){
    User.find({"secret": {$ne:null}}).then((result)=>{
      res.render("secrets", {usersWithSecrets: result})
    })
});


//Using passport to manual registration with hash and 10 rounds of salting
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



//Get the username and password and matches them from the database with authenticate function
app.post("/login", function(req,res){
   const new_user = new User ({
    username: req.body.username,
    password: req.body.password
   });
   req.login(new_user, function(err){
    if("Unauthorized"){
      res.redirect("/login");
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
  