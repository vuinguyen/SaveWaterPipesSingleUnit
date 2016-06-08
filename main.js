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
var myOnboardLed = new mraa.Gpio(13); //LED hooked up to digital pin 13 (or built in pin on Intel Galileo Gen2 as well as Intel Edison)
myOnboardLed.dir(mraa.DIR_OUT); //set the gpio direction to output

// potentiometer hooked up here // VN
// or, the water temperature sensor if in demo mode // VN
var upm_grove = require('jsupm_grove'); 
//setup access analog input Analog pin #1 (A0)
var groveSlide = new upm_grove.GroveSlide(0);   // pin 0    // VN

var Uln200xa_lib = require('jsupm_uln200xa');      // this is for the stepmotor
// Instantiate a Stepper motor on a ULN200XA Darlington Motor Driver
// This was tested with the Grove Geared Step Motor with Driver
// Instantiate a ULN2003XA stepper object
var myUln200xa_obj = new Uln200xa_lib.ULN200XA(4096, 8, 9, 10, 11);

var lcd = require('./lcd');
var display = new lcd.LCD(0);   // 12C socket



// 1 means in test mode (with just a potentiometer), 0 means in demo mode (with the whole setup)
// basically, if it's 0, we have a steppermotor and LCD Display
//var testMode = 1; 
// actually, this might not be necessary, because if we're not connected to the steppermotor or
// the LCD Display, then nothing happens. But we should display stuff that corresponds to the
// steppermotor and LCD Display actions nontheless
////////////////////////////////////////////////////////////////
////////////////////////////////////////////////////////////////


var ledState = true;   //Boolean to hold the state of Led; this will be OBE soon
//var motorState = true; // Boolean to hold the state of motor and onboard LED
var motorState = false; // Boolean to hold the state of motor and onboard LED
                        // if false, valve is closed and onboard LED is off

var rawSlider = 0;
var volts = 0;
var thresholdValue = 0.5;
var ratio = 1/5;            // used to convert slider values to temp
//var constant = -28;         // used to convert slider values to temp
//var constant = -55;
var constant = -36;
var firstTemp = true;       // is this the first temperature reading?

var timeOutSeconds = 3000;  // 1000 is 1 second

//var criticalTemp = 60;
//var warningTemp = 65;
var criticalTemp = 33;
var warningTemp = 38;
var offLineTemp = 10; 

var averageItemCount = 5;
var averageCounter = 0;

var totalVolts = 0;
var totalSlider = 0;
var totalTemp = 0;
var averageVolts = 0;
var averageSlider = 0;
var averageTemp = 0;

var lcd = require('./lcd');
var display = new lcd.LCD(0);   // 12C socket   

//var valveOpen = 0; // state of valve, will be OBE

function printStuff(inTemp, inSeverity, average) {
    // print to console
    var consoleDisplay = (average) ? "Average temp: " + inTemp + " F" + ", Severity: " + inSeverity + "\n" : 
    "Current temp: " + inTemp + " F" + ", Severity: " + inSeverity + "\n";
    console.log(consoleDisplay);
    
    // print to website
    io.emit('temp value', {temp: inTemp, severity: inSeverity});
            
     // print to LCD Display
    setLCDColor(inSeverity);
    display.setCursor(0,0);
    display.write("Temp: " + inTemp + " F");          
};


function valveStuff() {
    // add motor stuff here 
    //motorState = !motorState; //invert the motorState
        
    myOnboardLed.write(motorState?1:0); //if motorState is true then write a '1' (high) otherwise write a '0' (low)
               
    //msg.value = motorState;
        
    //io.emit('toggle motor', msg);
    io.emit('toggle motor', {value: motorState});
};

// go clockwise to open
var openValve = function() {
    valveStuff();
    
    myUln200xa_obj.setSpeed(5); // 5 RPMs

	    myUln200xa_obj.setDirection(Uln200xa_lib.ULN200XA.DIR_CW);

	    //console.log("Rotating 1 revolution clockwise.");
        console.log("Opening valve");

	    //myUln200xa_obj.stepperSteps(4096);
        myUln200xa_obj.stepperSteps(3072);  // 3/4 revolution
       // myUln200xa_obj.stepperSteps(1024);  // 1/4 revolution
};

