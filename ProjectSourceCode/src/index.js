/**
 * Module dependencies.
 */
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
//const pgSession = require('connect-pg-simple')(session);

/**
 * Initialize Handlebars.
 */
const hbs = handlebars.create({
    extname: 'hbs',
    layoutsDir: __dirname + '/views/layouts',
    partialsDir: __dirname + '/views/partials',
});

/**
 * Database configuration.
 * @type {Object}
 */
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};

/**
 * Initialize database connection.
 */
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

/**
 * Set view engine.
 */
app.set('view engine', 'hbs');
app.set('views', path.join(__dirname, 'views'));
app.use(bodyParser.json());

app.use(
    session({
        /*store: new pgSession({
            pgPromise: db,
            tableName: 'session' // Use another table-name if needed
        }),*/
        secret: process.env.SESSION_SECRET,
        saveUninitialized: false,
        resave: false,
        cookie: { maxAge: 30 * 24 * 60 * 60 * 1000 } // 30 days
    })
);

app.use(
    bodyParser.urlencoded({
        extended: true,
    })
);

/**
 * Authentication middleware.
 * @param {Object} req - Request object.
 * @param {Object} res - Response object.
 * @param {Function} next - Next middleware function.
 */
const auth = (req, res, next) => {
    if (!req.session.user) {
        return res.redirect('/login');
    }
    next();
};

/**
 * Routes.
 */

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
    const markersAndEvents = await db.any('SELECT * FROM markers INNER JOIN events ON markers.id = events.marker_id');
    res.render('pages/map', { apiKey: process.env.API_KEY, markersAndEvents: JSON.stringify(markersAndEvents) });
});

app.get('/logout', auth, (req, res) => {
    req.session.destroy();
    res.render('pages/logout');
});

app.get('/home', auth, async (req, res) => {
    try {
        const events = await db.any('SELECT * FROM events');
        res.render('pages/home', { events });
    } catch (error) {
        console.error('Error:', error.message);
        res.render('pages/home', { events: [] });
    }
});

app.post('/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);

        const exists = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);
        if (exists) {
            return res.render('pages/register', { message: 'Username already taken.' });
        }

        let organizer = req.body.organizerCheckbox === "true";

        await db.none('INSERT INTO users(username, password, organizer) VALUES($1, $2, $3)', [req.body.username, hash, organizer]);

        res.redirect('/login');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('pages/register', { message: 'Registration failed. Please try again.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await db.one('SELECT password FROM users WHERE username = $1', req.body.username);
        const match = await bcrypt.compare(req.body.password, user.password);
        if (match) {
            req.session.user = req.body.username;
            if (req.session.user.organizer) {
                console.log('got it');
                res.render('pages/map', { message: 'Logged in as an event organizer' })
            }
            console.log('did not');
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

/*app.post('/add-marker', auth, async (req, res) => {
    const { title, latitude, longitude } = req.body;
    await db.none('INSERT INTO markers(title, latitude, longitude) VALUES($1, $2, $3)', [title, latitude, longitude])
        .then(() => {
            res.status(201).json({
                status: 'success',
                message: 'Marker added successfully!',
            });
        })
        .catch((err) => {
            return console.log(err);
        });
});*/

app.post('/createEvent', auth, async (req, res) => {
    const {
        event_name, event_date, event_description, event_start, event_end, event_location, event_organizers, event_type, latitude, longitude
    } = req.body;

    // Combine date and time values into TIMESTAMP values
    const eventStart = `${event_date} ${event_start}`;
    const eventEnd = `${event_date} ${event_end}`;

    db.tx(async t => {
        // Insert into markers table first to get the marker_id
        const markerId = await t.one(
            'INSERT INTO markers(title, latitude, longitude) VALUES($1, $2, $3) RETURNING id',
            [event_name, latitude, longitude]
        );

        // Insert into events table using the marker_id
        await t.none(
            'INSERT INTO events(event_name, event_date, event_description, event_start, event_end, event_location, event_organizers, event_type, marker_id) VALUES($1, $2, $3, $4, $5, $6, $7, $8, $9)',
            [event_name, event_date, event_description, eventStart, eventEnd, event_location, event_organizers, event_type, markerId.id]
        );
    })
        .then(() => {
            res.status(201).json({
                status: 'success',
                message: 'Event created successfully!',
            });
        })
        .catch((err) => {
            console.error('Database transaction error:', err);
            res.status(500).json({
                status: 'error',
                message: 'Failed to create event.',
            });
        });
});
const server = app.listen(3000, () => {
    console.log('Server is listening on port 3000');
});
module.exports = {
    app,
    server
};
