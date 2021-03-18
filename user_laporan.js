import { db } from './db.js'


/**
 * 
 * @param {number} id_jenis_pelapor 
 * @param {number} id_user 
 * @param {number} id_laporan 
 * @returns 
 */
let insert_user_laporan = (id_jenis_pelapor, id_user, id_laporan) => {
    let query = `INSERT INTO public.user_laporan
    (tanggal_assignment, id_jenis_pelapor, id_user, id_laporan)
    VALUES(NOW(), ${id_jenis_pelapor}, ${id_user}, ${id_laporan});`

    return new Promise(function (resolve, reject) {

        db.query(query).then((result) => {
            console.log(result)
            resolve("Successfully insert user_laporan")
        }).catch((err) => {
            console.log(err)
            if (err.code == '23503') {
                let errorDetail = err.detail
                let missingColumn = regexSearchErrorConstraintColumnPostgre(errorDetail)
                let errorMessage = `Please provide valid ${missingColumn} for inserting laporan_deskripsi_singkat`

                reject(errorMessage)
            }
        })
    })
}

/**
 * search for string between "(" 
 * @param {string} errorText 
 * @returns 
 */
let regexSearchErrorConstraintColumnPostgre = (errorText) => {
    let regex = /\((.*?)\)/;
    let result = regex.exec(errorText)

    return result[1];
}

export {insert_user_laporan}





