import { db } from './db.js'


let getAllDeskripsiSingkat = () =>{
    let query = `select * from public.deskripsi_singkat `
    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
          resolve(result.rows)
        }).catch((err) => {
          reject(err)
        })
    })
}

export {getAllDeskripsiSingkat}