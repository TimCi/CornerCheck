"use strict"

document.addEventListener("DOMContentLoaded", function () {

    const sensebox = JSON.parse(localStorage.getItem("sensebox"));
    const leftSensor = JSON.parse(localStorage.getItem("leftSensor"));
    const midSensor = JSON.parse(localStorage.getItem("midSensor"));
    const rightSensor = JSON.parse(localStorage.getItem("rightSensor"));
    const date = JSON.parse(localStorage.getItem("selectedDate"));

    var datepickerInput = document.getElementById("dateSelector");
    datepickerInput.value = date;

    const dateBegin = date + " 16:00:00 GMT+0100";
    const earlyDate = new Date(dateBegin);
    const nextDate = new Date(new Date(earlyDate).getTime() + (12 * 60 * 60 * 1000));
    const lateDate = new Date(nextDate);

    updateValues(sensebox, leftSensor, midSensor, rightSensor, earlyDate, lateDate);


    document.getElementById('weekly').addEventListener('click', function () {
        const date = document.getElementById("dateSelector").value;
        const dateBegin = date + " 16:00:00 GMT+0100";
        const earlyDate = new Date(dateBegin);

        const nextDate = new Date(new Date(earlyDate).getTime() + (12 * 60 * 60 * 1000));
        const lateDate = new Date(nextDate);
        updateValues(sensebox, leftSensor, midSensor, rightSensor, earlyDate, lateDate);
    })
});



function getDB(array) {
    let dBOnly = [];
    for (let i = 0; i < array.length; i++) {
        dBOnly.push(array[i].value);
    }
    dBOnly.reverse();
    return dBOnly;
}

function getTime(array) {
    let timeOnly = [];
    for (let i = 0; i < array.length; i++) {
        timeOnly.push(new Date(new Date(array[i].createdAt).getTime()));
    }
    timeOnly.reverse();
    return timeOnly;
}



// Build inital plotly graph with Data and Time, also add threshold line
function dbGraph(dBRightData, dBMidData, dBLeftData, dBTime) {

    const layout = {
        yaxis: { title: 'Dezibel in db(A)' }, // range: [0, 80] to set the axis scale undinamically
        xaxis: {
            title: 'Zeit',
            // Buttons for changing the size of the graph
            autorange: true,
            range: [dBTime[0], dBTime[dBTime.length - 1]],
            // rangeslider beneath the graph.
            rangeslider: { range: [dBTime[0], dBTime[dBTime.length - 1]] },
            type: 'date'
        }
    }

    var leftSensorTrace = {
        x: dBTime,
        y: dBLeftData,
        name: "linker Sensor",
        type: 'scatter',
        mode: "markers",
        marker: {
            size: 1, // Change this value to adjust the dot size
        }
    }

    var midSensorTrace = {
        x: dBTime,
        y: dBMidData,
        name: "mittiger Sensor",
        type: 'scatter',
        mode: "markers",
        marker: {
            size: 1, // Change this value to adjust the dot size
        }
    }

    var rightSensorTrace = {
        x: dBTime,
        y: dBRightData,
        name: "rechter Sensor",
        type: 'scatter',
        mode: "markers",
        marker: {
            size: 1, // Change this value to adjust the dot size
        }
    }

    Plotly.purge("chart");
    Plotly.newPlot("chart", [leftSensorTrace, midSensorTrace, rightSensorTrace], layout);
}


// Display the Average and Maxima of the Data
function showAvgMax(left, mid, right) {
    const left_max = Math.max(...left);
    const left_avg = calculateAverage(left);
    const mid_max = Math.max(...mid);
    const mid_avg = calculateAverage(mid);
    const right_max = Math.max(...right);
    const right_avg = calculateAverage(right);
    const max = Math.max(...left, ...mid, ...right);
    const avg = calculateAverage([...left, ...mid, ...right]);
    let table = document.getElementById("DB-table")
    let tbody = document.createElement('tbody')
    let row = tbody.insertRow()
    let cell1 = row.insertCell()
    cell1.innerHTML = "durchschnittliche Dezibel:"
    let cell2 = row.insertCell()
    cell2.innerHTML = left_avg
    let cell3 = row.insertCell()
    cell3.innerHTML = mid_avg
    let cell4 = row.insertCell()
    cell4.innerHTML = right_avg
    let cell5 = row.insertCell()
    cell5.innerHTML = avg
    let row2 = tbody.insertRow()
    let cell6 = row2.insertCell()
    cell6.innerHTML = "maximale Dezibel:"
    let cell7 = row2.insertCell()
    cell7.innerHTML = left_max
    let cell8 = row2.insertCell()
    cell8.innerHTML = mid_max
    let cell9 = row2.insertCell()
    cell9.innerHTML = right_max
    let cell10 = row2.insertCell()
    cell10.innerHTML = max
    table.tBodies[0].replaceWith(tbody)
}

