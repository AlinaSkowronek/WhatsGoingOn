function assignEventColor(eventData) { //I have no idea how to export a function
    const event_type = eventData.type;
    let backgroundColor;
    switch (event_type) {
        case 'conference':
            backgroundColor = '#FF0000';
            break;
        case 'meetup':
            backgroundColor = '#00FF00';
            break;
        case 'workshop':
            backgroundColor = '#0000FF';
            break;
        case 'seminar':
            backgroundColor = '#FFFF00';
            break;
        case 'party':
            backgroundColor = '#FF00FF';
            break;
        case 'volunteering':
            backgroundColor = '#00FFFF';
            break;
        default:
            backgroundColor = '#FFFFFF';
    }
    return backgroundColor;
}

document.addEventListener('DOMContentLoaded', function () {
    const calendarEl = document.getElementById('calendar');

    const calendar = new FullCalendar.Calendar(calendarEl, {
        initialView: 'dayGridMonth',
        headerToolbar: {
            left: 'prev,next today',
            center: 'title',
            right: 'dayGridMonth,timeGridWeek,timeGridDay'
        },
        events: '/api/events',
        eventDidMount: function(info) {
            console.log('Event:', info.event);
            const backgroundColor = assignEventColor(info.event.extendedProps);
            info.el.style.backgroundColor = backgroundColor;
        },
        eventClick: function(info) {
            alert('Event: ' + info.event.title + '\nLocation: ' + info.event.extendedProps.location);
        }
    });

    calendar.render();
});