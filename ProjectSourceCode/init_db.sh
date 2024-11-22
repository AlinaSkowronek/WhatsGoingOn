#!/bin/bash

# DO NOT PUSH THIS FILE TO GITHUB# This file contains sensitive information and should be kept private

# TODO: Set your PostgreSQL URI - Use the External Database URL from the Render dashboard
PG_URI="postgresql://render_user:gUaE695fhEIkQwR1UPh37QHb5N4i2Pxx@dpg-ct0di7bqf0us73f8p26g-a.oregon-postgres.render.com/users_db_d2io"

# Execute each .sql file in the directory
for file in src/init_data/*.sql; do
    echo "Executing $file..."
    psql $PG_URI -f "$file"
done
