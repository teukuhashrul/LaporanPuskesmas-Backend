import { db } from './db.js'


/**
 * delete all laporan data correlates with : 
 *   laporan deskripsi singkat 
 *   foto laporan 
 *   user laporan 
 *   and laporan from db  
 *
 * @returns 
 */
let deleteAllLaporanData = () => {
    let query = `delete from laporan_deskripsi_singkat ;


    delete from foto_laporan ; 
    
    delete from user_laporan ; 
    
    delete from laporan; `
    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            resolve("successfully delete all data ")
        }).catch((err) => {
            reject("failed to delete all data, please contact your database administrator")
        })
    })
}



export {deleteAllLaporanData}
