"use strict"

async function readTextareas() 
{
    const sensebox = document.getElementById(`sensebox`).value;
    const leftSensor = document.getElementById(`leftSensor`).value;
    const midSensor = document.getElementById(`midSensor`).value;
    const rightSensor = document.getElementById(`rightSensor`).value;

    let nowTimestamp = Date.now();
    let nowDate = new Date(nowTimestamp);

    let fortyFiveMinutesAgoTimestamp = nowTimestamp - (45 * 60 * 1000);
    let fortyFiveMinutesAgoDate = new Date(fortyFiveMinutesAgoTimestamp);


    const boxURL = "https://api.opensensemap.org/boxes/" + sensebox + "/sensors";
    const leftURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    const midURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    const rightURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    
    console.log(leftURL);
    const boxResponse = await fetch (boxURL);
    const leftResponse = await fetch (leftURL);
    const midResponse = await fetch (midURL);
    const rightResponse = await fetch (rightURL);

    if (boxResponse.status != 200)
    {
        console.log("sensebox-ID is invalid");
    }
    else if (leftResponse.status != 200)
    {
        console.log("left Sensor-ID is invalid");
    }
    else if (midResponse.status != 200)
    {
        console.log("mid Sensor-ID is invalid");
    }
    else if (rightResponse.status != 200)
    {
        console.log("right Sensor-ID is invalid");
    }
    else
    {
        let leftData = await leftResponse.json();
        let midData = await midResponse.json();
        let rightData = await rightResponse.json();

        console.log(leftData)
    }
      
}
  
document.addEventListener('DOMContentLoaded', function () 
{
    document.getElementById('confirm').addEventListener('click', readTextareas);
});