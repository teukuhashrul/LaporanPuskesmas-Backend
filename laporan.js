import { db } from './db.js'

/**
 *  Promised based function create laporan
 * @param {string} alamat 
 * @param {number} latitude 
 * @param {number} longitude 
 * @param {string} nama_terlapor 
 * @param {number} id_status 
 * @returns 
 */
let createLaporan = (alamat, latitude, longitude, nama_terlapor, id_status) => {
    let query = `INSERT INTO public.laporan
    ( alamat, latitude, longitude,  nama_terlapor, id_status)
    VALUES( '${alamat}', ${latitude}, ${longitude}, '${nama_terlapor}', ${id_status});`


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
    VALUES(NOW(), 1, ${id_user}, ${id_laporan});`


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
let submitLaporan = (arr_of_foto, arr_of_deskripsi_singkat_id, id_laporan, catatan) => {
    console.log("tes")
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

        // 1. Update Laporan
        let updateLaporanQuery = `update public.laporan  set catatan = '${catatan}' , id_status =3 , waktu_dilaporkan = now()  where id = ${id_laporan};`
        db.query(updateLaporanQuery).then((updateResult) => {
            console.log(updateResult)
            //  2. Insert Array Of Photo
            let insertFotoQuery = `INSERT INTO public.foto_laporan (image, id_laporan) VALUES `

            if (arr_of_foto.length == 1) {
                insertFotoQuery += ` ('${arr_of_foto[0]}' , ${id_laporan})`
            } else {
                arr_of_foto.map((foto_element, index) => {
                    if (index == arr_of_foto.length - 1) {
                        insertFotoQuery += ` ('${foto_element}' , ${id_laporan})`
                    } else {
                        insertFotoQuery += ` ('${foto_element}' , ${id_laporan}), `

                    }
                })
            }

            db.query(insertFotoQuery).then((insertFotoResult) => {
                console.log(insertFotoResult)
                let insertDeskripsiQuery = `INSERT INTO public.laporan_deskripsi_singkat (id_deskripsi_singkat, id_laporan) VALUES  `

                if (arr_of_deskripsi_singkat_id == 1) {
                    insertDeskripsiQuery += ` (${arr_of_deskripsi_singkat_id[0]}, ${id_laporan})`
                } else {
                    arr_of_deskripsi_singkat_id.map((deskripsi_singkat_element, index) => {
                        if (index == arr_of_deskripsi_singkat_id.length - 1) {
                            insertDeskripsiQuery += ` (${deskripsi_singkat_element} , ${id_laporan})`
                        } else {
                            insertDeskripsiQuery += ` (${deskripsi_singkat_element} , ${id_laporan}), `
                        }
                    })
                }

                db.query(insertDeskripsiQuery).then((insertDeskripsiResult) => {
                    console.log(insertDeskripsiResult)

                    resolve(`Laporan ${id_laporan} successfully submitted `)
                }).catch((insertDeskripsiErr) => {
                    console.log(insertDeskripsiErr)
                })
            }).catch((insertFotoErr) => {
                console.log(insertFotoErr)
            })

        }).catch((err) => {
            //handle kalo id laporan nya gaada 
            // handle kalo catatannya kosong 
        })
    })
}


export { createLaporan, assignLaporanToUser, getAllLaporan, getAllLaporanAssignedToUser, submitLaporan }