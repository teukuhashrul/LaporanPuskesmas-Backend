import express from 'express'
import jwt from 'jsonwebtoken'
import bodyParser from 'body-parser'
import dotenv from 'dotenv';
import multer from 'multer'
import { getBooks } from './db.js'
import atob from 'atob'
import { FormInputter, ParticipantInputter } from './Inputter.js'
import { customInput, AddInput, RadioButton, Dropdown, Input, BasicInput, Form } from './Form.js'
import { getAllUsers, getUserById, deleteUserById, loginUser } from './user.js';
import { createPencatatan, deletePencatatanById, getAllPencatatan, getPencatatanById } from './pencatatan.js'
import {
    assignLaporanToUser, getAllLaporan, getAllLaporanAssignedToUser, submitLaporan,
    getDetailLaporanById, getAllLaporanWithDeskripsi, updateCatatanLaporan
} from './laporan.js'
import { getAllDeskripsiSingkat } from './deskripsi_singkat.js'
import { get_all_history_laporan } from './user_laporan.js'
import { deleteAllLaporanData } from './delete.js'
import {removeDuplicateFromArrayNumber} from './utils.js'

import cors from 'cors'
dotenv.config()
// get access token secret from env file 
const accessTokenSecret = process.env.ACCESSTOKENSECRET



var app = express();

app.use(cors())
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
app.listen( process.env.PORT , () => {
    console.log("Server running on port  !");
});

// for local testing 
// app.listen(5000, () => {
//     console.log("Server running on port 5000 !");
// });


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

    const user_id = req.body.user_id
    const form = req.body.form


    if (user_id && form) {
        createPencatatan(user_id, form).then((result) => {
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
        let errorMessage = ''
        if (!user_id && !form) {
            errorMessage = 'User id and form data is missing from the body param, please provide a valid body param'
        } else if (!user_id) {
            errorMessage = 'User id is missing from the body param, please provide a valid body param'
        } else {
            errorMessage = 'form data is missing from the body param, please provide a valid body param'
        }

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

    console.log(`idstatus ${id_status}`)
    getAllLaporan(searchQuery, id_status).then((result) => {
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

    console.log(`id_status ${id_status} id_user ${id_user}`)

    getAllLaporanAssignedToUser(id_status, id_user).then((result) => {
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

    console.log(phone_number)

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



    getAllLaporanWithDeskripsi(searchQuery).then((resultLaporan) => {
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
app.get('/form/:id', async (req, res) => {
    var id = req.params.id
    Form.getForm(id).then((form) => {
        res.send(form.generateForm(false))
    })
})

app.get('/see-form/:id', authenticateJWT, async (req, res) => {
    id = req.params.id
    var form = await Form.getForm(id)
    res.send(form.generateForm(true))
})

app.get('/getSubmitted', authenticateJWT, async (req, res) => {
    let id = getUserID();
    var html = await Form.getUserForm({ id })
    res.send(html.generateForm(true))
})
app.get('/generateForm', (req, res) => {
    generateForm()
    res.send("success!");
})
app.post('/submit-form/:formId', authenticateJWT, (req, res) => {
    var user_id = getUserID()
    var form_id = req.params.formId;
    ParticipantInputter.insert({ user_id, form_id, answer: req.body })
    res.send(JSON.stringify(req.body));
})
function generateForm() {
    var form = new Form({ forms: [], title: "Test Form" })
    form.addInputForm({ name: "name1", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastname1", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addDropdownForm({ title: "Name", name: "name2", isMandatory: false, value: "Marimas", options: [{ name: "Bambang", value: "Bambang" }, { name: "Marimas", value: "Marimas" }] })
    form.addInputForm({ name: "lastname2", isMandatory: false, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "name3", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastname3", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "nam4", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastnam4", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "nam5", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastnam5", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "nam6", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastnam6", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    FormInputter.insert(form)
}
app.get('/preview', (req, res) => {
    var form = new Form({ forms: [], title: "Test Form" })
    form.addInputForm({ name: "name1", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastname[]", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addDropdownForm({ title: "Name", name: "name2", isMandatory: false, value: "Marimas", options: [{ name: "Bambang", value: "Bambang" }, { name: "Marimas", value: "Marimas" }] })
    form.addInputForm({ name: "lastname[]", isMandatory: false, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "name3", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastname[]", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "nam4", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastnam4", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "nam5", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastnam5", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    form.addInputForm({ name: "nam6", isMandatory: true, value: "Marimas", placeholder: "name", title: "Name" })
    form.addInputForm({ name: "lastnam6", isMandatory: true, value: "Romano", placeholder: "lastname", title: "Last Name" })
    console.log(req.headers)
    res.send(form.generateForm(false));
})