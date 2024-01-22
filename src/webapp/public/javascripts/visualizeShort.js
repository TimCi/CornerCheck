"use strict"

// inital loading of data  when DOM loaded
document.addEventListener("DOMContentLoaded", function()
{
    // Create a URLSearchParams object with the query parameters (IDs)
    let urlParams = new URLSearchParams(window.location.search);

    // Get a specific ID by name
    let sensebox = urlParams.get('sensebox');
    let leftSensor = urlParams.get('leftSensor');
    let midSensor = urlParams.get('midSensor');
    let rightSensor = urlParams.get('rightSensor');

    updateLiveValues(sensebox, leftSensor, midSensor, rightSensor);
    setInterval(function() {updateLiveValues(sensebox, leftSensor, midSensor, rightSensor)}, 60000)
});

// updating visualization of threshold when value is changed
document.getElementById('threshold').addEventListener('click', function(){
    const leftData = localStorage.getItem("leftData");
    const midData = localStorage.getItem("midData");
    const rightData = localStorage.getItem("rightData");
    if (leftData && midData && rightData) {
        const leftDataArray = JSON.parse(leftData);
        const midDataArray = JSON.parse(midData);
        const rightDataArray = JSON.parse(rightData);
        dbGraph(getDB(leftDataArray), getDB(midDataArray), getDB(rightDataArray), getTime(leftDataArray));
    } else {
        console.log("No data found in localStorage");
    }
});


// extract time and date from Sensebox Data in seperate Arrays
// reverse arrays, so that the latest measurement is on the end of the array and not at the start (on the rigth of the graph instead of the left)
function getDB(array){
    let dBOnly = [];
    for(let i = 0; i < array.length; i++){
        dBOnly.push(array[i].value);
    }
    dBOnly.reverse();
    return dBOnly;
}

function getTime(array){
    let timeOnly = [];
    for(let i = 0; i < array.length; i++){
        timeOnly.push(array[i].createdAt);
    }
    timeOnly.reverse();
    return timeOnly;
}



// Build inital plotly graph with Data and Time, also add threshold line
function dbGraph(dBRightData, dBMidData, dBLeftData, dBTime){

    var threshold = document.getElementById('threshold').value;
    var thresholdLine = Array(45).fill(threshold);

    const layout = {
        yaxis: { title: 'Dezibel in db(A)'}, // range: [0, 80] to set the axis scale undinamically
        xaxis: {
            title: 'Zeit',
            // Buttons for changing the size of the graph (15, 30, 45min), 45 being default 
            autorange: true,
            range: [dBTime[0], dBTime[44]],
            rangeselector: {buttons: [
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
                { step: "all"}
              ]},
            // rangeslider beneath the graph. I dont know if it looks good, have to decide with the group (My opinion: Not that useful because we only use 45 minute data anyways)
            // rangeslider: {range: [dBTime[0], dBTime[parseInt(document.getElementById('timespan').value)-1]]},
            // type: 'date'
        }
    }

    var leftSensorTrace = {
        x: dBTime,
        y: dBLeftData,
        name: "linker Sensor",
        type: 'scatter'
    }

    var midSensorTrace = {
        x: dBTime,
        y: dBMidData,
        name: "mittiger Sensor",
        type: 'scatter'
    }

    var rightSensorTrace = {
        x: dBTime,
        y: dBRightData,
        name: "rechter Sensor",
        type: 'scatter'
    }

    var thresholdTrace = {
        x: dBTime,
        y: thresholdLine,
        name: 'Grenzwert',
        type: 'scatter',
        line: {dash: 'dash'}
    } 

    Plotly.purge("chart");
    Plotly.newPlot("chart", [leftSensorTrace, midSensorTrace, rightSensorTrace, thresholdTrace], layout);
}


// Display the Average and Maxima of the Data
function showAvgMax(data1, data2, data3) {
    const maximum = Math.max(...data1);
    const average = calculateAverage(data1);
    document.getElementById('average').innerHTML = average;
    document.getElementById('maximum').innerText = maximum;
}

// calc DB-Average
function calculateAverage(arr) {
  const sum = arr.reduce((acc, val) => acc + (Math.pow(10,(val/10))), 0);
  return Math.round(Math.log10(sum / arr.length) * 100) / 10;
}

// update Live-Values every 60 sec
async function updateLiveValues(sensebox, leftSensor, midSensor, rightSensor) 
{
    let nowTimestamp = Date.now();
    let nowDate = new Date(nowTimestamp);

    let fortyFiveMinutesAgoTimestamp = nowTimestamp - (45 * 60 * 1000);
    let fortyFiveMinutesAgoDate = new Date(fortyFiveMinutesAgoTimestamp);

    const baseURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/"
    const leftURL = baseURL + leftSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    const midURL = baseURL + midSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    const rightURL = baseURL + rightSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";

    const leftResponse = await fetch (leftURL);
    const midResponse = await fetch (midURL);
    const rightResponse = await fetch (rightURL);

    let leftData = await leftResponse.json();
    let midData = await midResponse.json();
    let rightData = await rightResponse.json();

    if (leftData && midData && rightData) {
        localStorage.setItem("leftData", JSON.stringify(leftData));
        localStorage.setItem("midData", JSON.stringify(midData));
        localStorage.setItem("rightData", JSON.stringify(rightData));
        dbGraph(getDB(leftData), getDB(midData), getDB(rightData), getTime(leftData));
        showAvgMax(getDB(leftData, midData, rightData));
    } else {
        console.log("No data found in localStorage");
        window.location.href = '/'
    }
}