function updateUser(userId) {
    const userRow = document.getElementById('user-' + userId);
    const organizer = userRow.querySelector('.organizer-checkbox').checked;
    const administrator = userRow.querySelector('.administrator-checkbox').checked;

    fetch('/updateUser', {
        method: 'PUT',
        headers: {
            'Content-Type': 'application/json'
        },
        body: JSON.stringify({ id: userId, organizer, administrator })
    })
        .then(response => response.json())
        .then(data => {
            console.log(data.message);
        })
        .catch(err => {
            console.error('Error updating user:', err);
        });
}