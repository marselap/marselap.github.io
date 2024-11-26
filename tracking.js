const currentPerson = localStorage.getItem('currentPerson');
if (!currentPerson) {
    window.location.href = 'index.html'; // Redirect to home if no person selected
}

document.getElementById('welcome-message').textContent = `Tracking for: ${currentPerson}`;

const trackedTimes = JSON.parse(localStorage.getItem('trackedTimes')) || {};
let sessionDetails = JSON.parse(localStorage.getItem('sessionDetails')) || {};

const currentDay = new Date().toISOString().split('T')[0];
trackedTimes[currentPerson] = trackedTimes[currentPerson] || {};

let startTime = null; // Variable to store the start time
let timerInterval = null; // Interval for updating the live timer

// Update the time table
function updateTable() {
    const tableBody = document.querySelector('#time-table tbody');
    tableBody.innerHTML = ''; // Clear the table

    const personData = trackedTimes[currentPerson];
    if (!personData) return; // No data for the selected person

    const days = Object.keys(personData).slice(-100); // Limit to last 100 days

    days.forEach(date => {
        const totalDuration = personData[date]; // Total duration for the day

        const row = document.createElement('tr');
        row.innerHTML = `
            <td>${date}</td>
            <td>${formatTime(totalDuration)}</td>
        `;

        tableBody.appendChild(row);
    });
}


// Convert milliseconds to HH:MM:SS format
function formatTime(ms) {
    const hours = Math.floor(ms / 3600000);
    const minutes = Math.floor((ms % 3600000) / 60000);
    const seconds = Math.floor((ms % 60000) / 1000);
    return `${hours}:${minutes.toString().padStart(2, '0')}:${seconds.toString().padStart(2, '0')}`;
}


// Handle live tracking indicator and last start note
function updateLiveIndicator(isActive) {
    const indicator = document.getElementById('live-indicator');
    const lastStartNote = document.getElementById('last-start-note');
    if (isActive) {
        indicator.style.display = 'flex';
        lastStartNote.textContent = `Last start time at: ${new Date(startTime).toLocaleTimeString()}`;
    } else {
        indicator.style.display = 'none';
        lastStartNote.textContent = '';
    }
}

// Handle midnight crossing during live tracking
function checkMidnightCrossing() {
    const now = new Date();
    if (startTime && now.getDate() !== new Date(startTime).getDate()) {
        const previousDay = new Date(startTime).toISOString().split('T')[0];
        const midnight = new Date(now);
        midnight.setHours(0, 0, 0, 0);
        const elapsedBeforeMidnight = midnight.getTime() - startTime;

        // Allocate time to previous day
        trackedTimes[currentPerson][previousDay] =
            (trackedTimes[currentPerson][previousDay] || 0) + elapsedBeforeMidnight;

        // Update startTime to midnight and switch to new day
        startTime = midnight.getTime();
        const today = new Date().toISOString().split('T')[0];
        trackedTimes[currentPerson][today] = trackedTimes[currentPerson][today] || 0;

        // Save and update table
        localStorage.setItem('trackedTimes', JSON.stringify(trackedTimes));
        updateTable();
    }
}


// Start live tracking
document.getElementById('start-tracking').addEventListener('click', () => {
    if (startTime) return; // Prevent multiple starts
    startTime = Date.now();
    document.getElementById('stop-tracking').disabled = false;
    document.getElementById('start-tracking').disabled = true;

    updateLiveIndicator(true);

    // Start live timer display and midnight check
    timerInterval = setInterval(() => {
        const elapsedTime = Date.now() - startTime;
        document.getElementById('timer-display').textContent = `Timer: ${formatTime(elapsedTime)}`;
        checkMidnightCrossing();
    }, 1000);
});


// Stop live tracking
document.getElementById('stop-tracking').addEventListener('click', () => {
    if (!startTime) return; // No active tracking
    const endTime = Date.now();
    const today = new Date().toISOString().split('T')[0];

    // Update trackedTimes for total duration
    trackedTimes[currentPerson] = trackedTimes[currentPerson] || {};
    trackedTimes[currentPerson][today] = (trackedTimes[currentPerson][today] || 0) + (endTime - startTime);

    // Update sessionDetails for start and end times
    sessionDetails[currentPerson] = sessionDetails[currentPerson] || {};
    sessionDetails[currentPerson][today] = sessionDetails[currentPerson][today] || [];
    sessionDetails[currentPerson][today].push({ start: startTime, end: endTime });

    // Save both structures to localStorage
    localStorage.setItem('trackedTimes', JSON.stringify(trackedTimes));
    localStorage.setItem('sessionDetails', JSON.stringify(sessionDetails));

    clearInterval(timerInterval);
    startTime = null;
    updateLiveIndicator(false);
    document.getElementById('timer-display').textContent = `Timer: 00:00:00`;
    document.getElementById('start-tracking').disabled = false;
    document.getElementById('stop-tracking').disabled = true;

    updateTable();
});



