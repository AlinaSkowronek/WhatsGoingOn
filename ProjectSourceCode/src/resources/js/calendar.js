/**
 * @param {JSON} eventData 
 * @returns {string}
 */

function assignEventColor(eventData) {
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

    const modal = document.getElementById('eventModal');
    const modalTitle = document.getElementById('modalTitle');
    const modalDescription = document.getElementById('modalDescription');
    const modalLocation = document.getElementById('modalLocation');
    const modalStart = document.getElementById('modalStart');
    const modalEnd = document.getElementById('modalEnd');
    const modalClose = document.getElementById('modalClose');

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
            modalTitle.textContent = info.event.title;
            modalDescription.textContent = info.event.extendedProps.description || 'No description available';
            modalLocation.textContent = info.event.extendedProps.location || 'No location specified';
            modalStart.textContent = info.event.start.toLocaleString();
            modalEnd.textContent = info.event.end ? info.event.end.toLocaleString() : 'No end time specified';
            modal.style.display = 'block';
        }
    });

    modalClose.addEventListener('click', function() {
        modal.style.display = 'none';
    });

    calendar.render();
});