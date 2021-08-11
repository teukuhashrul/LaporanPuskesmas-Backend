import { db } from './db.js'
import { getAllDeskripsiSingkat, insert_Laporan_Deskripsi_Singkat } from './deskripsi_singkat.js'
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
let insertLaporan = (catatan, alamat, latitude, longitude, nama_terlapor, id_status, phone_number) => {
    let query = `INSERT INTO public.laporan
    (waktu_dilaporkan , catatan, alamat, latitude, longitude,  nama_terlapor, id_status , phone_number)
    VALUES(NOW() ,'${catatan}' ,'${alamat}', ${latitude}, ${longitude}, '${nama_terlapor}', ${id_status}, '${phone_number}');`


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
 * check first : no user assigned or just update 
 * if no user
 *  
 *   insert new user_laporan 
 *   update status laporan 
 * 
 * if just update 
 *   update set new user  
 * 
 * @param {number} id_laporan 
 * @param {number} id_user 
 * @param {number} id_jenis_laporan 
 */
let assignLaporanToUser = (id_laporan, id_user, id_jenis_laporan) => {

    return new Promise(function (resolve, reject) {

        let checkUserLaporan = `select * from public.user_laporan where id_laporan  = ${id_laporan} and id_jenis_pelapor  = 2`

        // check first 
        db.query(checkUserLaporan).then((checkResult) => {
            // if no user assigned , then assigned new user
            if (checkResult.rows.length < 1) {
                let insertUserLaporanQuery = `INSERT INTO public.user_laporan
                (tanggal_assignment, id_jenis_pelapor, id_user, id_laporan)
                VALUES(NOW(), 2, ${id_user}, ${id_laporan});`


                let updateLaporanQuery = `UPDATE public.laporan SET id_status=2 WHERE id=${id_laporan}`

                db.query(insertUserLaporanQuery).then((insertResult) => {
                    console.log(insertResult);

                    db.query(updateLaporanQuery).then((updateLaporanResult) => {
                        console.log(updateLaporanResult)
                        resolve(`Successfully Assign Laporan Id ${id_laporan} to New User ${id_user}`)
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



            } else {
                let updateUserAssigned = `update public.user_laporan set id_user = ${id_user} where id_jenis_pelapor =2 and id_laporan = ${id_laporan}`

                db.query(updateUserAssigned).then((updateUserResult) => {
                    if (updateUserResult.rowCount > 0) {
                        resolve("Successfully update assigned user for laporan id " + id_laporan)
                    } else {
                        reject("please provide a valid id laporan ")

                    }
                }).catch((updateErr) => {
                    if (updateErr.code == '23503') {
                        reject("Id Laporan / Id User not present in the table")
                    } else {
                        reject(updateErr)
                    }
                })

            }





        }).catch((checkErr) => {
            if (checkErr.code == '23503') {
                reject("Id Laporan / Id User not present in the table")
            } else {
                reject(checkErr)
            }
        })



    })
}



/**
 * Function to get all Laporan 
 * @param {string} searchquery  
 * @param {number} id_status 
 * @param {number} filterAssign  
 * 
 */
let getAllLaporan = (searchQuery, id_status, filterAssign) => {

    
    let query = `select * from public.laporan `


    if (searchQuery) query += `where  lower(alamat) like lower('%${searchQuery}%') or lower(catatan) like lower('%${searchQuery}%') or lower(nama_terlapor) like lower('%${searchQuery}%') `
    else if (id_status) query += `where  id_status = ${id_status}`


    query = `select * from (
            ${query}
        ) as lap join (
            select id_laporan , count(id) as counter
            from user_laporan
            group by id_laporan
        ) as count_assign on lap.id = count_assign.id_laporan `

    if(filterAssign && filterAssign != 0){
        query += ` where counter=${filterAssign}`
    }



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
let getAllLaporanAssignedToUser = (id_status, id_user , searchQuery) => {


    let query = `select public.laporan.id , waktu_dilaporkan, alamat, latitude, longitude , catatan, nama_terlapor, public.laporan.id_status,phone_number
     from public.laporan  join  public.user_laporan on public.laporan.id  = public.user_laporan.id_laporan `


    if (id_user && id_status) query += `where  id_user = ${id_user} and id_status=${id_status}`
    else if (id_user) {
        query += `where id_user = ${id_user}`

        if (searchQuery) query += `and lower(alamat) like lower('%${searchQuery}%') or lower(catatan) like lower('%${searchQuery}%') or lower(nama_terlapor) like lower('%${searchQuery}%') `

    }
    else if (id_status) query += `where id_status = ${id_status}`

    return new Promise(function (resolve, reject) {
        db.query(query).then((queryResult) => {

            // remove duplicate from multiple user laporan 
            let dict = {}
            queryResult.rows.map((item) => {
                dict[item.id] = item
            })

            let arrRes = []
            Object.keys(dict).map((key) => {
                arrRes.push(dict[key])
            })



            // get all deskripsi singkat
            let queryGetLaporanDeskripsiSingkat = `select id_laporan,id_deskripsi_singkat , deskripsi from laporan_deskripsi_singkat left outer join deskripsi_singkat on 
            laporan_deskripsi_singkat.id_deskripsi_singkat = deskripsi_singkat.id `


            db.query(queryGetLaporanDeskripsiSingkat).then((resultGetLaporanDeskripsiSingkat) => {
                let arr_laporan_deskripsi_singkat = resultGetLaporanDeskripsiSingkat.rows;

                arrRes.forEach((item, idx) => {
                    let currArrDeskripsiSingkat = []

                    arr_laporan_deskripsi_singkat.forEach((desItem) => {
                        if (item.id == desItem.id_laporan) {
                            currArrDeskripsiSingkat.push(
                                { 'id_deskripsi_singkat': desItem.id_deskripsi_singkat, 'deskripsi': desItem.deskripsi }
                            )
                        }
                    })

                    arrRes[idx].arr_of_deskripsi_singkat = currArrDeskripsiSingkat

                })

                resolve(arrRes)
            }).catch((errorGetDeskripsiSingkat) => {
                console.log(errorGetDeskripsiSingkat)
            })

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
let submitLaporan = (arr_of_foto, arr_of_deskripsi_singkat_id, latitude, longitude, catatan, alamat, nama_terlapor, id_user, phone_number) => {
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
        insertLaporan(catatan, alamat, latitude, longitude, nama_terlapor, 1, phone_number).then((result) => {
            // Get Current Data
            let getQuery = `select * from public.laporan where alamat like '${alamat}' and nama_terlapor like '${nama_terlapor}' order by id DESC`
            // 2.get data
            db.query(getQuery).then((getResult) => {
                let id_laporan = getResult.rows[0].id

                // 3. insert user laporan
                insert_user_laporan(1, id_user, id_laporan).then((result_insert_user_laporan) => {
                    // 4. insert laporan deskripsi singkat
                    insert_Laporan_Deskripsi_Singkat(id_laporan, arr_of_deskripsi_singkat_id).then((insert_deskripsi_result) => {
                        // 5. insert foto laporan 
                        insert_foto_laporan(arr_of_foto, id_laporan).then((insert_foto_result) => {
                            resolve("Successfully Submit Laporan ")
                        })
                    }).catch((err_insert_deskripsi) => {
                        reject(err_insert_deskripsi)
                    })

                }).catch((err_result_insert_user_laporan) => {
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


/**
 * GET Laporan By Id 
 * 
 */
let getDetailLaporanById = (id_laporan) => {
    let getLaporanQuery = `select * from public."laporan" where id=${id_laporan}`;
    return new Promise(function (resolve, reject) {
        db.query(getLaporanQuery).then((laporanResult) => {
            if (laporanResult.rows.length > 0) {
                let thisLaporan = laporanResult.rows[0];

                let getFotoLaporanQuery = `select id, encode(foto_laporan.image , 'escape') as image from public."foto_laporan" where id_laporan=${id_laporan}`
                db.query(getFotoLaporanQuery).then((getFotoResult) => {
                    let arr_of_foto = getFotoResult.rows;

                    let getDeskripsiSingkatQuery = `select id_deskripsi_singkat , deskripsi from public.laporan_deskripsi_singkat
                    join public.deskripsi_singkat  on public.laporan_deskripsi_singkat.id_deskripsi_singkat  = deskripsi_singkat.id 
                    where id_laporan = ${id_laporan}`

                    db.query(getDeskripsiSingkatQuery).then((deskripsiSingkatResult) => {
                        let arr_of_deskripsi_singkat = deskripsiSingkatResult.rows;


                        thisLaporan.arr_of_foto = arr_of_foto
                        thisLaporan.arr_of_deskripsi_singkat = arr_of_deskripsi_singkat

                        // get user data who creates this laporan  
                        let queryGetUser = `select id_jenis_pelapor, tanggal_assignment  , id_user , username , nama FROM public."user_laporan" 
                        left outer join public."user" on public."user_laporan".id_user = public."user".id where id_laporan = ${id_laporan} order by id_jenis_pelapor ASC`

                        db.query(queryGetUser).then((userResult) => {
                            let arr_of_jenis_pelapor = userResult.rows
                            thisLaporan.arr_of_jenis_pelapor = arr_of_jenis_pelapor

                            console.log(thisLaporan)
                            resolve(thisLaporan)
                        }).catch((errorGetUser) => {
                            console.log(errorGetUser)
                        })
                    }).catch((errorGetDeskripsiSingkat) => {
                        console.log(errorGetDeskripsiSingkat)
                    })

                }).catch((errorGetFoto) => {
                    console.log(errorGetFoto)
                })
            } else {
                reject("no laporan data for id " + id_laporan)
            }


        }).catch((errLaporanResult) => {
            console.log(errLaporanResult)
        })

    })

}


/**
 * Get all laporan for web api version 
 * returns all laporan with deskripsi singkat 
 */
let getAllLaporanWithDeskripsi = (searchQuery,filterAssign) => {
    return new Promise(function (resolve, reject) {

        getAllLaporan(searchQuery,null,filterAssign).then((resultAllLaporan) => {

            let queryGetLaporanDeskripsiSingkat = `select id_laporan,id_deskripsi_singkat , deskripsi from laporan_deskripsi_singkat left outer join deskripsi_singkat on 
            laporan_deskripsi_singkat.id_deskripsi_singkat = deskripsi_singkat.id `


            db.query(queryGetLaporanDeskripsiSingkat).then((resultGetLaporanDeskripsiSingkat) => {
                let arr_laporan_deskripsi_singkat = resultGetLaporanDeskripsiSingkat.rows;

                resultAllLaporan.forEach((item, idx) => {
                    let currArrDeskripsiSingkat = []

                    arr_laporan_deskripsi_singkat.forEach((desItem) => {
                        if (item.id == desItem.id_laporan) {
                            currArrDeskripsiSingkat.push(
                                { 'id_deskripsi_singkat': desItem.id_deskripsi_singkat, 'deskripsi': desItem.deskripsi }
                            )
                        }
                    })

                    resultAllLaporan[idx].arr_of_deskripsi_singkat = currArrDeskripsiSingkat

                })

                resolve(resultAllLaporan)
            }).catch((errorGetDeskripsiSingkat) => {
                console.log(errorGetDeskripsiSingkat)
            })
        }).catch((errLaporan) => {
            console.log(errLaporan)
        })
    })
}

/**
 * update laporan catatan data
 * @param {number} id_laporan 
 * @param {string} newCatatan 
 */
let updateCatatanLaporan = (id_laporan, newCatatan) => {
    let queryUpdateCatatan = `update public.laporan set catatan = '${newCatatan}' where id  = ${id_laporan}`

    return new Promise(function (resolve, reject) {

        db.query(queryUpdateCatatan).then((result) => {
            if (result.rowCount > 0) {
                resolve("Successfully update laporan for laporan id " + id_laporan)
            } else {
                reject("please provide a valid id laporan ")

            }
        }).catch((error) => {
            console.log(error)

            if (error.code == '42601') {
                reject("please provide a valid id laporan ")
            }
        })
    })
}


export {
    insertLaporan, assignLaporanToUser, getAllLaporan, getAllLaporanAssignedToUser, submitLaporan, getDetailLaporanById, getAllLaporanWithDeskripsi
    , updateCatatanLaporan
}