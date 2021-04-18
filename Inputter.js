import {db} from './db.js'
class FormInputter{
    static table = "form"
    static async insert({title,forms}){
        return db.query(`INSERT INTO ${FormInputter.table} (title,forms)
        VALUES ('${title}','${JSON.stringify(forms)}')
        `,(err,resp) => {
            console.log(err)
        })
    }

    static get(id){
        if(id){
            return new Promise(function (resolve, reject) {
                db.query(`SELECT * FROM ${FormInputter.table} WHERE id=${id}`).then((result) => {
                    resolve(result.rows)
                }).catch((err) => {
                    reject(err)
                })
            })
        }else{
            return new Promise(function (resolve, reject) {
                db.query(`SELECT * FROM ${FormInputter.table}`).then((result) => {
                    resolve(result.rows)
                }).catch((err) => {
                    reject(err)
                })
            })
        }
    }
}

class ParticipantInputter{
    static table = "participant"
    static async insert({user_id,form_id,answer}){
        return db.query(`INSERT INTO ${ParticipantInputter.table} (user_id,form_id,answer)
        VALUES ('${user_id}','${form_id}','${JSON.stringify(answer)}')`)
    }

    static async get(id){
        if(id){
            return new Promise(function (resolve, reject) {
                db.query(`SELECT * FROM ${ParticipantInputter.table} WHERE id=${id}`).then((result) => {
                    resolve(result.rows)
                }).catch((err) => {
                    reject(err)
                })
            })
        }else{
            return new Promise(function (resolve, reject) {
                db.query(`SELECT * FROM ${ParticipantInputter.table}`).then((result) => {
                    resolve(result.rows)
                }).catch((err) => {
                    reject(err)
                })
            })
        }
    }
}
export {ParticipantInputter,FormInputter}