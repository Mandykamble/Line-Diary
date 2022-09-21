require('dotenv').config()

const bodyParser = require("body-parser");
const express =require("express");
const ejs=require("ejs");
const { default: mongoose } = require("mongoose");
// const mongoose = require("mongoose");
// const encrypt = require('mongoose-encryption');'
// const md5=require("md5");
const session = require("express-session");
const passport = require("passport");
const passportlocalmongoose = require("passport-local-mongoose");
const GoogleStrategy = require('passport-google-oauth20').Strategy;
const findOrCreate = require('mongoose-findorcreate');
var date = new Date();
var Day=date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear();
const PORT = process.env.port||3000;


const app=express();

// console.log(process.env.API_kEY);

app.use(express.static("public"));
app.set("view engine","ejs");
app.use(bodyParser.urlencoded({extended:true}));

app.use(session({
    secret: 'the simple secret ',
    resave: false,
    saveUninitialized: false,
    
  }));

app.use(passport.initialize());
app.use(passport.session());
// 1
mongoose.connect("mongodb+srv://admin-mandar:Test123@cluster1.rfwknl3.mongodb.net/userDB",{useNewUrlParser:true});
// 2
// mongoose.set("useCreateIndex",true); 

// const secretSchema=new mongoose.Schema({name:String})
const userSchema=new mongoose.Schema({
    email:String,
    password:String,
    googleId:String,
    secret:[{type:String}],
    date:[{type:String}]
   
});

userSchema.plugin(passportlocalmongoose);
userSchema.plugin(findOrCreate);

// 3
const User=new mongoose.model("User",userSchema);
passport.use(User.createStrategy());

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

passport.use(new GoogleStrategy({
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.SECRET,
    callbackURL: "https://localhost:3000/auth/google/secrets",
    userProfileURL: "https://www.googleapis.com/oauth2/v3/userinfo"
  },
  function(accessToken, refreshToken, profile, cb) {
    User.findOrCreate({ googleId: profile.id }, function (err, user) {
      return cb(err, user);
    });
  }
));
//
app.get("/",(req,res)=>{
    res.render("home");
});

app.get("/auth/google",(req,res)=>{
    passport.authenticate("google",{scope:["profile"]});
});

app.get("/auth/google/secrets", 
  passport.authenticate("google", { failureRedirect: "/login "}),
  (req, res) =>{
    // Successful authentication, redirect home.
    res.redirect("/secrets");
  });
app.get("/login",(req,res)=>{
    res.render("login");
});

app.get("/register",(req,res)=>{
    res.render("register");
});

app.get("/secrets",(req,res)=>{
    const userId=req.user.id;
    
    var date = new Date();
	var current_date =date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear();
    User.findById(userId,(err,founduser)=>{
        if(err){
                    console.log(err);
                }
                else{
                    if(founduser){
                 res.render("secrets",{userWIthSecret:founduser.secret,CurrDate: current_date,saveddate:founduser.date,userNM:founduser.username}); 
                //  res.render("secrets", {CurrDate: current_date}); 
                }
                }
                
    });

    // User.find({"id":userId},(err,founduser)=>{
    //     if(err){
    //         console.log(err);
    //     }
    //     else{
    //         if(founduser){
    //      res.render("secrets",{userWIthSecret:founduser.secret});   
    //     }
    //     }
    // });
});


app.get("/submit",(req,res)=>{
    //
    var date = new Date();
	var current_date =date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear();
    //
    if(req.isAuthenticated()){
        res.render("submit",{CurrDate: current_date});
      
    }
    else{
        res.redirect("/login");
    }
});

app.post("/submit",(req,res)=>{
    var date = new Date();
     const submitedsecret=req.body.secret;
     var Day=date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear();

     console.log(req.user);
     console.log(submitedsecret);
     console.log(Day);
     
     User.findById(req.user.id,(err,founduser)=>{
        if(err){
            console.log(err);
        }
        else{
            if(founduser){
            
            founduser.secret.push(submitedsecret);
            founduser.date.push(Day);
            
            // founduser.date=Day;
            founduser.save(function(){
              res.redirect("/secrets");
              
                });
            }
        }
        console.log(founduser.date);
        console.log(founduser.secret);
     });    
});


app.get("/logout",(req,res)=>{
   req.logout((err)=>{
    if(err){
        console.log(err);
    }
    else{
       res.redirect("/"); 
    }
   });
   

});
//
app.post("/register",(req,res)=>{
    User.register({username:req.body.username},req.body.password,(err,user)=>{
        if(err){
            console.log(err);
            res.redirect("/register");
        }
        else{
           passport.authenticate("local")(req,res,function(){
             res.redirect("/secrets");
           });
        }
    });
    
});

app.post("/login",(req,res)=>{
    
    const user=new User({
        username:req.body.username,
        password:req.body.password
    });
    req.login(user,(err)=>{
        if(err){
            console.log(err);
        }
        else{
            passport.authenticate("local")(req,res,function(){
                res.redirect("/secrets");
              }); 
        }
    })
});


app.get("/Aboutus",(req,res)=>{
    res.render("Aboutus");
});
app.get("/MyDiary",(req,res)=>{
    
    const userId=req.user.id;
    var date = new Date();
	var current_date =date.getDate()+"-"+(date.getMonth()+1)+"-"+date.getFullYear();
    User.findById(userId,(err,founduser)=>{
        if(err){
                    console.log(err);
                }
                else{
                    if(founduser){
                 res.render("MyDiary",{userWIthSecret:founduser.secret,CurrDate: current_date,saveddate:founduser.date});  
                //  res.render("secrets", {CurrDate: current_date}); 
                }
                }
                
    });
});
app.get("/Home",(req,res)=>{
    res.render("home");
});


app.listen(3000,()=>{
    console.log("App lsitening on Port 3000");
});


