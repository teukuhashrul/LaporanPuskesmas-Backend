import { db } from './db.js'


/**
 * Promised based function
 * Get all the users from the Database 
 * @param {text} searchQuery
 */
let getAllUsers = (searchQuery) => {
    let query = `select public."user".id , username, nama , public."user".alamat , phone_number, id_puskesmas ,nama_puskesmas   from public."user" 
    left outer join 
    public."puskesmas" on public."user".id_puskesmas  = public."puskesmas".id 
    where enabled = true  `

    if (searchQuery) query += ` and lower(nama)  like lower('%${searchQuery}%') `
    return new Promise(function (resolve, reject) {
        db.query(query).then((res) => {
            resolve(res.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}

/**
 * Promised Based Function
 * Get User Detail
 *
 * @param {user id} id 
 */
let getUserById = (id) => {
    let query = `select id , username, nama , id_puskesmas from public."user" where id=${id}`

    return new Promise(function (resolve, reject) {
        db.query(query).then((res) => {
            resolve(res.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}



/**
 * Promised Based Function 
 * Delete user data from database based on id 
 * @param {id of an user} id 
 */
let deleteUserById = (id) => {
    let query = `delete from public."user" where id=${id}`

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            resolve(result)
        }).catch((err) => {
            reject(err)
        })
    })

}

/**
 * 
 * @param {text} username 
 * @param {text} password 
 * @returns 
 */
let loginUser = (username, password) => {
    let query = `select id,username from public."user" where username='${username}' and password=MD5('${password}')`

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            resolve(result.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}

/**
 * 
 * @param {text} username 
 * @param {text} password 
 * @param {text} nama 
 * @param {number} id_puskesmas 
 * @param {text} alamat 
 * @param {text} phone_number 
 * @returns message of new created user  
 *  
 */
let createUser = (username, password, nama, id_puskesmas, alamat, phone_number) => {
    let query = `insert into public.user (username, password, nama, enabled, alamat, phone_number , id_puskesmas) values ('${username}' , MD5('${password}'),
    '${nama}' , true , '${alamat}' ,  '${phone_number}',${id_puskesmas})`

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            if (result.rowCount > 0) {
                resolve('Successfully create new user ')
            }
        }).catch((err) => {
            if (err.code == '23503') {
                reject(`Id puskesmas is not valid. Please provide a valid id`)
            } else {
                reject(err)
            }
        })
    })
}



export { getAllUsers, getUserById, deleteUserById, loginUser, createUser }

