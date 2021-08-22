import express from 'express'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import dotenv from 'dotenv';
import multer from 'multer'
import { db, getBooks } from './db.js'
import atob from 'atob'
import {FormInputter,ParticipantInputter} from './Inputter.js'
import {AddInput,RadioButton,Dropdown,Input,BasicInput,Form, CustomInput} from './Form.js'
import { getAllUsers, getUserById, deleteUserById, loginUser } from './user.js';
import { createPencatatan, deletePencatatanById, getAllPencatatan, getPencatatanById } from './pencatatan.js'
import {
    assignLaporanToUser, getAllLaporan, getAllLaporanAssignedToUser, submitLaporan,
    getDetailLaporanById, getAllLaporanWithDeskripsi, updateCatatanLaporan
} from './laporan.js'
import { getAllDeskripsiSingkat } from './deskripsi_singkat.js'
import { get_all_history_laporan } from './user_laporan.js'
import { deleteAllLaporanData } from './delete.js'
import { removeDuplicateFromArrayNumber } from './utils.js'
import { getAllPuskesmas, insertPuskesmas } from './puskesmas.js'

import cors from 'cors'
dotenv.config()
// get access token secret from env file 
const accessTokenSecret = process.env.ACCESSTOKENSECRET



var app = express();


app.use(cors())
app.use(bodyParser.json({ limit: '10mb' }));
app.use(bodyParser.urlencoded({ extended: false, limit: '50mb' }));




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
                    statuscode: 401,
                    message: "Unauthorized Request, please provide with a valid Token"
                })
            }

            next();

        });
    } else {
        res.status(406).json({
            statuscode: 406,
            message: 'Token data in Authorization Header not included'
        })
    }
}




app.use(function (request, response, next) {

    response.header("Access-Control-Allow-Origin", "*");
    response.header("Access-Control-Allow-Headers", "Origin, X-Requested-With, Content-Type, Accept");
    next();
});


// for production
app.listen( process.env.PORT, () => {
    console.log(`Server running on port ${process.env.PORT} !`);
});



// FOR LOCAL TESTING
// app.listen(5000, () => {
//     console.log("Server running on port 5000 !");
// });

//--------------------------------------------------------------------------------------

app.get('/', (req, res) => {
    res.send({ "message": "welcome to puskesmas mantap anjay mabar" })
})

