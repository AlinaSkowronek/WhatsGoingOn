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
        eventClick: function(info) {
            alert('Event: ' + info.event.title + '\nLocation: ' + info.event.extendedProps.location);
        }
    });

    calendar.render();
});