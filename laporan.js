import { db } from './db.js'
import { insert_Laporan_Deskripsi_Singkat } from './deskripsi_singkat.js'
import { insert_foto_laporan } from './foto_laporan.js'
import { insert_user_laporan } from './user_laporan.js'





/**
 *  Promised based function create laporan
 * @param {string} alamat 
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} nama_terlapor 
 * @param {number} id_status 
 * @returns 
 */
let insertLaporan = (catatan, alamat, latitude, longitude, nama_terlapor, id_status) => {
    let query = `INSERT INTO public.laporan
    (waktu_dilaporkan , catatan, alamat, latitude, longitude,  nama_terlapor, id_status)
    VALUES(NOW() ,'${catatan}' ,'${alamat}', ${latitude}, ${longitude}, '${nama_terlapor}', ${id_status});`


    return new Promise(function (resolve, reject) {
        db.query(query).then((result) => {
            if (result.rowCount > 0) {
                resolve(`Successfully Create Laporan `)
            }
        }).catch((err) => {
            console.log(err)
            reject(err)
        })
    })
}

/**
 * Assign laporan to specific user 
 *   insert new user_laporan 
 *   update status laporan 
 * @param {number} id_laporan 
 * @param {number} id_user 
 * @param {number} id_jenis_laporan 
 */
let assignLaporanToUser = (id_laporan, id_user, id_jenis_laporan) => {
    let insertUserLaporanQuery = `INSERT INTO public.user_laporan
    (tanggal_assignment, id_jenis_pelapor, id_user, id_laporan)
    VALUES(NOW(), 2, ${id_user}, ${id_laporan});`


    let updateLaporanQuery = `UPDATE public.laporan SET id_status=2 WHERE id=${id_laporan}`
    return new Promise(function (resolve, reject) {

        db.query(insertUserLaporanQuery).then((insertResult) => {
            console.log(insertResult);

            db.query(updateLaporanQuery).then((updateLaporanResult) => {
                console.log(updateLaporanResult)
                resolve(`Successfully Assign Laporan Id ${id_laporan} to User ${id_user}`)
            }).catch((updateErr) => {
                console.log("err update");
                console.log(updateErr)
            })
        }).catch((insertErr) => {
            console.log("err insert")
            console.log(insertErr);

            if (insertErr.code == '23503') {
                reject("Id Laporan / Id User not present in the table")
            } else {
                reject(insertErr)
            }
        })
    })
}



/**
 * Function to get all Laporan 
 * @param {number} id_status 
 * 
 * 
 */
let getAllLaporan = (id_status) => {


    let query = `select * from public.laporan `


    if (id_status) query += `where  id_status = ${id_status}`

    console.log(query)
    return new Promise(function (resolve, reject) {
        db.query(query).then((queryResult) => {
            resolve(queryResult.rows)
        }).catch((err) => {
            console.log(err)

            reject(err)
        })

    })

}

/**
 * Function to get all Laporan assigned to user 
 * @param {number} id_status 
 * @param {number} id_user 
 * @returns 
 */
let getAllLaporanAssignedToUser = (id_status, id_user) => {


    let query = `select * from public.laporan  join  public.user_laporan on public.laporan.id  = public.user_laporan.id_laporan `


    if (id_user && id_status) query += `where  id_user = ${id_user} and id_status=${id_status}`
    else if (id_user) query += `where id_user = ${id_user}`
    else if (id_status) query += `where id_status = ${id_status}`

    return new Promise(function (resolve, reject) {
        db.query(query).then((queryResult) => {
            resolve(queryResult.rows)
        }).catch((err) => {
            console.log(err)
            reject(err)
        })

    })

}


/**
 * Function to Submit Laporan From User 
 * Steps : 
 *  1. insert arr of laporan deskripsi singkat 
 *  2. insert arr of foto_laporan 
 *  3. update laporan : 
 *     status  up to reported 
 *     date  = now()
 *     catatan 
 * 
 */
let submitLaporan = (arr_of_foto, arr_of_deskripsi_singkat_id, latitude, longitude, catatan, alamat, nama_terlapor, id_user) => {
    latitude = parseFloat(parseFloat(latitude).toFixed(6))
    longitude = parseFloat(parseFloat(longitude).toFixed(8))

    return new Promise(function (resolve, reject) {
        if (!catatan) catatan = '-'
        if (!arr_of_foto) {
            reject("Please provide valid Array of Photos")
            return
        }
        if (!arr_of_deskripsi_singkat_id) {
            reject("Please provide valid Array of Deskripsi Singkat")
            return
        }

        if (arr_of_foto.length == 0) {
            reject("Empty Array Photo, please provide sufficient array of photos")
            return
        }

        if (arr_of_deskripsi_singkat_id.length == 0) {
            reject("Empty Array Deskripsi_singkat, please provide sufficient array of deskripsi_singkat")
            return
        }



        // 1 Insert Data 
        insertLaporan(catatan, alamat, latitude, longitude, nama_terlapor, 1).then((result) => {
            // Get Current Data
            let getQuery = `select * from public.laporan where alamat like '${alamat}' and nama_terlapor like '${nama_terlapor}'`
            // 2.get data
            db.query(getQuery).then((getResult) => {
                let id_laporan = getResult.rows[0].id

                // 3. insert user laporan
                insert_user_laporan(1 , id_user , id_laporan).then((result_insert_user_laporan) => {
                    // 4. insert laporan deskripsi singkat
                    insert_Laporan_Deskripsi_Singkat(id_laporan, arr_of_deskripsi_singkat_id).then((insert_deskripsi_result) => {
                        // 5. insert foto laporan 
                        insert_foto_laporan(arr_of_foto, id_laporan).then((insert_foto_result) => {
                            resolve("Successfully Submit Laporan ")
                        })
                    }).catch((err_insert_deskripsi) => {
                        reject(err_insert_deskripsi)
                    })

                }).catch((err_result_insert_user_laporan)=>{
                    reject(err_result_insert_user_laporan)
                })




            }).catch((err) => {
                console.log("error get")
                console.log(err)
            })


        }).catch((err) => {
            console.log("error create laporan")
            console.log(err)
        })


    })
}






export { insertLaporan, assignLaporanToUser, getAllLaporan, getAllLaporanAssignedToUser, submitLaporan }