/*jslint node:true, vars:true, bitwise:true, unparam:true */
/*jshint unused:true */

/*
The Web Sockets Node.js sample application distributed within Intel® XDK IoT Edition under the IoT with Node.js Projects project creation option showcases how to use the socket.io NodeJS module to enable real time communication between clients and the development board via a web browser to toggle the state of the onboard LED.

MRAA - Low Level Skeleton Library for Communication on GNU/Linux platforms
Library in C/C++ to interface with Galileo & other Intel platforms, in a structured and sane API with port nanmes/numbering that match boards & with bindings to javascript & python.

Steps for installing/updating MRAA & UPM Library on Intel IoT Platforms with IoTDevKit Linux* image
Using a ssh client: 
1. echo "src maa-upm http://iotdk.intel.com/repos/1.1/intelgalactic" > /etc/opkg/intel-iotdk.conf
2. opkg update
3. opkg upgrade

OR
In Intel XDK IoT Edition under the Develop Tab (for Internet of Things Embedded Application)
Develop Tab
1. Connect to board via the IoT Device Drop down (Add Manual Connection or pick device in list)
2. Press the "Settings" button
3. Click the "Update libraries on board" option

Review README.md file for in-depth information about web sockets communication

*/

//Crystal was here!!! /\^..^/\

var mraa = require('mraa'); //require mraa
console.log('MRAA Version: ' + mraa.getVersion()); //write the mraa version to the Intel XDK console
//var myOnboardLed = new mraa.Gpio(3, false, true); //LED hooked up to digital pin (or built in pin on Galileo Gen1)
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

// potentiometer hooked up here // VN
// or, the water temperature sensor if if demo mode // VN
var upm_grove = require('jsupm_grove'); 
//setup access analog input Analog pin #1 (A0)
var groveSlide = new upm_grove.GroveSlide(0);   // pin 0    // VN

var Uln200xa_lib = require('jsupm_uln200xa');      // this is for the stepmotor
// Instantiate a Stepper motor on a ULN200XA Darlington Motor Driver
// This was tested with the Grove Geared Step Motor with Driver
// Instantiate a ULN2003XA stepper object
var myUln200xa_obj = new Uln200xa_lib.ULN200XA(4096, 8, 9, 10, 11);

// 1 means in test mode (with just a potentiometer), 0 means in demo mode (with the whole setup)
// basically, if it's 1, we're got an onboardLed, if it's 0, we have a steppermotor
var testMode = 1; 
var ledState = true;   //Boolean to hold the state of Led; this will be OBE soon
var motorState = true; // Boolean to hold the state of motor

var rawSlider = 0;
var volts = 0;
var thresholdValue = 0.5;
var ratio = 1/5;            // used to convert slider values to temp
var constant = -28;         // used to convert slider values to temp
var firstTemp = true;       // is this the first temperature reading?

var timeOutSeconds = 3000;  // 1000 is 1 second

var criticalTemp = 40;
var warningTemp = 55;

var averageItemCount = 5;
var averageCounter = 0;

var totalVolts = 0;
var totalSlider = 0;
var totalTemp = 0;
var averageVolts = 0;
var averageSlider = 0;
var averageTemp = 0;

