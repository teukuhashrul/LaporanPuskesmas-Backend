import {db} from './db.js'


/**
 * Promised based function
 * Get all the puskesmas from the Database 
 * 
 */
 let getAllPuskesmas = () => {
    let query = `select * from public.puskesmas`

    return new Promise(function (resolve, reject) {
        db.query(query).then((res) => {
            resolve(res.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}


let insertPuskesmas= (nama_puskesmas , alamat) =>{
    let query = `insert into puskesmas (nama_puskesmas , alamat) values ('${nama_puskesmas}' , '${alamat}')`

    return new Promise(function (resolve, reject) {
        db.query(query).then((res) => {
            if(res.rowCount > 0){
                resolve("Successfully create new puskesmas ")
            }
        }).catch((err) => {
            reject(err)
        })
    })

}

export {getAllPuskesmas , insertPuskesmas}
