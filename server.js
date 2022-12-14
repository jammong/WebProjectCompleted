var express = require("express");
var app = express();
var path = require("path");
const exphbs = require("express-handlebars");
var HTTP_PORT = process.env.PORT || 8080;
const bodyParser = require("body-parser");
const mongoose = require("mongoose");
const handlebars = require("express-handlebars");
const clientSessions = require("client-sessions");
var bcryptjs = require('bcryptjs');

//cylic : https://wild-ruby-pelican-hat.cyclic.app/
//id : yeonsu 
//password : Jamong1225@
const Schema = mongoose.Schema;
//password : YP4jf6pnRSy3AXEU
const registration = mongoose.createConnection("mongodb+srv://yeonsu:YP4jf6pnRSy3AXEU@web322.o84lom6.mongodb.net/?retryWrites=true&w=majority")
const blog = mongoose.createConnection("mongodb+srv://yeonsu:YP4jf6pnRSy3AXEU@web322.o84lom6.mongodb.net/?retryWrites=true&w=majority")


const registrationSchema = new Schema({
    "firstname": String,
    "lastname": String,
    "email": String,
    "username": {
        "type": String,
        "unique": true
    },
    "password": {
        "type": String,
        "unique": true
    }
});

const blogSchema = new Schema({
    "title": String,
    "content": String,
    "date": String,
    "image": String
});

const userData = registration.model("registration", registrationSchema);
const blog_c = blog.model("blog", blogSchema);


app.use(clientSessions({
    cookieName: "session", 
    secret: "webAssignment6", 
    duration: 5 * 60 * 1000, 
    activeDuration: 1000 * 60 
}));

app.engine(".hbs", handlebars.engine({ extname: ".hbs" }));
app.set("view engine", ".hbs");
app.use(bodyParser.urlencoded({ extended: true}));

app.get("/", function(req,res){
    res.render("blog", {layout : false});
});

app.get("/blog", function(req,res){
    blog_c.find().exec().then((data) => {
        let dataLog = new Array;
        data.forEach(element => {
            dataLog.push({
                title: element.title,
                content: element.content,
                date: element.date,
                image: element.image
            });
        });
        res.render("blog", {title: dataLog, layout:false});
    });
});


function ensureLogin(req, res, next) {
    if (!req.session.adminData) {
      res.redirect("/login");
    } else {
      next();
    }
  };

app.get("/admin", ensureLogin, function(req,res) {
    res.render("admin", {layout:false});
});

app.post("/admin", function(req,res) {
    console.log("req.body.img");
    let articelData = new blog_c ({
        title: req.body.title,
        content: req.body.content,
        date: req.body.data,
        image: req.body.img
    }).save((e, data) => {
        if(e) {
            console.log(e);
        } else {
            console.log(data);
        }
    });
    res.redirect("/");
});

app.post("/read_more", function(req,res){
    blog_c.findOne({title: req.body.title}).exec().then((data) => {
        res.render("read_more", {image:data.image, id: data._id, read: data.content, title: data.title, date: data.date, layout: false });
    });
})

app.post("/update", ensureLogin,(req, res) => {
    blog_c.updateOne({
        _id: req.body.ids
    }, {
        $set: {
            title: req.body.title,
            content: req.body.content,
            date: req.body.date,
            image: req.body.img
        }
    }).exec();
    res.redirect("/");
});

app.get("/login", function(req,res){
    res.sendFile(path.join(__dirname, "/login.html"));
});

//Router function for 'login' page
app.post("/login", function(req,res){
    var userdata = {
        user: req.body.email,
        pw: req.body.password,
        expression: /[~`!#@$%\^&*+=\-\[\]\\';,/{}|\\":<>\?]/.test(req.body.email)
    }
    if (userdata.user == "" || userdata.pw == "") {
        res.render("login", { data: userdata, layout: false });
        return;
    }
    if (userdata.expression) {
        res.render("login", { data: userdata, layout: false });
        return;
    }
    userData.findOne({email: userdata.user}, ["email", "password"]).exec().then((data) => {
        bcryptjs.compare(req.body.password, data.password).then((result) => {
            console.log(result);
            if (result) {
                if(data._id = "6397a51a42fb0bb9bd25ab10"){
                    req.session.adminData = {
                        username: userdata.email,
                        password: userdata.pw
                    }
                    console.log("session is created!");
                    res.render("admin", {firstname: result.firstname, lastname: result.lastname, username: result.username, layout: false});
                    return;
                }
                else {
                    req.session.userdata = {
                        username: userdata.email,
                        password: userdata.pw
                    }
                    res.render("user", {firstname: data.firstname, lastname: data.lastname, username: data.username, layout: false});
                    return;
                }
            } else {
                res.render("login", {error: "You have entered the wrong username and/or password, please try again!", layout:false});
                return;
            }
        })
    });

});
//Router function for 'registration' page
app.get("/registration", function(req,res){
    res.sendFile(path.join(__dirname, "/registration.html"));
});

app.post("/registration", function(req,res){
    var userdata = {
        firstname: req.body.firstName,
        lastname: req.body.lastname,
        email: req.body.email,
        pw: req.body.pw,
        reEntPassword: req.body.reEntPassword,
        phoneNum: req.body.phoneNum,
        expressionP: /^[a-zA-Z]\w{5,15}$/.test(req.body.pw),
        expressionPN: /^[2-9]\d{2}-\d{3}-\d{4}$/.test(req.body.phoneNum)
    }
    matchedPassword = function() {
        if (userdata.pw == userdata.reEntPassword) {
            return true;
        }
        return false;
    }
    if (userdata.firstname == "" ||  userdata.lastname == "" || userdata.email == "" || userdata.pw == "" || userdata.reEntPassword == ""|| userdata.phoneNum == "") 
    {
        res.render("registration", { data: userdata, layout: false });
        return;
    }
    if (userdata.expressionP) {
        res.render("registration", { data: userdata, layout: false });
        return;
    }
    if (!userdata.expressionPN) {
        res.render("registration", { data: userdata, layout: false });
        return;
    }
    bcryptjs.hash(userdata.pw, 10).then((hash) => {
        var userInfo = new userData({
            firstname: userdata.firstname,
            lastname: userdata.lastname,
            email: userdata.email,
            password: hash
        }).save((e, data) => {
            if (e) {
                console.log(e);
            } else {
                console.log(data);
            }
        });
        console.log(hash);
    });
        res.render("dashboard", {layout:false});
});

app.use(express.static("img"));
app.listen(HTTP_PORT);