function tempLoop()
{
    currentRawSlider = groveSlide.raw_value();
    currentVolts = groveSlide.voltage_value();

    if ((firstTemp == true) || (Math.abs(currentVolts - volts) > thresholdValue))
    {
        rawSlider = currentRawSlider;
        volts = currentVolts;
        
        //write the slider/potentiometer value to the console
        //var voltageValue = "Slider Value: " + rawSlider + " = " + volts.toFixed(2) + " V";
        var temp = getTemp(rawSlider);
        var severity = getSeverity(temp);
        console.log(temp + " F" + ", Severity: " + severity);
        //console.log(severity);
        io.emit('temp value', {temp: temp, severity: severity});
        firstTemp = false;
    }
    else if (Math.abs(currentVolts - volts) <= thresholdValue)  
    {
        rawSlider = currentRawSlider;
        volts = currentVolts;
        
        totalVolts = volts + totalVolts;
        totalSlider = rawSlider + totalSlider;
        var temp = getTemp(rawSlider);
        //var severity = getSeverity(temp); 
        totalTemp = parseFloat(temp) + parseFloat(totalTemp);
        //var totalTemp = getTemp(totalSlider);
        console.log("Temp: " + temp + ", totalTemp: " + totalTemp + "\n");
        
        if (averageCounter == averageItemCount)
        {
            //write the slider values to the console
            //console.log("Slider Value: " + rawSlider + " = " + volts.toFixed(2) + " V");  
            console.log("Current temp: " + temp + " F" + ", Severity: " + getSeverity(temp));
            averageVolts = (totalVolts/averageItemCount);
            averageSlider = (totalSlider/averageItemCount);
            averageTemp = (totalTemp/averageItemCount);
            console.log("Average temp: " + averageTemp + " F" + ", Severity: " + getSeverity(averageTemp) + "\n");
            //console.log("Slider Average: " + averageSlider + " = " + averageVolts.toFixed(2) + " V Average\n"); 
        
            
            //console.log(temp + " F" + ", Severity: " + severity);
            
            totalSlider = 0;
            totalVolts = 0;
            totalTemp = 0;
            averageSlider = 0;
            averageVolts = 0;
            averageTemp = 0;
            
            averageCounter = 0;
        }
        averageCounter++;
    }
    
    //wait specified timeout then call function again
    setTimeout(tempLoop, timeOutSeconds);
}

function getTemp(rawSlider) 
{
    var temperature = (rawSlider * ratio) + constant; // convert slider to temperature
    var temp2 = temperature.toPrecision(3);
    return temp2;
}

function getSeverity(temp)
{
    var severity = 1;
    if (temp <= warningTemp)
    {
        severity = 2;
        if (temp <= criticalTemp)
        {
            severity = 3;
        }
    }
    
    return severity;
}

var express = require('express');
var app = express();
var path = require('path');
var http = require('http').Server(app);
var io = require('socket.io')(http);

var connectedUsersArray = [];
var userId;

app.get('/', function(req, res) {
    //Join all arguments together and normalize the resulting path.
    res.sendFile(path.join(__dirname + '/client', 'index.html'));
});

//Allow use of files in client folder
app.use(express.static(__dirname + '/client'));
app.use('/client', express.static(__dirname + '/client'));

//Socket.io Event handlers
io.on('connection', function(socket) {
    console.log("\n Add new User: u"+connectedUsersArray.length);
    if(connectedUsersArray.length > 0) {
        var element = connectedUsersArray[connectedUsersArray.length-1];
        userId = 'u' + (parseInt(element.replace("u", ""))+1);
    }
    else {
        userId = "u0";
    }
    console.log('a user connected: '+userId);
    io.emit('user connect', userId);
    connectedUsersArray.push(userId);
    console.log('Number of Users Connected ' + connectedUsersArray.length);
    console.log('User(s) Connected: ' + connectedUsersArray);
    io.emit('connected users', connectedUsersArray);
    
    
    // Vui code BEGINS
    // this is where we check the temperature value
    tempLoop();
    // Vui code ENDS
    
    socket.on('user disconnect', function(msg) {
        console.log('remove: ' + msg);
        connectedUsersArray.splice(connectedUsersArray.lastIndexOf(msg), 1);
        io.emit('user disconnect', msg);
    });
    
    socket.on('chat message', function(msg) {
        io.emit('chat message', msg);
        console.log('message: ' + msg.value);
    });
    
    
    
    socket.on('toggle motor', function(msg) {
        if (testMode == 1)
        {
            myOnboardLed.write(motorState?1:0); //if motorState is true then write a '1' (high) otherwise write a '0' (low)
            msg.value = motorState;
            io.emit('toggle motor', msg);
            motorState = !motorState; //invert the ledState
        }
        else 
        {
              // add motor stuff here  
        }
    });
    
    
    /* 
    // This will become OBE soon: BEGIN
    socket.on('toogle led', function(msg) {
        myOnboardLed.write(ledState?1:0); //if ledState is true then write a '1' (high) otherwise write a '0' (low)
        msg.value = ledState;
        io.emit('toogle led', msg);
        ledState = !ledState; //invert the ledState
    });
    // This will become OBE soon: END
    */
});


http.listen(3000, function(){
    console.log('Web server Active listening on *:3000');
});