"use strict"

async function readTextareas() 
{
    let nowTimestamp = Date.now();
    let nowDate = new Date(nowTimestamp);

    const sensebox = document.getElementById(`sensebox`).value;
    const leftSensor = document.getElementById(`leftSensor`).value;
    const midSensor = document.getElementById(`midSensor`).value;
    const rightSensor = document.getElementById(`rightSensor`).value;

    

    let fortyFiveMinutesAgoTimestamp = nowTimestamp - (45 * 60 * 1000);
    let fortyFiveMinutesAgoDate = new Date(fortyFiveMinutesAgoTimestamp);


    const boxURL = "https://api.opensensemap.org/boxes/" + sensebox + "/sensors";
    const leftURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    const midURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    const rightURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + fortyFiveMinutesAgoDate.toISOString() + "&to-date=" + nowDate.toISOString() + "&download=false&format=json";
    
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

        localStorage.setItem("leftData", JSON.stringify(leftData));
        localStorage.setItem("midData", JSON.stringify(midData));
        localStorage.setItem("rightData", JSON.stringify(rightData));
        return {sensebox, leftSensor, midSensor, rightSensor}
    }
}



async function readTextareasWeekly(){

    const sensebox = document.getElementById(`sensebox`).value;
    const leftSensor = document.getElementById(`leftSensor`).value;
    const midSensor = document.getElementById(`midSensor`).value;
    const rightSensor = document.getElementById(`rightSensor`).value;


    const date = document.getElementById("dateSelector").value;
    const dateBegin = date + "16:00:00 GMT+0100";
    const earlyDate =  new Date(dateBegin);
    
    const nextDate = new Date (date.getTime() + 86400000);
    const dateEnd = nextDate + "02:00:00 GMT+0100";
    const lateDate = new Date (dateEnd); 


    const boxURL = "https://api.opensensemap.org/boxes/" + sensebox + "/sensors";
    const leftURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + leftSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const midURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + midSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";
    const rightURL = "https://api.opensensemap.org/boxes/" + sensebox + "/data/" + rightSensor + "?from-date=" + earlyDate.toISOString() + "&to-date=" + lateDate.toISOString() + "&download=false&format=json";

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

        localStorage.setItem("leftDataWeeklyy", JSON.stringify(leftData));
        localStorage.setItem("midDataWeekly", JSON.stringify(midData));
        localStorage.setItem("rightDataWeekly", JSON.stringify(rightData));
    }
}
  
document.addEventListener('DOMContentLoaded', function () 
{
    document.getElementById('live').addEventListener('click', async function() {
        let  {sensebox, leftSensor, midSensor, rightSensor} = await readTextareas();
        window.location.href = '/short_vis' + '?sensebox=' + encodeURIComponent(sensebox) + '&leftSensor=' + encodeURIComponent(leftSensor) + '&midSensor=' + encodeURIComponent(midSensor) + '&rightSensor=' + encodeURIComponent(rightSensor);
    });

    document.getElementById('weekly').addEventListener('click', function(){
        readTextareasWeekly();
        window.location.href = '/weekly_vis'
    })
});