app.post('/form-survey',(req,res) => {
    try{
        db.query(`INSERT INTO survey (data) VALUES ('${JSON.stringify(req.body)}')`).then(() => {
            res.status(200).send("")
            console.log('HEHEH');
        })
    }catch(e){
        console.log(e);
        res.status(500);
    }
    return "";
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
                    statuscode: 200,
                    token: accessToken,
                    id: userData.id,
                    username: userData.username
                })

            } else {
                res.status(401).json({
                    statuscode: 401,
                    message: "Wrong username / Password. "
                })

            }
        })
    } else {
        let errorMessage = ''
        if (!username && !password) {
            errorMessage = 'Please provide Both username and password in the body Request'
        } else if (!username) {
            errorMessage = 'Please provide username in the body Request'
        } else {
            errorMessage = 'Please provide password in the body Request'
        }

        res.status(406).json({
            statuscode: 406,
            messsage: errorMessage
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
    const searchQuery = req.query.searchQuery;
    getAllUsers(searchQuery).then((result) => {

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
                res.status(422).json({
                    statuscode: 422,
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
                res.status(422).json({
                    statuscode: 422,
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

// create pencatatan 
app.post('/createpencatatan', (req, res) => {

    const form = req.body.form


    if (form) {
        createPencatatan(form).then((result) => {
            res.json({
                statuscode: 200,
                message: result
            })
        }).catch((err) => {
            res.status(422).json({
                statuscode: 422,
                message: err
            })
        })

    } else {
        let errorMessage = 'form data is missing from the body param, please provide a valid body param'
        res.status(406).json({
            statuscode: 406,
            message: errorMessage
        })
    }
})

// get all pencatatan
app.get('/getallpencatatan', (req, res) => {
    const user_id = req.query.user_id

    getAllPencatatan(user_id).then((result) => {
        res.json({
            statuscode: 200,
            data: result
        })
    }).catch((err) => {
        res.status(422).json({
            statuscode: 422,
            message: err
        })
    })
})

// get pencatatan by id 
app.get('/getpencatatanbyid', (req, res) => {
    const id = req.query.id

    getPencatatanById(id).then((result) => {
        res.json({
            statuscode: 200,
            data: result
        })
    }).catch((err) => {
        res.status(406).json({
            statuscode: 406,
            message: err
        })
    })
})


//  delete pencatatan by id 
app.delete('/pencatatan', (req, res) => {
    let id = req.query.id

    if (id) {
        deletePencatatanById(id).then((result) => {
            if (result.rowCount > 0) {
                res.json({
                    statuscode: 200,
                    message: `Successfully deleted data pencatatan for id  ${id}`
                })
            } else {
                res.status(422).json({
                    statuscode: 422,
                    message: `User for id ${id} not found, please provide an available Pencatatan Id`
                })
            }
        }).catch((err) => {

        })

    } else {
        res.status(406).json({
            statuscode: 406,
            message: "Parameter Id is not included, please provide an Pencatatan id"
        })
    }
})


// create laporan
app.post('/createlaporan', (req, res) => {
    const alamat = req.body.alamat;
    const latitude = req.body.latitude;
    const longitude = req.body.longitude;
    const nama_terlapor = req.body.nama_terlapor;
    const id_status = req.body.id_status;

    let missingBody = [];

    if (!alamat) missingBody.push("alamat");
    if (!latitude) missingBody.push("latitude");
    if (!longitude) missingBody.push("longitude");
    if (!nama_terlapor) missingBody.push("nama_terlapor");
    if (!id_status) missingBody.push("id_status");

    if (missingBody.length > 0) {
        let message = '';
        missingBody.map((element, index) => {
            if (index == 0) {
                message += `${element} `;
            } else if (index == missingBody.length - 1) {
                message += `and ${element}`;
            } else {
                message += `,${element} `;
            }
        })

        message += ' param is missing from the request, please send enough body param';

        res.status(406).json({
            statuscode: 406,
            message: message
        })

    } else {
        if (isNaN(latitude) || isNaN(longitude) || isNaN(id_status)) {
            res.status(406).json({
                statuscode: 406,
                message: "Please input valid number data type "
            })
            return
        }


        createLaporan(alamat, latitude, longitude, nama_terlapor, id_status).then((newLaporan) => {
            res.json({
                statuscode: 200,
                message: newLaporan
            })
        }).catch((err) => {
            res.status(422).json({
                statuscode: 422,
                message: err
            })
        })
    }

})


// assign laporan to user
app.post('/assign_laporan_to_user', (req, res) => {
    const id_user = req.body.id_user;
    const id_laporan = req.body.id_laporan;

    let missingBody = [];
    if (!id_user) missingBody.push("id_user");
    if (!id_laporan) missingBody.push("id_laporan");


    if (missingBody.length > 0) {
        let message = '';
        missingBody.map((element, index) => {
            if (index == 0) {
                message += `${element} `;
            } else if (index == missingBody.length - 1) {
                message += `and ${element}`;
            } else {
                message += `,${element} `;
            }
        })

        message += ' param is missing from the request, please send enough body param';

        res.status(406).json({
            statuscode: 406,
            message: message
        })

    } else {

        if (isNaN(id_user) || isNaN(id_laporan)) {
            res.status(406).json({
                statuscode: 406,
                message: "Please input valid number data type "
            })
            return
        }


        assignLaporanToUser(id_laporan, id_user, 2).then((assignResult) => {
            res.json({
                statuscode: 200,
                message: assignResult
            })
        }).catch((errResult) => {
            console.log(errResult);
            res.status(422).json({
                statuscode: 422,
                message: errResult
            })
        })
    }



})



// get all laporan 
app.get('/get_all_laporan', (req, res) => {
    const searchQuery = req.query.searchQuery;
    const id_status = req.query.id_status;
    const filterAssign = req.query.filterAssign

    getAllLaporan(searchQuery, id_status, filterAssign).then((result) => {
        res.json({
            statuscode: 200,
            data: result
        })
    }).catch((error) => {
        res.status(422).json({
            statuscode: 422,
            message: error
        })
    })


})

// get all laporan assigned to user 
app.get('/get_all_laporan_assigned_to_user', (req, res) => {

    const id_status = req.query.id_status
    const id_user = req.query.id_user
    const searchQuery = req.query.searchQuery 


    console.log(`id_status ${id_status} id_user ${id_user}`)

    getAllLaporanAssignedToUser(id_status, id_user, searchQuery).then((result) => {
        res.json({
            statuscode: 200,
            data: result
        })
    }).catch((error) => {
        res.status(422).json({
            statuscode: 422,
            message: error
        })
    })

})

// get all deskripsi singkat 
app.get('/get_deskripsi_singkat', (req, res) => {
    getAllDeskripsiSingkat().then((resultQuery) => {
        res.json({
            statuscode: 200,
            data: resultQuery
        })
    }).catch((err) => {
        res.status(422).json({
            statuscode: 422,
            message: err
        })
    })
})

// submit laporan
app.post('/submit_laporan', (req, res) => {
    let arr_of_foto = req.body.arr_of_foto
    let arr_of_deskripsi_singkat_id = req.body.arr_of_deskripsi_singkat_id
    let longitude = req.body.longitude
    let latitude = req.body.latitude
    const catatan = req.body.catatan
    const alamat = req.body.alamat
    const nama_terlapor = req.body.nama_terlapor
    const id_user = req.body.id_user
    const phone_number = req.body.phone_number


    let missingParamArr = []

    if (!arr_of_foto) missingParamArr.push("arr_of_foto")
    if (!arr_of_deskripsi_singkat_id) missingParamArr.push("arr_of_deskripsi_singkat_id")
    if (!longitude) missingParamArr.push("longitude")
    if (!latitude) missingParamArr.push("latitude")
    if (!alamat) missingParamArr.push("alamat")
    if (!nama_terlapor) missingParamArr.push("nama_terlapor")
    if (!id_user) missingParamArr.push("id_user")
    if (!phone_number) missingParamArr.push("phone_number")

    let errMissingParamMessage = 'Param : '
    if (missingParamArr.length > 0) {
        missingParamArr.map((element, index) => {
            if (index == 0) {
                errMissingParamMessage += ` ${element}`
            } else {
                errMissingParamMessage += ` ,${element} `

            }
        })
        errMissingParamMessage += ` is missing from body param , please provide valid param`
        res.status(406).json({
            statuscode: 406,
            message: errMissingParamMessage
        })
        return
    }

    let wrongNumVar = ""
    if (isNaN(latitude)) wrongNumVar = 'latitude'
    if (isNaN(longitude)) wrongNumVar = 'longitude'
    if (isNaN(id_user)) wrongNumVar = 'id_user'

    if (wrongNumVar != "") {
        res.status(406).json({
            statuscode: 406,
            message: `Please send a valid number data type for ${wrongNumVar}`
        })
        return
    }



    if (!Array.isArray(arr_of_foto)) {
        let temp = arr_of_foto
        arr_of_foto = [temp]
    }

    if (!Array.isArray(arr_of_deskripsi_singkat_id)) {
        let temp = arr_of_deskripsi_singkat_id
        arr_of_deskripsi_singkat_id = [temp]

    }

    arr_of_deskripsi_singkat_id = removeDuplicateFromArrayNumber(arr_of_deskripsi_singkat_id)

    submitLaporan(arr_of_foto, arr_of_deskripsi_singkat_id, latitude, longitude, catatan, alamat, nama_terlapor, id_user, phone_number).then((submitResult) => {
        res.json({
            statuscode: 200,
            message: submitResult
        })

    }).catch((errSubmit) => {
        res.status(422).json({
            statuscode: 422,
            message: errSubmit
        })
    })



})

// get one laporan detail with id 
app.get('/get_laporan_detail_by_id', (req, res) => {
    const id_laporan = req.query.id_laporan

    if (!id_laporan) {
        res.status(406).json({
            statuscode: 406,
            message: "please provide id laporan in the param query "
        })
        return
    }


    getDetailLaporanById(id_laporan).then((getDetailResult) => {
        res.json({
            statuscode: 200,
            data: getDetailResult
        })
    }).catch((error) => {
        console.log(error);
    })

})


app.get('/get_all_laporan_with_deskripsi', (req, res) => {

    const searchQuery = req.query.searchQuery;
    const filterAssign = req.query.filterAssign

    getAllLaporanWithDeskripsi(searchQuery,filterAssign).then((resultLaporan) => {
        res.json({
            statuscode: 200,
            data: resultLaporan
        })
    }).catch((error) => {
        res.status(422).json({
            statuscode: 422,
            message: "error in back end please contact admin "
        })
    })
})


app.put('/update_catatan_laporan', (req, res) => {
    let id_laporan = req.body.id_laporan
    let catatan = req.body.catatan


    let missingBody = [];
    if (!id_laporan) missingBody.push("id_laporan");
    if (!catatan) missingBody.push("catatan");

    if (missingBody.length > 0) {
        let message = '';
        missingBody.map((element, index) => {
            if (index == 0) {
                message += `${element} `;
            } else if (index == missingBody.length - 1) {
                message += `and ${element}`;
            } else {
                message += `,${element} `;
            }
        })

        message += ' is missing from param body , please provide valid param'
        res.status(406).json({
            statuscode: 406,
            message: message
        })
    } else {
        updateCatatanLaporan(id_laporan, catatan).then((updateResult) => {
            res.json({
                statuscode: 200,
                message: updateResult
            })
        }).catch((errUpdate) => {
            res.status(422).json({
                statuscode: 422,
                message: errUpdate
            })
        })
    }

})


app.get('/get_all_history_laporan', (req, res) => {
    get_all_history_laporan().then((resultData) => {
        res.json({
            statuscode: 200,
            data: resultData
        })
    }).catch((err) => {
        res.status(422).json({
            statuscode: 422,
            message: 'Error, handling in development'
        })
    })
})

app.get('/delete_laporan', (req, res) => {

    deleteAllLaporanData().then((result) => {
        res.json({
            statuscode: 200,
            message: result

        })
    }).catch((err) => {
        res.status(422).json({
            statuscode: 422,
            message: err
        })
    })
})


app.get('/get_all_puskesmas', (req, res) => {
    getAllPuskesmas().then((result) => {
        res.json({
            statuscode: 200,
            data: result
        })
    }).catch((err) => {
        res.json({
            statuscode: 422,
            message: 'error getting data, contact administrator'
        })
    })
})

app.post('/create_puskesmas', (req, res) => {
    let nama_puskesmas = req.body.nama_puskesmas
    let alamat = req.body.alamat

    let isCompleted = true
    let missingParam = ' is missing from body param, please provide a valid parameter '
    if (!nama_puskesmas && !alamat) {
        missingParam = 'nama_puskesmas, alamat  ' + missingParam
        isCompleted = false
    }
    else if (!nama_puskesmas) {
        missingParam = 'nama_puskesmas ' + missingParam
        isCompleted = false
    }
    else if (!alamat) {
        missingParam = 'alamat ' + missingParam
        isCompleted = false
    }

    if (!isCompleted) {
        res.status(422).json({
            statuscode: 422,
            message: missingParam
        })

        return
    }

    insertPuskesmas(nama_puskesmas, alamat).then((result) => {
        res.json({
            statuscode: 200,
            message: result
        })
    }).catch((err) => {
        res.status(406).json({
            statuscode: 406,
            message: 'error inserting puskesmas, please contact administrator'

        })
    })
})

app.post('/create_user', (req, res) => {

    const username = req.body.username
    const password = req.body.password
    const nama = req.body.nama
    const id_puskesmas = req.body.id_puskesmas
    const alamat = req.body.alamat
    const phone_number = req.body.phone_number

    let missingParamArr = []
    if (!username) missingParamArr.push("username")
    if (!password) missingParamArr.push("password")
    if (!nama) missingParamArr.push("nama")
    if (!id_puskesmas) missingParamArr.push("id_puskesmas")
    if (!alamat) missingParamArr.push("alamat")
    if (!phone_number) missingParamArr.push("phone_number")

    let errMissingParamMessage = 'Param : '
    if (missingParamArr.length > 0) {
        missingParamArr.map((element, index) => {
            if (index == 0) {
                errMissingParamMessage += ` ${element}`
            } else {
                errMissingParamMessage += ` ,${element} `

            }
        })
        errMissingParamMessage += ` is missing from body param , please provide valid param`
        res.status(406).json({
            statuscode: 406,
            message: errMissingParamMessage
        })
        return
    }



    let wrongNumVar = ""
    if (isNaN(id_puskesmas)) wrongNumVar = 'id_puskesmas'


    if (wrongNumVar != "") {
        res.status(406).json({
            statuscode: 406,
            message: `Please send a valid number data type for ${wrongNumVar}`
        })
        return
    }

    createUser(username, password , nama, id_puskesmas , alamat , phone_number).then((result)=>{
        res.json({
            statuscode : 200,
            message : result
        })

    }).catch((err)=>{
        res.status(422).json({
            statuscode : 422 , 
            message : err
        })
    })





})

function parseJwt(token) {
    var base64Url = token.split('.')[1];
    var base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    var jsonPayload = decodeURIComponent(atob(base64).split('').map(function (c) {
        return '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2);
    }).join(''));

    return JSON.parse(jsonPayload);
};
function getUserID(req) {
    var payload = parseJwt(req.headers.authorization)
    console.log(payload.id);
    return payload.id;
}

app.get('/test', authenticateJWT, async (req, res) => {
    getUserID(req)
    generateForm();
    res.send("OK!");
})

app.get('/form', authenticateJWT, async (req, res) => {
    FormInputter.get().then((rest) => {
        var links = [];
        for (var i = 0; i < rest.length; i++) {
            links.push({
                link: `${process.env.LOCAL_HOST}/form/${rest[i].id}`,
                title: rest[i].title
            })
        }
        res.json({
            statuscode: 200,
            data: links
        })
    })
})

app.get('/test',authenticateJWT,async(req,res) => {
    getUserID(req)
    generateForm();
    res.send("OK!");
})

app.get('/form/:id', async(req,res) => {
    var id = req.params.id
    var query = url.parse(req.url,true).query;
    var form = await Form.getForm(id)
    res.send(form.generateForm(false,query))
})
app.get('/form',authenticateJWT, async(req,res) => {
    FormInputter.get().then((rest)=>{
        var links = [];
        for(var i = 0 ; i < rest.length ; i++){
            links.push({
                link:`${process.env.LOCAL_HOST}/form/${rest[i].id}`,
                title:rest[i].title
            })
        }
        // links.push({
        //     link:`${process.env.LOCAL_HOST}:${process.env.LOCAL_PORT}/preview`,
        //     title:"Preview"
        // })
        res.status(200).json({
            data: links
        })
    })
})

app.get('/see-form/:id',authenticateJWT,async (req,res) => {
    id = req.params.id
    var form = await Form.getForm(id)
    res.send(form.generateForm(true))
})

app.get('/getSubmitted',authenticateJWT, async (req,res) => {
    let id = getUserID();
    var html = await Form.getUserForm({id})
    res.send(html.generateForm(true))
})
app.get('/generateForm',(req,res) => {
    generateForm()
    res.send("success!");
})
app.post('/submit-form/:formId',authenticateJWT,(req,res) => {
    var user_id = getUserID(req)
    var form_id = req.params.formId;
    ParticipantInputter.insert({user_id,form_id,answer:req.body})
    res.send(JSON.stringify(req.body));
})
function generateForm(){
    var form = new Form({forms:[],title:"Forms"})
    form.addInputForm({name:"name",isMandatory:true,value:"",placeholder:"name",title:"Name"})
    form.addInputForm({name:"lastname",isMandatory:true,value:"",placeholder:"lastname",title:"Last Name"})
    form.addDropdownForm({title:"Name",name:"name2",isMandatory:false,value:"",options:[{name:"Bambang",value:""},{name:"Marimas",value:""}]})
    form.addInputForm({name:"lastname2",isMandatory:false,value:"",placeholder:"lastname",title:"Last Name"})
    form.addInputForm({name:"name3",isMandatory:true,value:"",placeholder:"name",title:"Name"})
    form.addInputForm({name:"lastname3",isMandatory:true,value:"",placeholder:"lastname",title:"Last Name"})
    form.addInputForm({name:"nam4",isMandatory:true,value:"",placeholder:"name",title:"Name"})
    form.addInputForm({name:"lastnam4",isMandatory:true,value:"",placeholder:"lastname",title:"Last Name"})
    form.addInputForm({name:"nam5",isMandatory:true,value:"",placeholder:"name",title:"Name"})
    form.addInputForm({name:"lastnam5",isMandatory:true,value:"",placeholder:"lastname",title:"Last Name"})
    form.addInputForm({name:"nam6",isMandatory:true,value:"",placeholder:"name",title:"Name"})
    form.addInputForm({name:"lastnam6",isMandatory:true,value:"",placeholder:"lastname",title:"Last Name"})
    FormInputter.insert(form)
}
import url from 'url'
app.get('/preview',(req,res) => {
    var pagination = url.parse(req.url,true).query.pagination;
    var form = new Form({forms:[],title:"Form Preview",id:1,max:5})
    form.addInputForm({name:"desa",isMandatory:true,value:"Hegarmanah",placeholder:"Desa",title:"Desa",information:"*Desa Information"})
    form.addInputForm({name:"rt",isMandatory:true,placeholder:"RT",title:"RT",information:"*RT Information"})
    form.addInputForm({name:"rw",isMandatory:true,placeholder:"RW",title:"RW",information:"*RW Information",isSeparator:true})
    form.addDropdownForm({
        name:"team",
        isMandatory:true,
        placeholder:"Posyandu",
        title:"Posyandu",
        options:[
            {name:"Flamboyan 1",value:"Flamboyan 1"},
            {name:"Flamboyan 2",value:"Flamboyan 2"},
            {name:"Kenanga",value:"Kenanga"},
            {name:"Anggrek 1",value:"Anggrek 1"},
            {name:"Anggrek 2",value:"Anggrek 2"},
            {name:"Anggrek 3",value:"Anggrek 3"},
            {name:"Anyelir ",value:"Anyelir "},
            {name:"Nusa Indah ",value:"Nusa Indah "},
            {name:"Sedap Malam ",value:"Sedap Malam "},
            {name:"Mawar",value:"Mawar"},
            {name:"Dahlia 1",value:"Dahlia 1"},
            {name:"Dahlia 2",value:"Dahlia 2"},
            {name:"Melati 1",value:"Melati 1"},
            {name:"Melati 2",value:"Melati 2"},
            {name:"Sakura 1",value:"Sakura 1"},
            {name:"Sakura 2",value:"Sakura 2"},
            {name:"Mawar 1",value:"Mawar 1"},
            {name:"Mawar 2",value:"Mawar 2"},
            {name:"Mawar 3",value:"Mawar 3"}
        ],
        information:"*Drop down information!"
    })
    var customInput = new AddInput({name:"test.title",isMandatory:true,value:"Kondisi Alat",title:"Title",smallName:"Title",childs:[],information:"*This is Custom Input",isSeparator:true})
    var obj = [];
    obj.push({jumlah:1,nama:"Dacin",kondisi:"Baik"});
    // obj.push({jumlah:1,nama:"Timbangan bayi",kondisi:"Baik"});
    // obj.push({jumlah:1,nama:"Timbangan berdiri",kondisi:"Baik"});
    // obj.push({jumlah:1,nama:"Meteran/ANTROPOMETRI",kondisi:"Baik"});
    for(var i = 0; i < obj.length ; i++){
        var custom = new CustomInput({
            name: "test",
            isMandatory: true,
            childs: [],
            title: "Test Field"
        },12);
        custom.addChild(new Input({name:"test.nama[]",isMandatory:true,value:obj[i].nama,placeholder:"Nama Alat",title:"Nama Alat",size:5}))
        custom.addChild(new Input({name:"test.jml[]",isMandatory:true,value:obj[i].jumlah,placeholder:"Jumlah",title:"Jumlah",size:3}))
        custom.addChild(new Dropdown({name:"test.kondisi[]",isMandatory:true,value:obj[i].kondisi,placeholder:"Kondis",title:"Kondisi",options:[
            {name:'Baik',value:'Baik'},
            {name:'Sedang',value:'Sedang'},
            {name:'Rusak',value:'Rusak'},
            {name:'Hilang',value:'Hilang'},
        ],size:4}))
        customInput.addChild(custom)
    }
    form.addAddInput(customInput)
    
    // form.addInputForm({name:"rt1",isMandatory:true,placeholder:"RT",title:"RT",information:"*RT Information"})
    // form.addInputForm({name:"rw1",isMandatory:true,placeholder:"RW",title:"RW",information:"*RW Information"})
    // form.addInputForm({name:"rt2",isMandatory:true,placeholder:"RT",title:"RT",information:"*RT Information"})
    // form.addInputForm({name:"rw2",isMandatory:true,placeholder:"RW",title:"RW",information:"*RW Information"})
    // FormInputter.insert(form)
    res.send(form.generateForm(false,url.parse(req.url,true).query));
})
app.get('/preview/keluarga',(req,res) => {
    var pagination = url.parse(req.url,true).query.pagination;
    var form = new Form({forms:[],title:"Form Keluarga",id:1,max:5})
    // form.addInputForm({
    //     name:"Nomor urut kepala keluarga",
    //     isMandatory:true,
    //     placeholder:"Nomor urut kepala keluarga",
    //     title:"Nomor urut kepala keluarga",
    //     information:"Beri nomor urut pada setiap kepala keluarga (secara berurutan) pada setiap rumah yang didata"
    // })
    // form.addInputForm({
    //     name:"Nama kepala keluarga",
    //     isMandatory:true,
    //     placeholder:"Nama kepala keluarga",
    //     title:"Nama kepala keluarga",
    //     smallName:"Nama kepala keluarga",
    //     information:"Tulis nama yang menjadi kepala keluarga (orang yang bertanggung jawab terhadap keluarga tersebut)"
    // })
    form.addDropdownForm({
        name:"Ada ibu bersalin",
        isMandatory:true,
        placeholder:"Ada ibu bersalin",
        title:"Ada ibu bersalin",
        smallName:"Ada ibu bersalin",
        information:"Beri tanda Ya bila ada ibu yang bersalin pada saat pendataan dalam kurun waktu 1 tahun sebelumnya",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    form.addDropdownForm({
        name:"Linakes",
        isMandatory:true,
        placeholder:"Linakes",
        title:"Linakes",
        smallName:"Linakes",
        information:"Beri tanda Ya bila ibu pada kolom 4 mendapat pertolongan pertama pada persalinan balita termuda dalam rumah tangga dilakukan oleh tenaga kesehatan yang memilik kompetensi",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    form.addInputForm({
        name:"Bayi < 6 bulan",
        isMandatory:true,
        placeholder:"Bayi < 6 bulan",
        title:"Bayi < 6 bulan",
        smallName:"Bayi < 6 bulan",
        information:"Tuliskan umur bayi pada saat dilakukan pendataan "
    })
    form.addDropdownForm({
        name:"ASI saja",
        isMandatory:true,
        placeholder:"ASI saja",
        title:"ASI saja",
        smallName:"ASI saja",
        information:"Beri tanda Ya bila bayi mendapat ASI saja sejak lahir sampai usia bayi pada saat dilakukan pendataan",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    form.addInputForm({
        name:"Bayi 6 - 12 bulan",
        isMandatory:true,
        placeholder:"Bayi 6 - 12 bulan",
        title:"Bayi 6 - 12 bulan",
        smallName:"Bayi 6 - 12 bulan",
        information:"Tuliskan umur bayi pada saat dilakukan pendataan "
    })
    form.addDropdownForm({
        name:"Bayi 6 - 12 Lulus ASI Eksklusif",
        isMandatory:true,
        placeholder:"Bayi 6 - 12 Lulus ASI Eksklusif",
        title:"Bayi 6 - 12 Lulus ASI Eksklusif",
        smallName:"Bayi 6 - 12 Lulus ASI Eksklusif",
        information:"Beri tanda Ya bila ada bayi termuda mendapat ASI saja sejak lahir sampai usia 6 bulan ",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    form.addDropdownForm({
        name:"Ada bayi dan balita",
        isMandatory:true,
        placeholder:"Ada bayi dan balita",
        title:"Ada bayi dan balita",
        smallName:"Ada bayi dan balita",
        information:"Beri tanda Ya bila ada bayi dan balita pada saat pendataan dengan melihat KMS ",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    form.addDropdownForm({
        name:"Ditimbang",
        isMandatory:true,
        placeholder:"Ditimbang",
        title:"Ditimbang",
        smallName:"Ditimbang",
        information:"Beri tanda Ya bila bayi dan balita ditimbang setiap bulan dan berat badan bayi dan balita di catat dalam Kartu Menuju Sehat(KMS)",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    
    form.addDropdownForm({
        name:"Menggunakan air bersih",
        placeholder:"Menggunakan air bersih",
        title:"Menggunakan air bersih",
        smallName:"Menggunakan air bersih",
        isMandatory:true,
        information:"Beri tanda Ya pada keluarga yang memiliki akses terhadap air bersih dan menggunakannya untuk kebutuhan sehari-hari yang berasal dari air dalam kemasan, ledeng, pompa, sumur terlindung, mata air terlindung dan penampungan air hujan",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Mencuci tangan dengan air bersih dan sabun",
        placeholder:"Mencuci tangan dengan air bersih dan sabun",
        title:"Mencuci tangan dengan air bersih dan sabun",
        smallName:"Mencuci tangan dengan air bersih dan sabun",
        isMandatory:true,
        information:"Beri tanda Ya pada keluarga yang anggotanya berumur 5 tahun keatas selalu mencuci tangan sebelum makan dan sesudah buang air besar, sebelum memegang bayi, setelah menceboki anak, dan sebelum menyiapkan makanan yang menggunakan air bersih yang mengalir dan memakai sabun (perlu dilakukan pengamatan)",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Menggunakan jamban sehat",
        placeholder:"Menggunakan jamban sehat",
        title:"Menggunakan jamban sehat",
        smallName:"Menggunakan jamban sehat",
        isMandatory:true,
        information:"Beri tanda Ya pada keluarga yang memiliki atau menggunakan jamban leher angsa dengan tangki septik atau lubang penampungan kotoran sebagai pembuangan akhir dan terpelihara kebersihannya",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Memberantas jentik di rumah",
        placeholder:"Memberantas jentik di rumah",
        title:"Memberantas jentik di rumah",
        smallName:"Memberantas jentik di rumah",
        isMandatory:true,
        information:"Beri tanda Ya bila anggota keluarga melakukan pemberantasan sarang nyamuk di rumah 1 kali dalam seminggu, agar rumah bebas jentik dengan cara 3M Plus/abatisasi/ikanisasi atau cara lain yang dianjurkan \n Periksa: pada tempat-tempat penampungan air, bak mandi, gentong air, vas bunga, alas vas bunga, wadah pembuangan air dispenser, wadah pembuangan air kulkas, pagar bambu, talang air, balkon dan barang-barang bekas/tempat-tempat yang bisa menampung air",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Makan buah dan sayur setiap hari",
        placeholder:"Makan buah dan sayur setiap hari",
        title:"Makan buah dan sayur setiap hari",
        smallName:"Makan buah dan sayur setiap hari",
        isMandatory:true,
        information:"Beri tanda Ya bila anggota keluarga umur 10 tahun keatas yang mengkonsumsi minimal 3 porsi buah dan 2 porsi sayuran atau sebaliknya setiap hari dalam 1 minggu terakhir",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Melakukan aktivitas fisik setiap hari",
        placeholder:"Melakukan aktivitas fisik setiap hari",
        title:"Melakukan aktivitas fisik setiap hari",
        smallName:"Melakukan aktivitas fisik setiap hari",
        isMandatory:true,
        information:"Beri tanda Ya bila anggota keluarga umur 10 tahun ke atas dalam 1 minggu terakhir melakukan aktivitas fisik (sedang maupun berat) minimal 30 menit setiap hari",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Tidak merokok di dalam rumah",
        placeholder:"Tidak merokok di dalam rumah",
        title:"Tidak merokok di dalam rumah",
        smallName:"Tidak merokok di dalam rumah",
        isMandatory:true,
        information:"Beri tanda Ya bila setiap anggota keluarga umur 10 tahun ke atas tidak merokok di dalam rumah selama atau ketika berada bersama anggota keluarga lainnya selama 1 bulan terakhir",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })

    form.addDropdownForm({
        name:"Sehat",
        isMandatory:true,
        placeholder:"Sehat",
        title:"Sehat",
        smallName:"Sehat",
        information:"Beri tanda Ya bila keluarga tersebut sehat",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"}
        ]
    })
    // FormInputter.insert(form)
    res.send(form.generateForm(false,{pagination}));
})
app.get('/preview/rumah-tangga',(req,res) => {
    var pagination = url.parse(req.url,true).query.pagination;
    var form = new Form({forms:[],title:"Form Rumah Tangga",id:1,max:5,child:49})
    form.addInputForm({
        name:"Nomor urut rumah tangga",
        placeholder:"Nomor urut rumah tangga",
        title:"Nomor urut rumah tangga",
        isMandatory:true,
        information:"Beri nomor urut mulai dari 1 pada setiap rumah tangga yang dilakukan pendataan"
    })
    
    form.addDropdownForm({
        name:"Sehat",
        placeholder:"Sehat",
        title:"Sehat",
        smallName:"Sehat",
        isMandatory:true,
        information:"Beri tanda Ya bila kolom 18 dari semua keluarga dalam rumah tangga tersebut bertanda V, berarti rumah tangga tersebut sehat",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Ada bayi dan balita",
        placeholder:"Ada bayi dan balita",
        title:"Ada bayi dan balita",
        smallName:"Ada bayi dan balita",
        isMandatory:true,
        information:"Beri tanda Ya bila ada bayi dan balita pada saat pendataan dengan melihat KMS",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Ditimbang",
        placeholder:"Ditimbang",
        title:"Ditimbang",
        smallName:"Ditimbang",
        isMandatory:true,
        information:"Beri tanda Ya bila bayi dan balita ditimbang setiap bulan dan berat badan bayi dan balita di cata dalam Kartu Menuju Sehat",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addInputForm({
        name:"Bayi < 6 bulan",
        placeholder:"Bayi < 6 bulan",
        title:"Bayi < 6 bulan",
        smallName:"Bayi < 6 bulan",
        isMandatory:true,
        information:"Tuliskan umur bayi pada saat dilakukan pendataan"
    })
    form.addDropdownForm({
        name:"ASI saja",
        placeholder:"ASI saja",
        title:"ASI saja",
        smallName:"ASI saja",
        isMandatory:true,
        information:"Beri tanda Ya bila bayi mendapat ASI saja sejak lahir sampai usia bayi pada saat dilakukan pendataan",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addInputForm({
        name:"Bayi 6 - 12 Bulan",
        placeholder:"Bayi 6 - 12 Bulan",
        title:"Bayi 6 - 12 Bulan",
        smallName:"Bayi 6 - 12 Bulan",
        isMandatory:true,
        information:"Tuliskan umur bayi pada saat dilakukan pendataan"
    })
    form.addDropdownForm({
        name:"Bayi 6 - 12 bulan lulus ASI Eksklusif",
        placeholder:"Bayi 6 - 12 bulan lulus ASI Eksklusif",
        title:"Bayi 6 - 12 bulan lulus ASI Eksklusif",
        smallName:"Bayi 6 - 12 bulan lulus ASI Eksklusif",
        isMandatory:true,
        information:"Beri tanda Ya bila ada bayi termuda mendapat ASI saja sejak lahir sampai usia 6 bulan, tidak diberi makan/minum kecuali air putih matang untuk minum obat pada saat bayi sakit",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Makan aneka ragam",
        placeholder:"Makan aneka ragam",
        title:"Makan aneka ragam",
        smallName:"Makan aneka ragam",
        isMandatory:true,
        information:"Beri tanda Ya bila keluarga termasuk balita umur 6-59 bulan mengkonsumsi makanan pokok, lauk-pauk, sayur dan buah setiap hari",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Menggunakan garam beryodium",
        placeholder:"Menggunakan garam beryodium",
        title:"Menggunakan garam beryodium",
        smallName:"Menggunakan garam beryodium",
        isMandatory:true,
        information:"Beri tanda Ya bila ada keluarga menggunakan garam beryodium untuk memasak setiap hari. Periksa garam yang digunakan dengan melihat label atau menggunakan Iodina test atau parutan singkong ditambah cuka (apabila hasil test garam berwarna ungu gelap garam mengandung iodium)",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Memberikan suplemen Vit.A/Fe (bumil,bufas,bayi dan balita)",
        placeholder:"Memberikan suplemen Vit.A/Fe (bumil,bufas,bayi dan balita)",
        title:"Memberikan suplemen Vit.A/Fe (bumil,bufas,bayi dan balita)",
        smallName:"Memberikan suplemen Vit.A/Fe (bumil,bufas,bayi dan balita)",
        isMandatory:true,
        information:"Beri tanda Ya bila ada bumil, bufas, bayi dan balita yang mengkonsumsi suplemen (tablet Fe dan atau vitamin A)",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addDropdownForm({
        name:"Kadarzi",
        placeholder:"Kadarzi",
        title:"Kadarzi",
        smallName:"Kadarzi",
        isMandatory:true,
        information:"Beri tanda Ya bila kolom 24, 28, 29, 30 dan 31 bertanda V, berarti keluarga tersebut keluarga sadar gizi (kadarzi)",
        options:[
            {name:"Ya",value:"Ya"},
            {name:"Tidak",value:"Tidak"},
        ]
    })
    form.addInputForm({
        name:"Tuliskan umur kematian WUS 10-49 tahun",
        placeholder:"Tuliskan umur kematian WUS 10-49 tahun",
        title:"Tuliskan umur kematian WUS 10-49 tahun",
        smallName:"Tuliskan umur kematian WUS 10-49 tahun",
        isMandatory:true,
        information:"Tuliskan umur WUS (10-49 tahun) yang meninggal oleh berbagai sebab dalam kurun waktu bulan Juli tahun sebelum pendataan sampai pada saat dilakukan pendataan"
    })
    // FormInputter.insert(form)
    res.send(form.generateForm(false,url.parse(req.url,true).query));
})
app.get('/preview/gizi',(req,res) => {
    var form = new Form({forms:[],title:"Form Gizi",id:2})
    form.addInputForm({name:"desa",isMandatory:true,value:"Hegarmanah",placeholder:"Desa",title:"Desa"})
    form.addInputForm({name:"rt",isMandatory:true,placeholder:"RT",title:"RT"})
    form.addInputForm({name:"rw",isMandatory:true,placeholder:"RW",title:"RW"})
    form.addDropdownForm({
        name:"team",
        isMandatory:true,
        placeholder:"Posyandu",
        title:"Posyandu",
        options:[
            {name:"Flamboyan 1",value:"Flamboyan 1"},
            {name:"Flamboyan 2",value:"Flamboyan 2"},
            {name:"Kenanga",value:"Kenanga"},
            {name:"Anggrek 1",value:"Anggrek 1"},
            {name:"Anggrek 2",value:"Anggrek 2"},
            {name:"Anggrek 3",value:"Anggrek 3"},
            {name:"Anyelir ",value:"Anyelir "},
            {name:"Nusa Indah ",value:"Nusa Indah "},
            {name:"Sedap Malam ",value:"Sedap Malam "},
            {name:"Mawar",value:"Mawar"},
            {name:"Dahlia 1",value:"Dahlia 1"},
            {name:"Dahlia 2",value:"Dahlia 2"},
            {name:"Melati 1",value:"Melati 1"},
            {name:"Melati 2",value:"Melati 2"},
            {name:"Sakura 1",value:"Sakura 1"},
            {name:"Sakura 2",value:"Sakura 2"},
            {name:"Mawar 1",value:"Mawar 1"},
            {name:"Mawar 2",value:"Mawar 2"},
            {name:"Mawar 3",value:"Mawar 3"}
        ]
    })
    var customInput = new AddInput({name:"title",isMandatory:true,value:"Kondisi Alat",title:"Title",childs:[]})
    var obj = [];
    obj.push({keterangan:"KIA" ,jumlah: "93%"})
    obj.push({keterangan:"Gizi (D/S)" ,jumlah: "25%"})
    obj.push({keterangan:"Imunisasi" ,jumlah: "90.1%"})
    obj.push({keterangan:"KB" ,jumlah: "75.2%"})

    for(var i = 0; i < obj.length ; i++){
        var custom = new CustomInput({
            name: "test",
            isMandatory: true,
            childs: [],
            title: "Title"
        },12);
        custom.addChild(new Input({name:"keterangan[]",isMandatory:true,value:obj[i].keterangan,placeholder:"Keterangan",title:"Keterangan"},6))
        custom.addChild(new Input({name:"jml[]",isMandatory:true,value:obj[i].jumlah,placeholder:"Jumlah",title:"Jumlah"},6))
        customInput.addChild(custom)
    }
    form.addAddInput(customInput)
    // FormInputter.insert(form)
    res.send(form.generateForm(false));
})