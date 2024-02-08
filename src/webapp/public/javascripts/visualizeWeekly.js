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
            size: 2, // Change this value to adjust the dot size
        }
    }

    var midSensorTrace = {
        x: dBTime,
        y: dBMidData,
        name: "mittiger Sensor",
        type: 'scatter',
        mode: "markers",
        marker: {
            size: 2, // Change this value to adjust the dot size
        }
    }

    var rightSensorTrace = {
        x: dBTime,
        y: dBRightData,
        name: "rechter Sensor",
        type: 'scatter',
        mode: "markers",
        marker: {
            size: 2, // Change this value to adjust the dot size
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

    const boxURL = "https://api.opensensemap.org/boxes/" + sensebox + "/sensors";
    const leftURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const midURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const rightURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";

    const leftResponse = await fetch(leftURL);
    const midResponse = await fetch(midURL);
    const rightResponse = await fetch(rightURL);

    let leftData = await leftResponse.json();
    let midData = await midResponse.json();
    let rightData = await rightResponse.json();

    if (leftData && midData && rightData) {
        localStorage.setItem("leftData", JSON.stringify(leftData));
        localStorage.setItem("midData", JSON.stringify(midData));
        localStorage.setItem("rightData", JSON.stringify(rightData));
        dbGraph(getDB(leftData), getDB(midData), getDB(rightData), getTime(leftData));
        showAvgMax(getDB(leftData), getDB(midData), getDB(rightData));
    } else {
        console.log("No data found in localStorage");
        window.location.href = '/'
    }
}