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



// Build plotly graph with Data and Time, also add threshold line
function dbGraph(dBData, dBTime){

    var threshold = document.getElementById('threshold').value;
    var thresholdLine = Array(parseInt(document.getElementById('timespan').value)).fill(threshold);

    const layout = {
        yaxis: { title: 'Dezibel in db(A)'}, // range: [0, 80] to set the axis scale undinamically
        xaxis: {
            title: 'Zeit',
            // Buttons for changing the size of the graph (15, 30, 45min), 45 being default 
            autorange: true,
            range: [dBTime[0], dBTime[parseInt(document.getElementById('timespan').value)-1]],
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
            rangeslider: {range: [dBTime[0], dBTime[parseInt(document.getElementById('timespan').value)-1]]},
            type: 'date'
        }
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