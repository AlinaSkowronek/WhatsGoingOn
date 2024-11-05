CREATE TABLE IF NOT EXISTS users (
    id SERIAL PRIMARY KEY,
    username VARCHAR(255) NOT NULL,
    password VARCHAR(255) NOT NULL,
    first_name VARCHAR(45),
    last_name VARCHAR(45),
    organizer BOOLEAN DEFAULT FALSE,
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS markers (
    id SERIAL PRIMARY KEY,
    title VARCHAR(45) NOT NULL,
    latitude FLOAT NOT NULL,
    longitude FLOAT NOT NULL
);

CREATE TABLE IF NOT EXISTS event (
    event_id SERIAL PRIMARY KEY,
    event_name VARCHAR(45) NOT NULL,
    event_date TIMESTAMP,
    event_description VARCHAR(500),
    event_start TIMESTAMP,
    event_end TIMESTAMP,
    event_location VARCHAR(100),
    event_organizers VARCHAR(255),
    created_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    event_status VARCHAR(20),
    marker_id INT,
    FOREIGN KEY (marker_id) REFERENCES markers(id)
);

CREATE TABLE IF NOT EXISTS user_group (
    group_id SERIAL PRIMARY KEY,
    user_id INT,
    group_name VARCHAR(45),
    group_description VARCHAR(255),
    FOREIGN KEY (user_id) REFERENCES users(id)
);

CREATE TABLE IF NOT EXISTS event_registration (
    registration_id SERIAL PRIMARY KEY,
    group_id INT,
    user_id INT,
    event_id INT,
    registration_date TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    registration_status VARCHAR(45),
    FOREIGN KEY (group_id) REFERENCES user_group(group_id),
    FOREIGN KEY (user_id) REFERENCES users(id),
    FOREIGN KEY (event_id) REFERENCES event(event_id)
);
