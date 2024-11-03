CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL
); 
CREATE TABLE IF NOT EXISTS events (
    id SERIAL PRIMARY KEY,
    eventName VARCHAR(255) NOT NULL,
    eventTime VARCHAR(255) NOT NULL,
    eventLattitude FLOAT,
    eventLongitude FLOAT
); 

CREATE TABLE
    IF NOT EXISTS markers (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        latitude FLOAT NOT NULL,
        longitude FLOAT NOT NULL
    );

