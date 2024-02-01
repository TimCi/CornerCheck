"use strict"


document.addEventListener("DOMContentLoaded", function(){
    const leftData = localStorage.getItem("leftDataWeekly");
    const midData = localStorage.getItem("midDataWeekly");
    const rightData = localStorage.getItem("rightDataWeekly");
    console.log(leftData);
    if (leftData && midData && rightData) {
        const leftDataArray = JSON.parse(leftData);
        const midDataArray = JSON.parse(midData);
        const rightDataArray = JSON.parse(rightData);
        dbGraph(getDB(leftDataArray), getDB(midDataArray), getDB(rightDataArray), getTime(leftDataArray));
        showAvgMax(getDB(leftDataArray), getDB(midDataArray), getDB(rightDataArray));
    } else {
        console.log("No data found in localStorage");
        //window.location.href = '/'
    }
});

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
        timeOnly.push(new Date (new Date(array[i].createdAt).getTime()));
    }
    timeOnly.reverse();
    return timeOnly;
}



// Build inital plotly graph with Data and Time, also add threshold line
function dbGraph(dBRightData, dBMidData, dBLeftData, dBTime){

    // var threshold = document.getElementById('threshold').value;
    // var thresholdLine = Array(dBRightData.length).fill(threshold);

    const layout = {
        yaxis: { title: 'Dezibel in db(A)'}, // range: [0, 80] to set the axis scale undinamically
        xaxis: {
            title: 'Zeit',
            // Buttons for changing the size of the graph (15, 30, 45min), 45 being default 
            autorange: true,
            range: [dBTime[0], dBTime[dBTime.length-1]],
            rangeselector: {buttons: [
                {
                  count: 3,
                  label: '3h',
                  step: 'hour',
                  stepmode: 'backward'
                },
                {
                  count: 6,
                  label: '6h',
                  step: 'hout',
                  stepmode: 'backward'
                },
                { step: "all"}
              ]},
            // rangeslider beneath the graph. I dont know if it looks good, have to decide with the group (My opinion: Not that useful because we only use 45 minute data anyways)
            rangeslider: {range: [dBTime[0], dBTime[dBTime.length-1]]},
            type: 'date'
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

    // var thresholdTrace = {
    //     x: dBTime,
    //     y: thresholdLine,
    //     name: 'Grenzwert',
    //     type: 'scatter',
    //     line: {dash: 'dash'}
    // } 

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
    const max = Math.max(...left, ...mid, ... right);
    const avg = calculateAverage([...left, ...mid, ... right]);
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
  const sum = arr.reduce((acc, val) => acc + (Math.pow(10,(val/10))), 0);
  return Math.round(Math.log10(sum / arr.length) * 100) / 10;
}