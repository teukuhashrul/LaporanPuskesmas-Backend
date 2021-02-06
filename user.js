import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()

// USE THIS FOR LOCAL CONNECTION TO HOST 
const db = new pg.Pool({
    user: process.env.USER,
    host: process.env.HOST,
    database: process.env.DATABASE,
    password: process.env.PASSWORD,
    port: process.env.PORT,
    ssl: { rejectUnauthorized: false }
})


/**
 * Promised based function
 * Get all the users from the Database 
 * 
 */
let getAllUsers = () => {
    let query = `select id , username from public."user" `


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
    let query = `select id,username from public."user" where id=${id}`

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


let loginUser = (username , password)=>{
    let query = `select id,username from public."user" where username='${username}' and password=MD5('${password}')`

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            resolve(result.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}

export { getAllUsers, getUserById ,deleteUserById, loginUser}