// Download times as a .txt file
document.getElementById('download-times').addEventListener('click', () => {
    let data = `Tracking for: ${currentPerson}\n\n`;

    const personData = sessionDetails[currentPerson];
    const totalDurations = trackedTimes[currentPerson];

    if (!personData || !totalDurations) {
        data += "No data available.";
    } else {
        // Include cumulative durations at the start
        data += "Daily Cumulative Durations:\n";
        for (const date in totalDurations) {
            const formattedDuration = formatTime(totalDurations[date]);
            data += `  ${date}: ${formattedDuration}\n`;
        }

        data += "\nDetailed Start and End Times:\n";

        // Include detailed start and end times for each day
        for (const date in personData) {
            data += `Date: ${date}\n`;
            const sessions = personData[date];

            sessions.forEach((session, index) => {
                const start = new Date(session.start).toLocaleTimeString();
                const end = new Date(session.end).toLocaleTimeString();
                data += `  Session ${index + 1}: ${start} - ${end}\n`;
            });
            data += '\n';
        }
    }

    // Create the downloadable file
    const blob = new Blob([data], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);

    const a = document.createElement('a');
    a.href = url;
    a.download = `${currentPerson}_time_tracking.txt`;
    a.click();

    URL.revokeObjectURL(url);
});



// Add manual time interval
document.getElementById('add-manual-time').addEventListener('click', () => {
    const startTimeStr = document.getElementById('start-time').value;
    const stopTimeStr = document.getElementById('stop-time').value;

    if (!startTimeStr || !stopTimeStr) {
        alert('Please enter both start and stop times.');
        return;
    }

    const start = new Date(`1970-01-01T${startTimeStr}Z`).getTime();
    const stop = new Date(`1970-01-01T${stopTimeStr}Z`).getTime();

    if (stop <= start) {
        alert('Stop time must be later than start time.');
        return;
    }

    const duration = stop - start;
    trackedTimes[currentPerson][currentDay] = (trackedTimes[currentPerson][currentDay] || 0) + duration;
    localStorage.setItem('trackedTimes', JSON.stringify(trackedTimes));

    updateTable();
});

// Navigate back to home
document.getElementById('home-button').addEventListener('click', () => {
    window.location.href = 'index.html';
});

// Navigate to the delete_entry.html page
document.getElementById('delete-entry-page').addEventListener('click', () => {
    window.location.href = 'delete_entry.html';
});


document.getElementById('upload-file').addEventListener('change', async function (event) {
    const file = event.target.files[0];
    if (!file) {
        alert('No file selected.');
        return;
    }

    const reader = new FileReader();
    reader.onload = function (e) {
        try {
            const content = e.target.result;
            const parsedData = parseUploadedFile(content);

            // Update local storage
            localStorage.setItem('trackedTimes', JSON.stringify(parsedData.trackedTimes));
            localStorage.setItem('sessionDetails', JSON.stringify(parsedData.sessionDetails));

            // Reload page to reflect changes
            alert('Tracking data uploaded successfully!');
            location.reload();
        } catch (error) {
            console.error('Error processing the file:', error);
            alert('Invalid file format.');
        }
    };

    reader.readAsText(file);
});

function parseUploadedFile(content) {
    const lines = content.split('\n').filter(line => line.trim() !== '');
    const trackedTimes = {};
    const sessionDetails = {};

    let currentPerson = '';
    let currentDate = '';

    for (let line of lines) {
        line = line.trim();

        if (line.startsWith('Tracking for:')) {
            // Set current person
            currentPerson = line.replace('Tracking for:', '').trim();
            trackedTimes[currentPerson] = {};
            sessionDetails[currentPerson] = {};
        } else if (line.startsWith('Daily Cumulative Durations:')) {
            // Skip this line, as it is informational
            continue;
        } else if (/^\d{4}-\d{2}-\d{2}:/.test(line)) {
            // Parse daily cumulative duration (informational, no action needed here)
            continue;
        } else if (line.startsWith('Date:')) {
            // New date section
            currentDate = line.replace('Date:', '').trim();
            sessionDetails[currentPerson][currentDate] = [];
        } else if (/^Session/.test(line)) {
            // Parse session start and end times
            const [start, end] = line
                .split(': ')[1]
                .split(' - ')
                .map(time => parseTime(currentDate, time));
            console.log(line);
            
            sessionDetails[currentPerson][currentDate].push({ start, end });

            // Update trackedTimes with cumulative duration
            const duration = end - start;
            if (!trackedTimes[currentPerson][currentDate]) {
                trackedTimes[currentPerson][currentDate] = 0;
            }
            trackedTimes[currentPerson][currentDate] += duration;
        }
    }

    return { trackedTimes, sessionDetails };
}


// Helper function to parse time as local time
function parseTime(date, time) {
    const [timePart, period] = time.trim().split(' '); // Separate "10:05:40" and "PM"
    let [hours, minutes, seconds] = timePart.split(':').map(Number);

    // Convert to 24-hour clock format if necessary
    if (period === 'PM' && hours !== 12) {
        hours += 12; // Convert PM hours to 24-hour time (e.g., 2 PM → 14)
    } else if (period === 'AM' && hours === 12) {
        hours = 0; // Convert midnight (12 AM) to 0
    }

    // Combine the date and time
    const parsedDate = new Date(`${date}T00:00:00`); // Start with midnight
    console.log(date)
    console.log(parsedDate)
    console.log(time, hours, minutes, seconds)
    parsedDate.setHours(hours, minutes, seconds, 0); // Set the actual time
    console.log(parsedDate)

    if (isNaN(parsedDate)) {
        console.error(`Invalid date or time: ${date} ${time}`);
    }

    return parsedDate.getTime(); // Return as timestamp
}


updateTable();
updateLiveIndicator(!!startTime); // Show live indicator if startTime exists



