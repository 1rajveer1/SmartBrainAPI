const express = require('express')
const app = express();
const bcrypt = require('bcrypt-nodejs');
const cors = require('cors');
const knex = require('knex');

const db = knex({
    client: 'pg',
    connection: {
    //   host : '127.0.0.1',
    //   port : 5432,
    //   user : 'postgres',
    //   password : 'Raj2251s.',
    //   database : 'smart-brain'
    connectionString: process.env.DATABSE_URL,
    host: process.env.DATABASE_HOST,
    port: 5432,
    user: process.env.DATABASE_USER,
    password: process.env.DATABASE_PW,
    database: process.env.DATABASE_DB
    }
  });

app.use(express.json());

app.use(cors());

app.get('/', (req, res)=>{
    res.send('sucesss');
})

app.post('/signin', (req,res)=>{
    const {email, password} = req.body;

    if(!email  || !password){
        return res.status(400).json("incorrect form sumbison");
    }
    db.select('email', 'hash').from('login')
        .where('email', '=', req.body.email )
        .then(data =>{
           const isValid = bcrypt.compareSync(req.body.password, data[0].hash);
           if (isValid){
            return db.select('*').from('users')
                .where('email', '=', req.body.email)
                .then(user =>{
                    res.json(user[0])
                }).catch(err =>
                    res.json(400).json('unable to get user'))
           }else{
            res.status(400).json('wrong login info')
           }
        })
        .catch(err => res.status(400).json('wrong login info'))
})

app.post('/register',  (req,res)=>{
    const {email, name, password} = req.body;

    if(!email || !name || !password){
        return res.status(400).json("incorrect form sumbison");
    }
    const hash = bcrypt.hashSync(password);
    db.transaction(trx =>{
        trx.insert({
            hash: hash,
            email: email,
            
        })
        .into('login')
        .returning('email')
        .then(loginemail =>{
            return trx('users')
            .returning('*')
            .insert({
                email: loginemail[0].email,
                name: name,
                joined: new Date()
            }).then(user =>{
                res.json(user[0]);
            })
        })
        .then(trx.commit)
        .catch(trx.rollback)
    }) 
.catch(err => res.status(400).json('unable to register'))
})

app.get('/profile/:id',(req,res)=>{
    const{id} = req.params;
    db.select('*').from('users').where({
        id: id
    })
    .then(user =>{
        if(user.length){
            res.json(user[0])
        }else{
            res.status(400).json('Not found')
        }
    }).catch(err =>{
        res.status(400).json('error getting user')
    })
})

app.put('/image', (req,res)=>{
    const{id} = req.body;

    db('users').where('id', '=', id)
    .increment('entries', 1)
    .returning('entries')
    .then(entries => {
        res.json(entries[0].entries);
    }).catch(err =>{res.status(400).json('unable to get entries')})
})
app.listen(process.env.PORT || 3000, ()=>{
    console.log(`app is running on port ${process.env.PORT}`);
})