// go counterclockwise to close
var closeValve = function() {
    valveStuff();
    
    //console.log("Rotating 1/4 revolution counter clockwise.");
        //console.log("Rotating 1 revolution counter clockwise");
        console.log("Closing valve");

	    myUln200xa_obj.setDirection(Uln200xa_lib.ULN200XA.DIR_CCW);

	    //myUln200xa_obj.stepperSteps(2048);
        //myUln200xa_obj.stepperSteps(1024);
        //myUln200xa_obj.stepperSteps(4096);  
        myUln200xa_obj.stepperSteps(3200); // 3/4 +
};

myUln200xa_obj.goForward = openValve;
myUln200xa_obj.reverseDirection  = closeValve;

// Run ULN200xa driven stepper
	//myUln200xa_obj.goForward();    // open the valve

    //myUln200xa_obj.reverseDirection();

	//setTimeout(myUln200xa_obj.reverseDirection, 2000); // close the valve

function setLCDColor(inSeverity) 
{
    var red = 0;
    var green = 192;
    var blue = 0;
    
    if (inSeverity == 3)
    {
        red = 192;
        green = 0;
        blue = 0; 
    }
    else if (inSeverity == 2)
    {
        red = 192;
        green = 192;
        blue = 0; 
    }
    
    display.setColor(red, green, blue);
};



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
        printStuff(temp, severity);
        firstTemp = false;
    }
    else if (Math.abs(currentVolts - volts) <= thresholdValue)  
    {
        rawSlider = currentRawSlider;
        volts = currentVolts;
        
        totalVolts = volts + totalVolts;
        totalSlider = rawSlider + totalSlider;
        var temp = getTemp(rawSlider);
        totalTemp = parseFloat(temp) + parseFloat(totalTemp);
        //console.log("Temp: " + temp + ", totalTemp: " + totalTemp + "\n");
        if (averageCounter == averageItemCount)
        {
            averageVolts = (totalVolts/averageItemCount);
            averageSlider = (totalSlider/averageItemCount);
            averageTemp = (totalTemp/averageItemCount).toPrecision(3);
            var averageSeverity = getSeverity(averageTemp);
            //console.log("Average temp: " + averageTemp + " F" + ", Severity: " + averageSeverity + "\n");
            
            printStuff(averageTemp, averageSeverity, 1)
            
            // valve is OPEN
            if ((averageSeverity <= 2) && (motorState == true))
                {
                    // close the valve
                    //myUln200xa_obj.reverseDirection();
                    
                    //valveOpen = 0;
                    
                    //msg.value = motorState;
                    motorState = !motorState; //invert the motorState
                   // myOnboardLed.write(motorState?1:0); //if motorState is true then write a '1' (high) otherwise write a '0' (low)
                   // io.emit('toggle motor', {value: motorState});
                    
                    closeValve();
                }
            //if ((averageSeverity == 3) && (valveOpen == 0))
            // valve is closed
              if ((averageSeverity == 3) && (motorState == false))
                {
                    // open the valve
                    //myUln200xa_obj.goForward();
                    
                    //valveOpen = 1;
                    
                    motorState = !motorState; //invert the motorState
                   // myOnboardLed.write(motorState?1:0); //if motorState is true then write a '1' (high) otherwise write a '0' (low)
                   // io.emit('toggle motor', {value: motorState});
                    
                    openValve();
                    
                }
            
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
        //if (testMode == 1)
        //{
         //   myOnboardLed.write(motorState?1:0); //if motorState is true then write a '1' (high) otherwise write a '0' (low)
        //    msg.value = motorState;
        //    io.emit('toggle motor', msg);
            motorState = !motorState; //invert the ledState
        //}
        //else 
       // {
            
            if (motorState == false)
                {
                    // close the valve
                    //myUln200xa_obj.reverseDirection();
                    closeValve();
                    //myOnboardLed.write()
                }
            else // open valve, turn to dripping
                {
                    //myUln200xa_obj.goForward();
                    openValve();
                }
            
            
            //myOnboardLed.write(motorState?1:0); //if motorState is true then write a '1' (high) otherwise write a '0' (low)
            
        //}
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