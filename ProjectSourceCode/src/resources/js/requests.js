/** 
 * Triggered on button click to accept a request. Called from either click event on Accept or Undo Deny And Accept button.
 * @param {number} requestId - The id of the request to accept
 */

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

/** 
 * Triggered on button click to deny a request. Called from click event on Deny button.
 * @param {number} requestId - The id of the request to deny
 */

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

/**
 * switches between Pending and Denied tabs on request page
 * @param {*} tabName 
 */

function showTab(tabName) {
    document.querySelectorAll('.tab-content').forEach(tab => {
        tab.style.display = 'none';
    });
    document.getElementById(tabName).style.display = 'block';
}