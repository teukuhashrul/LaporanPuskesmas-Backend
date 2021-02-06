import express from 'express'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import dotenv from 'dotenv';
import multer from 'multer'

import { getBooks } from './db.js'
import { getAllUsers, getUserById, deleteUserById, loginUser } from './user.js';
dotenv.config()
// get access token secret from env file 
const accessTokenSecret = process.env.ACCESSTOKENSECRET



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

        jwt.verify(token, accessTokenSecret, (err) => {
            if (err) {
                // console.log(err)
                return res.sendStatus(401).json({
                    statuscode : 401 ,
                    message : "Unauthorized Request, please provide with a valid Token"
                })
            }

            next();

        });
    } else {
        res.status(406).json({
            statuscode : 406,
            message : 'Token data in Authorization Header not included'
        })
    }
}




app.use(function (request, response, next) {
    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// for production
// app.listen(process.env.PORT || 5000, () => {
//     console.log("Server running on port 5000 !");
// });

// // for local testing 
app.listen(5000, () => {
    console.log("Server running on port 5000 !");
});


app.get('/', (req, res) => {
    res.send({ "message": "welcome to puskesmas mantap anjay mabar" })
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

    if (username && password) {
        loginUser(username, password).then((result) => {
            if (result.length > 0) {
                const userData = result[0]
                const accessToken = jwt.sign(userData, accessTokenSecret, { expiresIn: '30m' })

                res.json({
                    statuscode : 200 , 
                    token : accessToken ,
                    id : userData.id ,
                    username : userData.username
                })

            } else {
                res.status(401).json({
                    statuscode : 401,
                    message : "Wrong username / Password. "
                })

            }
        })
    } else {
        let errorMessage = ''
        if(!username && !password){
            errorMessage= 'Please provide Both username and password in the body Request'
        }else if(!username){
            errorMessage = 'Please provide username in the body Request'
        }else{
            errorMessage= 'Please provide password in the body Request'
        }

        res.status(406).json({
            statuscode : 406 , 
            messsage : errorMessage
        })
    }

})

// example with jwt 
app.get('/reports', authenticateJWT, (req, res) => {
    res.json("nih reports")
})

// example for  single file upload 
app.post('/image/single', upload.array('photos', 2), function (req, res) {
    console.log(req.files[0])


    console.log(req.files[1])

    console.log(req.body.name)

    res.send("bisaaaa")
})


// example for getting data from database 
app.get('/books', (req, res) => {
    getBooks().then((result) => {

        console.log(result)
        res.json({
            statuscode: 200,
            data: result,

        })
    }).catch((err) => {
        res.status(403).send(err)
    })
})


app.get('/credential', (req, res) => {
    res.json({
        'database': process.env.DATABASE,
        'host': process.env.HOST,
        'user': process.env.USER,
        'port': process.env.PORT,
        'password': process.env.PASSWORD
    })
})


// get all users 
app.get('/users', (req, res) => {
    getAllUsers().then((result) => {

        res.json({
            statuscode: 200,
            data: result
        })
    })
})


// get User By Id Detail 
app.get('/user', (req, res) => {
    let id = req.query.id

    if (id) {
        getUserById(id).then((result) => {

            if (result.length > 0) {
                res.json({
                    statuscode: 200,
                    data: result[0]
                })
            } else {
                res.status(404).json({
                    statuscode: 404,
                    message: `User for id ${id} not found, please provide an available User id`
                })
            }
        })
    } else {

        res.status(406).json({
            statuscode: 406,
            message: "Parameter Id is not included, please provide an User id"
        })

    }
})


// Delete user By Id 
app.delete('/user', (req, res) => {
    let id = req.query.id

    if (id) {
        deleteUserById(id).then((result) => {
            if (result.rowCount > 0) {
                res.json({
                    statuscode: 200,
                    message: `Successfully deleted data for id  ${id}`
                })
            } else {
                res.status(404).json({
                    statuscode: 404,
                    message: `User for id ${id} not found, please provide an available User Id`
                })
            }
        }).catch((err) => {

        })

    } else {
        res.status(406).json({
            statuscode: 406,
            message: "Parameter Id is not included, please provide an User id"
        })
    }
})
