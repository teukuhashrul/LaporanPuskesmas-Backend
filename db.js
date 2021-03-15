import pg from 'pg'
import dotenv from 'dotenv'
dotenv.config()


// USE THIS FOR LOCAL CONNECTION TO HOST / testing local
// const db = new pg.Pool({
//     user: process.env.USER,
//     host: process.env.HOST,
//     database: process.env.DATABASE,
//     password: process.env.PASSWORD,
//     port: process.env.PORT,
//     ssl: { rejectUnauthorized: false }
// })

// USE THIS FOR REMOTE CONNECTION IN HOSTING / deploy phase in heroku
const connectionString = process.env.DATABASE_URI
const db = new pg.Pool({ connectionString , ssl: { rejectUnauthorized: false }})

/**
 * get all books
 */
let getBooks = () => {
    let query = `select * from public.books `


    return new Promise(function (resolve, reject) {
        db.query(query).then((res) => {

            resolve(res.rows)
        }).catch((err) => {
            reject(err)
        })
    })
}


export { getBooks,db }


// getBooks().then((result) => {
//     console.log(result)
// })
