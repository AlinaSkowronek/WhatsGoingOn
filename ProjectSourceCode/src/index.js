const express = require('express');
const app = express();
const handlebars = require('express-handlebars');
const Handlebars = require('handlebars');
const path = require('path');
const pgp = require('pg-promise')();
const bodyParser = require('body-parser');
const session = require('express-session');
const bcrypt = require('bcryptjs');
const axios = require('axios');

const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};

const db = pgp(dbConfig);

db.connect()
    .then(obj => {
        console.log('Database connection successful');
        obj.done();
    })
    .catch(error => {
        console.log('ERROR:', error.message || error);
    });

app.use('/resources', express.static(path.join(__dirname, 'resources')));

app.engine('hbs', hbs.engine);
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());

app.use(
    session({
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};


app.get('/', (req, res) => {
    res.redirect('/login');
});

app.get('/login', (req, res) => {
    res.render('pages/login');
});

app.get('/register', (req, res) => {
    res.render('pages/register');
});

app.get('/map', auth, async (req, res) => {
    const markers = await db.any('SELECT * FROM markers');
    res.render('pages/map', { apiKey: process.env.API_KEY, markers: JSON.stringify(markers) });
});

app.get('/logout', auth, (req, res) => {
    req.session.destroy();
    res.render('pages/logout');
});

app.get('/home', auth, async (req, res) => {
    res.render('pages/home');
});

app.post('/register', async (req, res) => {
    const hash = await bcrypt.hash(req.body.password, 10);

    const exists = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);
    if (exists) {
        res.render('pages/register', { message: 'Username already taken.' });
        return;
    }

    await db.none('INSERT INTO users(username, password) VALUES($1, $2)', [req.body.username, hash])
        .then(() => {
            res.redirect('/login');
            res.status(201).json({
                status: 'success',
                data: data,
                message: 'Registered successfully!',
            });
        })
        .catch((err) => {
            res.render('pages/login');
            return console.log(err);
        });
});

app.post('/login', async (req, res) => {
    try {
        const user = await db.one('SELECT password FROM users WHERE username = $1', req.body.username);
        const match = await bcrypt.compare(req.body.password, user.password);
        if (match) {
            req.session.user = req.body.username;
            res.redirect('/home');
            req.session.save();
        } else {
            res.render('pages/login', { message: 'Incorrect password.' });
        }
    } catch (err) {
        console.log(err);
        res.render('pages/register', { message: 'User does not exist.' });
    }
});

app.listen(3000);
console.log('Server is listening on port 3000');