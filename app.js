const express = require('express')

const cors = require('cors')

const app = express()

const bcrypt = require('bcrypt');
const saltRounds = 10;
const myPlaintextPassword = 's0/\/\P4$$w0rD';
const someOtherPlaintextPassword = 'not_bacon';

const db = require('knex')({
    client: 'pg',
    connection: {
        host: '127.0.0.1',
        port: 5432,
        user: 'postgres',
        password: 'test',
        database: 'sendestimates'
    }
});

app.use(express.json())
app.use(cors())

const currency = require('currency-code-map')


app.get('/', (req, res) => {
    res.send('hello')
})


app.post('/currency', (req, res) => {

    const { sender, receiver, amount } = req.body

    res.json({ sender: currency[sender.toUpperCase()], receiver: currency[receiver.toUpperCase()], amount })

})



app.post('/signin', (req, res) => {
    console.log('helloooo')
    const { password, email } = req.body

    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email).then(data => {

            const isValid = bcrypt.compareSync(req.body.password, data[0].hash)
            // console.log('ggggggg', isValid)
            if (isValid) {
                db.select('*').from('users').where('email', '=', req.body.email).then(user => {

                    res.json(user[0])
                }).catch(e => {

                    res.status(400).json('error')
                })
                // db.select('*').from('users').where('email', '=', req.body.email).then(user => {

                //     res.json(user[0])
            } else {

                res.status(400).json('wrong password')
            }

            // console.log('data', data)
        }).catch(e => {
            res.status(400).json('wrong email')
        })


})


app.post('/register', (req, res) => {


    const { email, name, password, joined } = req.body

    const hashPassword = bcrypt.hashSync(password, saltRounds)



    db.transaction(trx => trx.insert({ email, hash: hashPassword }).into('login').returning('email').then(email => {

        return trx('users').returning('*').insert({
            email: email[0].email,
            name,
            password: hashPassword,
            joined
        }).then(data => {


            return res.status(200).json(data[0])
            // console.log('data', data)
        }).then(trx.commit)
            .catch(trx.rollback)
        // console.log('email', email[0].email)
    })).catch(e => res.json(false))

    // console.log(hashPassword)

    // res.json('register working')
})

app.listen(5000)