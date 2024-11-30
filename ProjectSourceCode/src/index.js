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
    host: process.env.POSTGRES_HOST,
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
        return obj.none('SET TIME ZONE \'MST\'')
            .then(() => obj.done());
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
    const markersAndEvents = await db.any('SELECT * FROM markers INNER JOIN events ON markers.id = events.marker_id WHERE event_status = \'Scheduled\' AND event_end >= CURRENT_TIMESTAMP');
    let organizer = req.session.user.organizer;
    // console.log('session:', req.session);
    // console.log('user', req.session.user.username);
    // console.log('organizer', req.session.user.organizer);

    // console.log('in the map api the user is: ');
    // console.log(organizer);
    if (organizer) {
        //console.log('user is an organizer');
        res.render('pages/map', {
            apiKey: process.env.API_KEY,
            markersAndEvents: JSON.stringify(markersAndEvents),
            message: 'Logged in as an event organizer'
        });
    }
    else {
        //console.log('user is not an organizer');
        res.render('pages/map', { apiKey: process.env.API_KEY, markersAndEvents: JSON.stringify(markersAndEvents) });
    }
});

app.get('/logout', auth, (req, res) => {
    req.session.destroy();
    res.render('pages/logout');
});

app.get('/home', auth, async (req, res) => {
    try {
        const events = await db.any('SELECT * FROM events WHERE event_end >= CURRENT_TIMESTAMP');
        res.render('pages/home', { events });
    } catch (error) {
        console.error('Error:', error.message);
        res.render('pages/home', { events: [] });
    }
});

app.get('/calendar', auth, async (req, res) => {
    try {
        res.render('pages/events');
    } catch (error) {
        console.error('Error fetching events for calendar:', error.message);
        res.render('pages/events');
    }
});

app.get('/api/events', auth, async (req, res) => {
    try {
        const events = await db.any('SELECT event_id, event_name, event_date, event_start AT TIME ZONE \'UTC\' AS event_start, event_end AT TIME ZONE \'UTC\' AS event_end, event_location, event_type FROM events WHERE event_status NOT IN (\'Pending\', \'Denied\')');
        const formattedEvents = events.map(event => ({
            id: event.event_id,
            title: event.event_name,
            start: new Date(event.event_start).toISOString(),
            end: new Date(event.event_end).toISOString(),
            location: event.event_location,
            type: event.event_type
        }));
        res.json(formattedEvents);
    } catch (error) {
        console.error('Error fetching events for API:', error.message);
        res.status(500).json({ error: 'Failed to fetch events.' });
    }
});

app.get('/requests', auth, async (req, res) => {
    if (req.session.user.administrator) {
        const requestedEvents = await db.any('SELECT * FROM events INNER JOIN users ON events.user_id_author = users.id WHERE events.event_status = \'Pending\'');
        const deniedEvents = await db.any('SELECT * FROM events INNER JOIN users ON events.user_id_author = users.id WHERE events.event_status = \'Denied\' ');
        res.render('pages/requests', { requestedEvents, deniedEvents });
    } else {
        res.redirect('/home');
    }
});

app.post('/register', async (req, res) => {
    try {
        const hash = await bcrypt.hash(req.body.password, 10);

        const exists = await db.oneOrNone('SELECT * FROM users WHERE username = $1', [req.body.username]);
        if (exists) {

            return res.render('pages/register', { message: 'Username already taken.' });
        }

        const isOrganizer = req.body.organizerCheckbox === "true";

        await db.none('INSERT INTO users(username, password, organizer) VALUES($1, $2, $3)', [req.body.username, hash, isOrganizer]);
        res.redirect('/login');
    } catch (err) {
        console.error('Registration error:', err);
        res.render('pages/register', { message: 'Registration failed. Please try again.' });
    }
});

app.post('/login', async (req, res) => {
    try {
        const user = await db.one('SELECT username, password FROM users WHERE username = $1', [req.body.username]);
        const isUserOrganizer = await db.one('SELECT organizer FROM users WHERE username = $1', [req.body.username]);
        const isUserAdministrator = await db.one('SELECT administrator FROM users WHERE username = $1', [req.body.username]); 
        const match = await bcrypt.compare(req.body.password, user.password);

        if (match) {
            req.session.user = {
                username: user.username,
                organizer: isUserOrganizer.organizer,
                administrator: isUserAdministrator.administrator
            };
            if (req.session.user.username === 'admin') {
                req.session.user.administrator = true;
                console.log("Successful admin login");
                res.redirect('/requests');
                req.session.save();
            } else if (req.session.user.administrator) {
                console.log("Successful admin login");
                res.redirect('/requests');
                req.session.save();
            } else if (req.session.user.organizer) {
                res.redirect('/map');
                req.session.save();
            } else {
                console.log("Successful user login");
                res.redirect('/home');
                req.session.save();
            }
        } else {
            res.render('pages/login', { message: 'Incorrect password.' });
        }
    } catch (err) {
        console.log(err);
        res.render('pages/register', { message: 'User does not exist.' });
    }
});

app.put('/acceptEvent', auth, async (req, res) => {
    if (!req.session.user.administrator) {
        return res.status(403).json({ message: 'Unauthorized access.' });
    }
    try {
        await db.none('UPDATE events SET event_status = \'Scheduled\' WHERE event_id = $1', [req.body.id]);
        res.status(200).json({ message: 'Event accepted.' });
    }
    catch (err) {
        console.error('Error accepting event:', error.message);
        res.status(500).json({ message: 'Failed to accept event.' });
    }

});

app.put('/denyEvent', auth, async (req, res) => {
    if (!req.session.user.administrator) {
        return res.status(403).json({ message: 'Unauthorized access.' });
    }
    try {
        await db.none('UPDATE events SET event_status = \'Denied\' WHERE event_id = $1', [req.body.id]);
        res.status(200).json({ message: 'Event denied.' });
    }
    catch (err) {
        console.error('Error denying event:', error.message);
        res.status(500).json({ message: 'Failed to deny event.' });
    }
});

app.post('/createEvent', auth, async (req, res) => {
    const {
        event_name, event_date, event_description, event_start, event_end, event_location, event_organizers, event_type, latitude, longitude
    } = req.body;

    // Combine date and time values into TIMESTAMP values in MST format
    const eventStart = new Date(`${event_date}T${event_start}:00-07:00`).toISOString();
    const eventEnd = new Date(`${event_date}T${event_end}:00-07:00`).toISOString();

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
