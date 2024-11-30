function handleAccept(requestId) {
    const requestElement = document.getElementById("request-" + requestId);
    if (!requestElement) {
        console.error('Request element not found for id:', requestId);
        return;
    }
    fetch('/acceptEvent', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: requestId })
    })
        .then(response => response.json())
        .then(() => {
            requestElement.remove();
        })
        .catch(err => {
            console.error('Error accepting request:', err);
        });
    console.log('Accepted request:', requestId);
}

function handleDeny(requestId) {
    const requestElement = document.getElementById("request-" + requestId);
    if (!requestElement) {
        console.error('Request element not found for id:', requestId);
        return;
    }
    fetch('/denyEvent', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: requestId })
    })
        .then(response => response.json())
        .then(() => {
            requestElement.remove();
            const deniedTab = document.getElementById("denied").querySelector('ul');
            deniedTab.appendChild(requestElement); 
        })
        .catch(err => {
            console.error('Error denying request:', err);
        });
    console.log('Denied request:', requestId);
}

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabName).style.display = 'block';
}