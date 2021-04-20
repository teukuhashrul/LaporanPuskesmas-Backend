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

/**
 * Promised based funciton to return history laporan from db 
 * 
 * @returns 
 */
let get_all_history_laporan = () => {

    let queryGetAllUserLaporan = 'select tanggal_assignment,id_jenis_pelapor, id_user from public."user_laporan" order by tanggal_assignment DESC'

    return new Promise(function (resolve, reject) {
        db.query(queryGetAllUserLaporan).then((result) => {
            console.log(result)
            let resultData = result.rows 


            let queryGetUsers = `select public."user".id AS "id_user", id_puskesmas, nama, username, nama_puskesmas from public."user"
            left outer join puskesmas on public."user".id_puskesmas = puskesmas.id`

            db.query(queryGetUsers).then((userResult)=>{
                let usersArr = userResult.rows

                resultData.forEach((historyItem, idx) =>{
                    
                    usersArr.forEach((userItem)=>{
                        if(historyItem.id_user ==userItem.id_user){
                            resultData[idx].user_data =userItem;
                            return 
                        }
                    })
                })

                resolve(resultData)
            }).catch((err)=>{
                console.log(err)
            })



        }).catch((err) => {
            console.log(err)
        })

    })
}


export { insert_user_laporan , get_all_history_laporan }





