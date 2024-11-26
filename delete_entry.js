// Load trackedTimes and sessionDetails from localStorage
let trackedTimes = JSON.parse(localStorage.getItem('trackedTimes')) || {};
let sessionDetails = JSON.parse(localStorage.getItem('sessionDetails')) || {};
const currentPerson = localStorage.getItem('currentPerson');

// References to DOM elements
const dateSelect = document.getElementById('date');
const sessionSelect = document.getElementById('session');
const form = document.getElementById('delete-form');
const homeButton = document.getElementById('back-home');
const workerButton = document.getElementById('back-worker');

// Populate date dropdown on page load
function populateDates() {
    if (!currentPerson || !sessionDetails[currentPerson]) {
        alert('No data available for the current person.');
        return;
    }

    const dates = Object.keys(sessionDetails[currentPerson]);
    dateSelect.innerHTML = '<option value="">-- Select a Date --</option>';
    dates.forEach(date => {
        const option = document.createElement('option');
        option.value = date;
        option.textContent = date;
        dateSelect.appendChild(option);
    });
}

// Populate session dropdown when a date is selected
dateSelect.addEventListener('change', () => {
    const selectedDate = dateSelect.value;
    sessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';

    if (selectedDate && sessionDetails[currentPerson][selectedDate]) {
        const sessions = sessionDetails[currentPerson][selectedDate];
        sessions.forEach((session, index) => {
            const start = new Date(session.start).toLocaleTimeString();
            const end = new Date(session.end).toLocaleTimeString();
            const option = document.createElement('option');
            option.value = index; // Use index to identify the session
            option.textContent = `${start} - ${end}`;
            sessionSelect.appendChild(option);
        });
    }
});

// Handle deletion
form.addEventListener('submit', function (e) {
    e.preventDefault();

    const selectedDate = dateSelect.value;
    const selectedSessionIndex = sessionSelect.value;

    if (!selectedDate || selectedSessionIndex === "") {
        alert('Please select a valid date and session.');
        return;
    }

    const sessions = sessionDetails[currentPerson][selectedDate];
    const removedSession = sessions.splice(selectedSessionIndex, 1)[0];

    // Remove date entry if no sessions remain
    if (sessions.length === 0) {
        delete sessionDetails[currentPerson][selectedDate];
    }

    // Update trackedTimes
    const duration = removedSession.end - removedSession.start;
    trackedTimes[currentPerson][selectedDate] -= duration;
    if (trackedTimes[currentPerson][selectedDate] <= 0) {
        delete trackedTimes[currentPerson][selectedDate];
    }

    // Save updated data to localStorage
    localStorage.setItem('trackedTimes', JSON.stringify(trackedTimes));
    localStorage.setItem('sessionDetails', JSON.stringify(sessionDetails));

    alert('Entry deleted successfully!');
    populateDates(); // Refresh dates
    sessionSelect.innerHTML = '<option value="">-- Select a Session --</option>';
});

// Navigate back to home
homeButton.addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Navigate back to home
workerButton.addEventListener('click', () => {
    window.location.href = 'tracking.html';
});

// Initialize page
populateDates();
