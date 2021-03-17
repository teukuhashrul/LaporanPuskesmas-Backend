import { db } from './db.js'


let getAllDeskripsiSingkat = () => {
  let query = `select * from public.deskripsi_singkat `
  return new Promise(function (resolve, reject) {
    db.query(query).then((result) => {
      resolve(result.rows)
    }).catch((err) => {
      reject(err)
    })
  })
}


/**
 * returns string query before executed in the database 
 * @param {*} arr_of_deskripsi_singkat_id 
 * @returns 
 */
let generateInsertArrOfDeskripsiSingkatId = (arr_of_deskripsi_singkat_id, id_laporan) => {
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

  return insertDeskripsiQuery
}



/**
 * 
 * Promised based Function 
 * @param {number} id_laporan 
 * @param {object} arr_of_deskripsi_singkat_id 
 * @returns 
 */
let insert_Laporan_Deskripsi_Singkat = (id_laporan, arr_of_deskripsi_singkat_id) => {
  let query = generateInsertArrOfDeskripsiSingkatId(arr_of_deskripsi_singkat_id, id_laporan)

  return new Promise(function (resolve, reject) {
    db.query(query).then((result) => {
      resolve(`Successfully insert deskrpsi singkat for Id Laporan ${id_laporan} `)
    }).catch((err) => {

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


export { getAllDeskripsiSingkat,insert_Laporan_Deskripsi_Singkat}