import { db } from './db.js'

/**
 * Promised based function to create pencatatan
 * @param {number} user_id 
 * @param {string} form 
 */
let createPencatatan = (form) => {
    let query = `insert into pencatatan (form, tanggal) values ('${form}' ,NOW()  )`
    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            console.log(result)
            if (result.rowCount > 0) {
                resolve(`Successfully Create Laporan Pencatatan  `)
            }
        }).catch((err) => {
            if (err.code === '22P02') {
                reject('Invalid json format, please provide a valid json string data')
            }else{
                reject('Error not handled, please contact db administrator ')
            }
        })
    })

}

/**
 * Promised based function to get pencatatan by user id
 * @param {number} user_id 
 */
let getAllPencatatan = (user_id) => {
    let query = `select * from public."pencatatan"`
    if (user_id) {
        query += ` where user_id = ${user_id}`
    }

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            resolve(result.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}

/**
 * Promised based function to get pencatatan by id 
 * @param {number} id 
 */
let getPencatatanById = (id) => {
    let query = `select * from public."pencatatan" where id=${id}`

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {

            if (result.rows.length > 0) {
                resolve(result.rows[0])
            } else {
                reject(`there is no pencatatan data where id = ${id}`)
            }
        }).catch((err) => {
            reject(err)
        })
    })

}

/**
 * Promised Based Function 
 * Delete pencatatan data from database based on id 
 * @param {number} id 
 */
let deletePencatatanById = (id) => {
    let query = `delete from public."pencatatan" where id=${id}`

    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            resolve(result)
        }).catch((err) => {
            reject(err)
        })
    })

}

export { createPencatatan, getAllPencatatan, getPencatatanById, deletePencatatanById }



