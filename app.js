//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const bcrypt = require('bcrypt');
const saltRounds = 10;

const app = express();

app.set("view engine", "ejs");

app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static("public"));

// Connecting to mongoDB and if diaryDB does not exists, create one
mongoose.connect("mongodb://127.0.0.1:27017/userDB");

// Schema for the journals
const userSchema = new mongoose.Schema({
    email : String,
    password : String,
  });





// Creating the DB with the defined user
const User = mongoose.model("User", userSchema);


app.get("/", function(req,res){
    res.render("home")
});

app.get("/login", function(req,res){
    res.render("login")
});

app.get("/register", function(req,res){
    res.render("register")
});

app.post("/register", function(req,res){
    bcrypt.hash(req.body.password, saltRounds, function(err, hash) {
        // Store hash in your password DB.
        const new_user = new User({
            email: req.body.username,
            password: hash
        })
        new_user.save().then(savedDoc => {
            if (savedDoc === new_user){
                res.render("secrets")
            } else{
                console.log("Error")
            }
          });
    });

});

app.post("/login", function(req,res){
    User.findOne({ email: req.body.username }).then((result) => {
        bcrypt.compare(req.body.password, result.password, function(err, result) {
            // result == true
            if(result == true){
                res.render("secrets");
            } else {
                res.redirect("/login")
            }
        });
      });
    
})


app.listen(3000, function () {
    console.log("Server started on port 3000");
});
  