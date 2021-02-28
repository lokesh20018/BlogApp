var express = require("express") ;
var bodyParser = require("body-parser") ;
var override = require("method-override");
var sanitizer = require("express-sanitizer") ;
var env = require('dotenv').config()
var app = express() ;
const mongoose = require('mongoose');
const uri = process.env.dbUrl ;

mongoose.connect(uri, {
  useNewUrlParser: true,
  useUnifiedTopology: true
})
.then(() => console.log('Connected to the DataBase!'))
.catch(error => console.log(error.message));

app.use(express.json()) ;
app.set("view engine" , "ejs") ;
app.use(express.static("public")) ;
app.use(bodyParser.urlencoded({extended: true})) ;
app.use(override("_method")) ; // to listen for a put request and a delete request..
app.use(sanitizer()) ;
// basic setup is done.....
// mongoose setup...
var blogSchema = new mongoose.Schema({
    title: String ,
    image:String ,
    body : String ,
    author : String,
    created : {type : Date , default:Date.now}
})
var Blog = mongoose.model("Blog" , blogSchema) ;

// routes.....
 app.get("/" , function(req,res){
    res.redirect("/blogs") ;
}) 

// index route.... 
app.get("/blogs" , function(req ,res){
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
app.get("/blogs/new" , function(req , res){
    res.render("new") ;
}) ;

//create route 
app.post("/blogs" , function(req, res) {
    // console.log(req.body) ;
    req.body.blog.body = req.sanitize(req.body.blog.body) ;
    // console.log(req.body) ;
    //create blog 
    Blog.create(req.body.blog , function(err , newBlog){
        if(err){
            res.render("new") ;
        }
            //else return to the index 

        else {
            res.redirect("/blogs") ;
        }
    }) ;
    
})

// show route (/dogs/:id)
app.get("/blogs/:id" , function(req , res){
    // id for each of the post is used from the DB and then , passed with the 
    // request here we use that ID to extract the same stuff from our DB..
    Blog.findById(req.params.id , function(err , foundBlog){
        if(err){
            res.redirect("/blogs") ;
        }
        else{
            res.render("show" , {blog : foundBlog}) ;
        }
    })
})


// EDIT route...
app.get("/blogs/:id/edit" , function(req , res){
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

app.put("/blogs/:id" , function(req,res){
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
app.delete("/blogs/:id" , function(req , res){
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
