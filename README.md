## WhatsGoingOn
A website that will show you what's going on at CU Boulder! Event locations are displayed over a map of CU Boulder, with interactable markers being able to expand to view the event's date, time, description, and more.


## Build Instructions
Clone the repository, create a .env file in the root (WhatsGoingOn/) that includes a google maps API key, session secret and postgres login. The postgres logins can be anything desired, but the google maps API key must be from Google directly. Here is an example with dummy values:

\# database credentials
POSTGRES_USER=user
POSTGRES_HOST =host
POSTGRES_PASSWORD=password
POSTGRES_DB=postgres_db


\# Node vars
SESSION_SECRET="value"
API_KEY="Google Maps API Key"

To approve requests to create events, create a user with username 'admin'. Access /requests endpoint as 'admin' to approve events on the map.
Run 'docker compose up' in the terminal within the (WhatsGoingOn/ProjectSouceCode) folder to create the local host.
The tests will be ran automatically when the container goes up. Access the website on port 3000 with http://localhost:3000

### Contributors
* Justin Costa
* Jacob Lewis
* Anika Nagpal
* Alina Skowronek
* Andrew Webber

### Technology Stack
- Docker and Docker Compose - Containerization
- Postgres - Database
- NodeJS - Functionality and Database Interactions
- Google Maps API - Map and Marker Placement for Events
- Bootstrap - CSS Framework
- Handlebars - Templating for Displaying Data
- Mocha - Testing Framework
- Chai - Assertion for Testing
- JSDoc - Autodocumenter


### Software Prerequisites
Docker and Docker Compose

**Release Notes**

11/30/24
- Calendar added for events
- Only organizers can add events to the map
- Admin can approve or reject events prior to them being added
- Event information is displayed in a user friendly manner

11/13/24
- UI team completed UI for said pages
- UI team will work on dynamically resizing UI for displays
- Map markers created and events added
- Unit tests are being created
- Event register team is working on making a query for whether user is event organizer or student

11/6/24
- UI team going to design features for login, registration, home, and logout pages
- General debugging issues resolved with docker
- Unit tests are going to be started up
- Map team will work on implementing map markers and placing events on home page
