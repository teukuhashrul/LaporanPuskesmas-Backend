import express from 'express'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import dotenv from 'dotenv';
import multer from 'multer'

import {getBooks} from './db.js'
dotenv.config()
// get access token secret from env file 
const accessTokenSecret = process.env.ACCESSTOKENSECRET
const user = {username : "hashrul" , password : "hashrul"}



var app = express();
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));

// required lib for receving data and save it to local temp 
var storage = multer.diskStorage({
    destination: function (req, file, cb) {

        cb(null, './tmp')
    },
    filename: function (req, file, cb) {
        let ext = ''; // set default extension (if any)
        let nameWithExt = file.originalname
        let nameArr = nameWithExt.split(".")
        let nameWithoutExt = nameArr[0]

        if (file.originalname.split(".").length > 1) // checking if there is an extension or not.
            ext = file.originalname.substring(file.originalname.lastIndexOf('.'), file.originalname.length);
        cb(null, nameWithoutExt + ext)
    }
})
var upload = multer({ storage: storage });




// JWT AUTHENTICATION METHOD  : 
const authenticateJWT = (req, res, next) => {
    const authHeader = req.headers.authorization;

    console.log(authHeader)
    if (authHeader) {
        const token = authHeader.split(' ')[1];

        jwt.verify(token, accessTokenSecret, (err, user) => {
            if (err) {
                // console.log(err)
                return res.sendStatus(403)
            }

            req.user = user;
            next();

        });
    } else {
        res.sendStatus(403)
    }
}




app.use(function (request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// for local testing
app.listen(process.env.PORT || 5000, () => {
    console.log("Server running on port 5000 !");
});

// // for production / hosting
// app.listen( 5000, () => {
//     console.log("Server running on port 5000 !");
// });


app.get('/', (req,res)=>{
    res.send({"message" : "welcome to puskesmas mantap anjay mabar"})
})


app.post('/loginuser', (req, res) => {
    // receive from body
    // const {username , password } = req.body 

    // alternative 1: receive data post from query params (the one stands after the url request ex : http://api.com/login?username=blabla)
    // const {username , password } = req.query

    // pilihan 2:kalo receive dari url x encoded 
    const username = req.body.username
    const password = req.body.password

    // get the accessToken secret 

    if (username === "hashrul" && password === "hashrul") {
        const accessToken = jwt.sign(user, accessTokenSecret, {expiresIn: '30m'})

        res.json({ token: accessToken, username: "hashrul" })
    } else {
        res.status(403).send({
            error:
            {
                statuscode: 403,
                message: "wrong username / password "
            }

        })
    }

})

// example with jwt 
app.get('/reports', authenticateJWT, (req, res) => {
    res.json("nih reports")
})

// example for  single file upload 
app.post('/image/single', upload.array('photos' , 2), function(req,res){
    console.log(req.files[0]) 


    console.log(req.files[1]) 

    console.log(req.body.name)

    res.send("bisaaaa")
})


// example for getting data from database 
app.get('/books' , (req,res)=>{
    getBooks().then((result)=>{

        console.log(result)
        res.json({
            statuscode  : 200,
            data : result, 
             
        })
    }).catch((err)=>{
        res.status(403).send(err)
    })
})


