INSERT INTO
    markers (title, latitude, longitude)
VALUES
    (
        'Marker 1',
        40.00717769097323,
        -105.26803310726763
    ),
    (
        'Marker 2',
        40.006754136846695,
        -105.26330010849537
    );

INSERT INTO
    events (event_name, event_date, event_description, event_start, event_end, event_location, event_organizers, event_status, event_type, marker_id)
VALUES
    (
        'Community Meeting',
        '2023-10-01 10:00:00',
        'A meeting to discuss community issues.',
        '2024-11-01 10:00:00',
        '2024-11-01 12:00:00',
        'Community Center',
        'John Doe, Jane Smith',
        'Scheduled',
        'meetup',
        1
    ),
    (
        'Charity Run',
        '2023-10-05 08:00:00',
        'A charity run to raise funds for local schools.',
        '2024-11-05 08:00:00',
        '2024-11-05 11:00:00',
        'City Park',
        'Alice Johnson, Bob Brown',
        'Scheduled',
        'volunteering',
        2
    );