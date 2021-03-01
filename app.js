var express = require("express") ;
var bodyParser = require("body-parser") ;
var override = require("method-override");
var sanitizer = require("express-sanitizer") ;
var env = require('dotenv').config()
var app = express() ;
const mongoose = require('mongoose');
const uri = process.env.dbUrl ;
const flash = require("connect-flash") ;


mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to the DataBase!'))
.catch(error => console.log(error.message));

/////////////

const User = require('./models/user');

/////////////


var passport = require('passport') , LocalStrategy = require('passport-local').Strategy;
// use static authenticate method of model in LocalStrategy
passport.use(new LocalStrategy(User.authenticate()));

// use static serialize and deserialize of model for passport session support

app.use(express.json()) ;
app.set("view engine" , "ejs") ;
app.use(express.static("public")) ;
app.use(bodyParser.urlencoded({extended: true})) ;
app.use(override("_method")) ; // to listen for a put request and a delete request..
app.use(sanitizer()) ;

//// for auth

var session = require("express-session");
const user = require("./models/user");

app.use(express.static("public"));
app.use(session({ secret: "cats" , 
                  cookie:{
                      httpOnly : true , 
                      expires: Date.now() + 1000*60*60*24*7,
                      maxAge : 1000*60*60*24*7
                  }                
}));
app.use(passport.initialize());
app.use(passport.session());
passport.use(new LocalStrategy(User.authenticate())) ; 

passport.serializeUser(User.serializeUser());
passport.deserializeUser(User.deserializeUser());

app.use((req,res,next) => {
    res.locals.currentUser = req.user ; 
    next() ; 
})

// basic setup is done.....
// mongoose setup...
var blogSchema = new mongoose.Schema({
    title: String ,
    image:String ,
    body : String ,
    author : {
        type: mongoose.Schema.Types.ObjectId , 
        ref : 'User'
    },
    created : {type : Date , default:Date.now}
})
var Blog = mongoose.model("Blog" , blogSchema) ;

// middleware...

const isLoggedIn = (req, res, next) => {
    //console.log("req.usr.." , req.user ) ;
    if(!req.isAuthenticated()){
        return res.redirect('/login') ; 
    }
    next() ; 
}


// routes.....

app.get("/register" , (req , res) => {
    res.render("register") ; 
})

app.post("/register" ,async (req,res) => {
    try{
    const {email,username , password} = req.body ;
    const userreg = new User({email , username})  ;
    const registeredUser = await User.register(userreg , password) ;
    req.logIn(registeredUser , (err) =>{
        if(err) return next(err) ; 
    }) ;
    res.redirect("/") ; 
    } catch(e){
        console.log(e) ; 
        res.render("ar") ;
    }  
})

app.get("/login" , (req,res)=> {
    res.render("login") ; 
})

app.post('/login' , passport.authenticate('local' , {failureRedirect : '/errlogin'}) , (req,res)=>{
    res.redirect("/") ;
} );
app.get('/errlogin' , (req, res)=> {
    res.render('errlogin') ; 
})
 app.get("/" , function(req,res){
    res.redirect("/blogs") ;
}) 


app.get("/logout" , (req, res)=> {
    req.logOut() ;
    res.redirect("/") ; 
})



// index route.... 
app.get("/blogs" ,  function(req ,res){
    Blog.find({} , function(err , blogs){
        if(err){
            console.log(err) ;
        }
        else{
            res.render("index" ,  {blogs : blogs}) ;
        }
    })
})
// new route...
app.get("/blogs/new" , isLoggedIn , function(req , res){
    res.render("new") ;
}) ;

//create route 
app.post("/blogs" , isLoggedIn , function(req, res) {
    // console.log(req.body) ;
    req.body.blog.body = req.sanitize(req.body.blog.body) ;
    req.body.blog.author = req.user._id ; 
     console.log(req.body) ;
    //create blog 
    Blog.create(req.body.blog , function(err , newBlog){
        if(err){
            res.render("new") ;
        }
            //else return to the index 

        else {
             //newBlog.body.author = req.user.id ; 
            res.redirect("/blogs") ;
        }
    }) ;
    
    
})

// show route (/dogs/:id)
app.get("/blogs/:id" ,  isLoggedIn , async function(req , res){
    // id for each of the post is used from the DB and then , passed with the 
    // request here we use that ID to extract the same stuff from our DB..
    const foundBlog = await Blog.findById(req.params.id ) ;

    if(!foundBlog){
        res.redirect("/blogs") ;
    }
    else{
         
        console.log(foundBlog) ;
        console.log(typeof(foundBlog)) ;
        
        //res.send(foundBlog);
        res.render("show" , {blog : foundBlog}) ;
    }
})


// EDIT route...
app.get("/blogs/:id/edit" , isLoggedIn,  function(req , res){
    Blog.findById(req.params.id , function(err , foundBlog){
        if(err){
            res.redirect("/") ;
        }
        else{
            res.render("edit" , {blog : foundBlog}) ;
        }
    }) ;
})

// update route

app.put("/blogs/:id" , isLoggedIn , function(req,res){
    req.body.blog.body = req.sanitize(req.body.blog.body) ;
    Blog.findByIdAndUpdate(req.params.id , req.body.blog , function(err , updatedblog){
        if(err){
            console.log(err) ;
            res.redirect("/blogs") ;
        }
        else{
            res.redirect("/blogs/" + req.params.id) ;
        }
    })
})

// DESTROY route...
app.delete("/blogs/:id" , isLoggedIn,  function(req , res){
    // destroy blog 
    Blog.findByIdAndRemove(req.params.id , function(err){
        if(err) {
            res.redirect("/blog") ;
        }
        else{
            res.redirect("/blogs") ;
        }
    })
})
app.get("/lol" , (req,res) => {
    res.send("you got into lol") ; 
})
var port = process.env.PORT || 2000  ;
app.listen(port , function(){
    console.log("connected to the server !!") ;
})
// check