// calc DB-Average
function calculateAverage(arr) {
    const sum = arr.reduce((acc, val) => acc + (Math.pow(10, (val / 10))), 0);
    return Math.round(Math.log10(sum / arr.length) * 100) / 10;
}


async function updateValues(sensebox, leftSensor, midSensor, rightSensor, earlyDate, lateDate) {
    // last 2.5 hours of night
    const Date02 = new Date(new Date(lateDate).getTime() - (2.5 * 60 * 60 * 1000));
    const leftURL02 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + Date02.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const leftResponse02 = await fetch(leftURL02);
    let leftData02 = await leftResponse02.json();
    const midURL02 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + Date02.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const midResponse02 = await fetch(midURL02);
    let midData02 = await midResponse02.json();
    const rightURL02 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + Date02.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const rightResponse02 = await fetch(rightURL02);
    let rightData02 = await rightResponse02.json();

    // last 5 hours of night
    const Date23 = new Date(new Date(lateDate).getTime() - (5 * 60 * 60 * 1000));
    const leftURL23 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + Date23.toISOString() + "&to-date=" + Date02.toISOString() + "&download=false&format=json";
    const leftResponse23 = await fetch(leftURL23);
    let leftData23 = await leftResponse23.json();
    const midURL23 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + Date23.toISOString() + "&to-date=" + Date02.toISOString() + "&download=false&format=json";
    const midResponse23 = await fetch(midURL23);
    let midData23 = await midResponse23.json();
    const rightURL23 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + Date23.toISOString() + "&to-date=" + Date02.toISOString() + "&download=false&format=json";
    const rightResponse23 = await fetch(rightURL23);
    let rightData23 = await rightResponse23.json();

    // last 7.5 hours of night
    const Date21 = new Date(new Date(lateDate).getTime() - (7.5 * 60 * 60 * 1000));
    const leftURL21 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + Date21.toISOString() + "&to-date=" + Date23.toISOString() + "&download=false&format=json";
    const leftResponse21 = await fetch(leftURL21);
    let leftData21 = await leftResponse21.json();
    const midURL21 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + Date21.toISOString() + "&to-date=" + Date23.toISOString() + "&download=false&format=json";
    const midResponse21 = await fetch(midURL21);
    let midData21 = await midResponse21.json();
    const rightURL21 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + Date21.toISOString() + "&to-date=" + Date23.toISOString() + "&download=false&format=json";
    const rightResponse21 = await fetch(rightURL21);
    let rightData21 = await rightResponse21.json();

    // last 10 hours of night
    const Date18 = new Date(new Date(lateDate).getTime() - (10 * 60 * 60 * 1000));
    const leftURL18 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + Date18.toISOString() + "&to-date=" + Date21.toISOString() + "&download=false&format=json";
    const leftResponse18 = await fetch(leftURL18);
    let leftData18 = await leftResponse18.json();
    const midURL18 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + Date18.toISOString() + "&to-date=" + Date21.toISOString() + "&download=false&format=json";
    const midResponse18 = await fetch(midURL18);
    let midData18 = await midResponse18.json();
    const rightURL18 = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + Date18.toISOString() + "&to-date=" + Date21.toISOString() + "&download=false&format=json";
    const rightResponse18 = await fetch(rightURL18);
    let rightData18 = await rightResponse18.json();

    const leftURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + Date18.toISOString() + "&download=false&format=json";
    const midURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + Date18.toISOString() + "&download=false&format=json";
    const rightURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + Date18.toISOString() + "&download=false&format=json";

    const leftResponse = await fetch(leftURL);
    const midResponse = await fetch(midURL);
    const rightResponse = await fetch(rightURL);

    let leftData16 = await leftResponse.json();
    let midData16 = await midResponse.json();
    let rightData16 = await rightResponse.json();

    if (leftData16 && midData16 && rightData16) {
        let leftData = leftData02.concat(leftData23);
        let midData = midData02.concat(midData23);
        let rightData = rightData02.concat(rightData23);
        leftData = leftData.concat(leftData21);
        midData = midData.concat(midData21);
        rightData = rightData.concat(rightData21);
        leftData = leftData.concat(leftData18);
        midData = midData.concat(midData18);
        rightData = rightData.concat(rightData18);
        leftData = leftData.concat(leftData16);
        midData = midData.concat(midData16);
        rightData = rightData.concat(rightData16);
        dbGraph(getDB(leftData), getDB(midData), getDB(rightData), getTime(leftData));
        showAvgMax(getDB(leftData), getDB(midData), getDB(rightData));
    } else {
        console.log("No data found in localStorage");
        window.location.href = '/'
    }
}