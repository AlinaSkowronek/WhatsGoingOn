// ********************** Initialize server **********************************


const { app, server } = require('../src/index');
// ********************** Import Libraries ***********************************


const chai = require('chai'); // Chai HTTP provides an interface for live integration testing of the API's.
const chaiHttp = require('chai-http');
chai.should();
chai.use(chaiHttp);
const pgPromise = require('pg-promise');
const {assert, expect} = chai;
const bcrypt = require('bcryptjs');

const pgp = pgPromise(); //Couldn't find an easier method to do complicated unit tests than actually connecting to the db itself.
const dbConfig = {
    host: 'db',
    port: 5432,
    database: process.env.POSTGRES_DB,
    user: process.env.POSTGRES_USER,
    password: process.env.POSTGRES_PASSWORD,
};
const db = pgp(dbConfig);


// ********************** DEFAULT WELCOME TESTCASE ****************************


describe('Server!', () => {
  // Sample test case given to test / endpoint.
  it('Returns the default welcome message', done => {
    chai
      .request(server)
      .get('/welcome')
      .end((err, res) => {
        expect(res).to.have.status(200);
        expect(res.body.status).to.equals('success');
        assert.strictEqual(res.body.message, 'Welcome!');
        done();
      });
  });
});


// *********************** TODO: WRITE 2 UNIT TESTCASES **************************
describe('GET /login', () => {
    it('should render the login page', async () => {
        const res = await chai.request(server).get('/login');

        expect(res).to.have.status(200);
    });
});

describe('User Registration API - Successful Registration', () => {
    it('Successfully registers a new user and redirects to /login', (done) => {
        chai
            .request(server)
            .post('/register')
            .send({ username: 'newuser', password: 'testpassword123' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res).to.redirectTo(/\/login$/);
                //Best test I could make since our add user requires hashing into the database.
                //There were ways to simulate an entire database and hashing, but I think this is adequate.
                // In the more involved test below I was able to integrate the database, but this test doesn't need it.
                done();
            });
    });
});

describe('User Registration API - Failure Cases', () => { //checks if incorrect registration goes to the correct place in logic.
    let saveConsole;

    before(() => { //This mutes unneccesary output during the test since it is ultimately only checking if registration failed was reached.
        saveConsole = console.error;

        console.error = () => {};
    }); //I believe since the hashing fails without a password it outputs a bunch of junk we don't need to see just for the test.

    after(() => {
        console.error = saveConsole;
    });
    it('Fails to register due to missing password', (done) => {
        chai
            .request(server)
            .post('/register')
            .send({ username: 'testuser' })
            .end((err, res) => {
                expect(res).to.have.status(200);
                expect(res.text).to.include('Registration failed. Please try again.');
                done();
            });
    });
});

describe('GET /home', () => {
    it('should render the home page with events from the database', async () => {
        const res = await chai.request(server).get('/home');

        expect(res).to.have.status(200);
    });
});

describe('GET /register', () => {
    it('should render the register page', async () => {
        const res = await chai.request(server).get('/register');

        expect(res).to.have.status(200);
    });
});


describe('POST /createEvent', () => { // These tests provide a positive test for inserting a marker and a negative test for failure.
    const agent = chai.request.agent(app);

    before(async () => {
        const hash = await bcrypt.hash('testpassword', 10);
        await db.none('INSERT INTO users(username, password) VALUES($1, $2)', ['testuser', hash]);

        await agent
            .post('/login')
            .type('form')
            .send({ username: 'testuser', password: 'testpassword' });
    });

    after(async () => {

        await db.none('DELETE FROM users WHERE username = $1', ['testuser']);
        agent.close();
    });

    it('Successfully creates an event with valid input', async () => {
        const event = {
            event_name: 'Sample Event',
            event_date: '2023-11-15',
            event_description: 'Test description',
            event_start: '09:00:00',
            event_end: '12:00:00',
            event_location: '123 Event St.',
            event_organizers: 'Organizer Name',
            latitude: 40.7128,
            longitude: -74.0060
        };

        const res = await agent.post('/createEvent').send(event);
        expect(res).to.have.status(201);
        expect(res.body.status).to.equal('success');
        expect(res.body.message).to.equal('Event created successfully!');
    });

    it('Fails to create an event with missing required fields', async () => {
        const incompleteEvent = {
            event_name: 'Incomplete Event',
            event_description: 'This is missing required fields.'
        };

        const res = await agent.post('/createEvent').send(incompleteEvent);
        expect(res).to.have.status(500);
        assert.deepEqual(res.body, {
            status: 'error',
            message: 'Failed to create event.'
        });
    });
});






// Plan to to build more intricate tests for testing markers with API. Learned a lot about getting the db to work and the Google API.

// ********************************************************************************
