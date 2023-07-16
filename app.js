//jshint esversion:6
require('dotenv').config()

const express = require("express");
const bodyParser = require("body-parser");
const ejs = require("ejs");
const mongoose = require("mongoose");
const encrypt = require('mongoose-encryption');


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


// add secret and plugin before we use mongoose.model to create the schema
const secret = process.env.SECRET
// user excludeFromEncryption: ['nickname'] to exclude certain fields from encryption
userSchema.plugin(encrypt, { secret: secret,  encryptedFields: ['password'] });

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
    const new_user = new User({
        email: req.body.username,
        password: req.body.password
    })
    new_user.save().then(savedDoc => {
        if (savedDoc === new_user){
            res.render("secrets")
        } else{
            console.log("Error")
        }
      });
});

app.post("/login", function(req,res){
    User.findOne({ email: req.body.username }).then((result) => {
        if(req.body.username === result.email && result.password === req.body.password){
            res.render("secrets");
        } else {
            res.redirect("/login")
        }
      });
    
})


app.listen(3000, function () {
    console.log("Server started on port 3000");
});
  