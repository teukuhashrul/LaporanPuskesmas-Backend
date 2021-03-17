import { db } from "./db.js"

/**
 * returns string query before executed in the database
 * @param {object} arr_of_foto array contains  
 */
let generateInsertArrOfPhotosQuery = (arr_of_foto, id_laporan) => {
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

    return insertFotoQuery;
}



let insert_foto_laporan = (arr_of_foto, id_laporan) => {
    let query = generateInsertArrOfPhotosQuery(arr_of_foto, id_laporan)

    return new Promise(function (resolve, reject) {

        db.query(query).then((result) => {
            resolve("Successfully Insert foto_laporan for id laporan " + id_laporan)
        }).catch((err) => {
            if (err.code == '23503') {
                let errorDetail = err.detail
                let missingColumn = regexSearchErrorConstraintColumnPostgre(errorDetail)
                let errorMessage = `Please provide valid ${missingColumn} for inserting foto_laporan`

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






export { insert_foto_laporan }