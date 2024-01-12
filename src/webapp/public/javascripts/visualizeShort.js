"use strict"

// inital loading of data  when DOM loaded
document.addEventListener("DOMContentLoaded", function(){
    const data = localStorage.getItem("leftData");
    if (data) {
        const dataArray = JSON.parse(data);
        dbGraph(getDB(dataArray), getTime(dataArray));
        showAvgMax(getDB(dataArray));
    } else {
        console.log("No data found in localStorage");
        window.location.href = '/'
    }
});

// updating visualization of threshold when value is changed
document.getElementById('threshold').addEventListener('click', function(){
    const data = localStorage.getItem("leftData");
    if (data) {
        const dataArray = JSON.parse(data);
        dbGraph(getDB(dataArray), getTime(dataArray));
    } else {
        console.log("No data found in localStorage");
    }
});


// extract time and date from Sensebox Data in seperate Arrays
function getDB(array){
    let dBOnly = [];
    for(let i = 0; i < array.length; i++){
        dBOnly.push(array[i].value);
    }
    return dBOnly;
}

function getTime(array){
    let timeOnly = [];
    for(let i = 0; i < array.length; i++){
        timeOnly.push(array[i].createdAt);
    }
    return timeOnly;
}



// Build plotly graph with Data and Time, also add threshold line
function dbGraph(dBData, dBTime){

    var threshold = document.getElementById('threshold').value;
    var thresholdLine = Array(45).fill(threshold);

    const layout = {
        yaxis: { title: 'Dezibel in db(A)'}, // range: [0, 80] to force set the axis
        xaxis: { title: 'Zeit'}
    }

    var trace1 = {
        x: dBTime,
        y: dBData,
        name: "dB(A",
        type: 'scatter'
    }

    var trace2 = {
        x: dBTime,
        y: thresholdLine,
        name: 'Threshold',
        type: 'scatter',
        line: {dash: 'dash'}
    } 

    Plotly.purge("chart");
    Plotly.newPlot("chart", [trace1, trace2], layout);
}


// Display the Average and Maxima of the Data
function showAvgMax(data) {
    const maximum = Math.max(...data);
    const average = calculateAverage(data);
    document.getElementById('average').innerHTML = average;
    document.getElementById('maximum').innerText = maximum;
}


function calculateAverage(arr) {
  const sum = arr.reduce((acc, val) => acc + val, 0);
  return Math.round(sum / arr.length * 10) / 10;
}



