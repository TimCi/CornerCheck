"use strict"

var badge = null;

// inital loading of data  when DOM loaded
document.addEventListener("DOMContentLoaded", function () {
  // Create a URLSearchParams object with the query parameters (IDs)
  let urlParams = new URLSearchParams(window.location.search);

  // Get a specific ID by name
  let sensebox = urlParams.get('sensebox');
  let leftSensor = urlParams.get('leftSensor');
  let midSensor = urlParams.get('midSensor');
  let rightSensor = urlParams.get('rightSensor');

  updateLiveValues(sensebox, leftSensor, midSensor, rightSensor);
  setInterval(function () { updateLiveValues(sensebox, leftSensor, midSensor, rightSensor) }, 60000)
});

// updating visualization of threshold when value is changed
document.getElementById('threshold').addEventListener('input', function (event) {
  let inputValue = parseFloat(event.target.value);
  // Check if the input is a number and within the specified range
  if (!isNaN(inputValue) && inputValue >= 0 && inputValue <= 100) {
    const leftData = localStorage.getItem("leftData");
    const midData = localStorage.getItem("midData");
    const rightData = localStorage.getItem("rightData");
    if (leftData && midData && rightData) {
      const leftDataArray = JSON.parse(leftData);
      const midDataArray = JSON.parse(midData);
      const rightDataArray = JSON.parse(rightData);
      dbGraph(getDB(leftDataArray), getDB(midDataArray), getDB(rightDataArray), getTime(leftDataArray));
      checkValue(getDB(leftDataArray), getDB(midDataArray), getDB(rightDataArray));
    } else {
      console.log("No data found in localStorage");
      closePopup();
    }
  } else {
    console.log('Invalid input. Please enter a number between 0 and 100.');
    closePopup();
  }
});


// extract time and date from Sensebox Data in seperate Arrays
// reverse arrays, so that the latest measurement is on the end of the array and not at the start (on the rigth of the graph instead of the left)
function getDB(array) {
  let dBOnly = [];
  for (let i = 0; i < array.length; i++) {
    dBOnly.push(array[i].value);
  }
  dBOnly.reverse();
  const dbOnlyOver10 = discardUnder10(dBOnly);
  return dbOnlyOver10;
}


function getTime(array) {
  let timeOnly = [];
  for (let i = 0; i < array.length; i++) {
    timeOnly.push(array[i].createdAt);
  }
  timeOnly.reverse();
  return timeOnly;
}
//leaves out all values under 10dB (as they are most likely measurement arror)
function discardUnder10(arr) {
  for (let i = 0; i < arr.length; i++) {
    if (arr[i] <= 10) {
      arr.splice(i, 1);

    }
  }
  return arr;
}



// Build inital plotly graph with Data and Time, also add threshold line
function dbGraph(dBRightData, dBMidData, dBLeftData, dBTime) {

  var threshold = document.getElementById('threshold').value;
  var thresholdLine = Array(dBRightData.length).fill(threshold);

  const layout = {
    yaxis: { title: 'Dezibel in db(A)' }, // range: [0, 80] to set the axis scale undinamically
    xaxis: {
      title: 'Zeit',
      // Buttons for changing the size of the graph (15, 30, 45min), 45 being default 
      autorange: true,
      range: [dBTime[0], dBTime[44]],
      rangeselector: {
        buttons: [
          {
            count: 15,
            label: '15m',
            step: 'minute',
            stepmode: 'backward'
          },
          {
            count: 30,
            label: '30m',
            step: 'minute',
            stepmode: 'backward'
          },
          { step: "all" }
        ]
      }
    }
  }

  var leftSensorTrace = {
    x: dBTime,
    y: dBLeftData,
    name: "linker Sensor",
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 3
    }
  }

  var midSensorTrace = {
    x: dBTime,
    y: dBMidData,
    name: "mittiger Sensor",
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 3
    }
  }

  var rightSensorTrace = {
    x: dBTime,
    y: dBRightData,
    name: "rechter Sensor",
    mode: 'markers',
    type: 'scatter',
    marker: {
      size: 3
    }
  }

  var thresholdTrace = {
    x: dBTime,
    y: thresholdLine,
    name: 'Grenzwert',
    type: 'scatter',
    line: {
      dash: 'dash',
      color: "red",
      size: 3
    },
    z: 10
  }

  Plotly.purge("chart");
  Plotly.newPlot("chart", [leftSensorTrace, midSensorTrace, rightSensorTrace], layout);
  Plotly.addTraces('chart', thresholdTrace);
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

// update Live-Values every 60 sec
async function updateLiveValues(sensebox, leftSensor, midSensor, rightSensor) {
  let nowTimestamp = Date.now();
  let nowDate = new Date(nowTimestamp);

  let fortyFiveMinutesAgoTimestamp = nowTimestamp - (45 * 60 * 1000);
  let fortyFiveMinutesAgoDate = new Date(fortyFiveMinutesAgoTimestamp);

  const baseURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/"
  const leftURL = baseURL + leftSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
  const midURL = baseURL + midSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
  const rightURL = baseURL + rightSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";

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
    checkValue(getDB(leftData), getDB(midData), getDB(rightData));
  } else {
    console.log("No data found in localStorage");
    window.location.href = '/'
  }
}

function checkValue(left, mid, right) {
  const leftAvg = calculateAverage(left.slice(-60));
  const midAvg = calculateAverage(mid.slice(-60));
  const rightAvg = calculateAverage(right.slice(-60));
  var value = Math.max(leftAvg, midAvg, rightAvg);
  var threshold = parseFloat(document.getElementById('threshold').value);
  console.log(value);

  if (value >= threshold) {
    openPopup();
  }
}

function openPopup() {
  document.getElementById('popup').style.display = 'flex';
  document.getElementById('threshold').disabled = true;
}

function closePopup() {
  document.getElementById('popup').style.display = 'none';
  document.getElementById('threshold').disabled = false;
}