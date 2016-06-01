$(document).ready(function(){
	//Get Current data
	var now = new Date();
	var months = new Array(
      "January","February","March","April","May",
      "June","July","August","September","October",
      "November","December");
	var date =  months[now.getMonth()] + " " + now.getDate() + ", " + now.getFullYear();
	
	$("#currentDate").text("Date : " + date);
	
	$("#override").click(function() {
	  
	  //Check faucetStatus
	  var currentStatus = $("#status").text();
	  
	  if (currentStatus == "DRIPPING")
	  {
		$("#status").text("NOT DRIPPING");
		$("#faucetStatus").attr("src","faucetOff.jpg");  
	  }
	  else
	  {
		$("#status").text("DRIPPING");
		$("#faucetStatus").attr("src","faucetOn.jpg");  
	  }
	  
	});
	
	//Unorder List for temperature. 
	//Display top 10 and when you select the link, previous temperature, it displays the next 10.
	$('ul li:gt(9)').hide();
	
	$('.display-previous').click(function() {
		$('ul li:gt(9)').show("blind");
	});
});


var socket = io();
var userId = "user";

/*
// This will be OBE: BEGIN
$('form').submit(function() {
    socket.emit('chat message', {value: $('#m').val(), userId: userId});
    $('#m').val('');
    return false;
});
// This will be OBE: END
*/

// This will be OBE: BEGIN
$("#led-link").on('click', function(e){
    socket.emit('toogle led', {value: 0, userId: userId});
});
// This will be OBE: END

// This will be OBE: BEGIN
socket.on('toogle led', function(msg) {
    if(msg.value === false) {
        $('#messages').prepend($('<li>Toogle LED: OFF<span> - '+msg.userId+'</span></li>'));
        $("#led-container").removeClass("on");
        $("#led-container").addClass("off");
        $("#led-container span").text("OFF");
    }
    else if(msg.value === true) {
        $('#messages').prepend($('<li>Toogle LED: ON<span> - '+msg.userId+'</span></li>'));
        
        $("#led-container").removeClass("off");
        $("#led-container").addClass("on");
        $("#led-container span").text("ON");
    }
});
// This will be OBE: END

// Vui's function: BEGIN
socket.on('toggle motor', function(msg) {
    if(msg.value === false) {
        //$('#messages').prepend($('<li>Toogle LED: OFF<span> - '+msg.userId+'</span></li>'));
        //$("#led-container").removeClass("on");
        //$("#led-container").addClass("off");
        //$("#led-container span").text("OFF");
    }
    else if(msg.value === true) {
        //$('#messages').prepend($('<li>Toogle LED: ON<span> - '+msg.userId+'</span></li>'));
        //$("#led-container").removeClass("off");
        //$("#led-container").addClass("on");
        //$("#led-container span").text("ON");
    }
});
// Vui's function: END

// Vui's function BEGINS
socket.on('temp value', function(msg) {
    if (msg.severity == 1)
    {
            $('#messages-temp').prepend($('<li class="good"><span>Temp '+msg.temp+'&nbspF,&nbspCondition:'+'Good'+'</span></li>'));
    }
    else if (msg.severity == 2)
    {
           $('#messages-temp').prepend($('<li class="warning"><span>Temp '+msg.temp+'&nbspF,&nbspCondition:'+'Warning'+'</span></li>')); 
    }
    else if (msg.severity == 3)
    {
            $('#messages-temp').prepend($('<li class="danger"><span>Temp '+msg.temp+'&nbspF,&nbspCondition:'+'Danger'+'</span></li>'));
    }
    else // we're offline and in trouble
    {
           $('#messages-temp').append($('<li class="error"><span>'+'***WARNING: SENSOR OFFLINE ***'+'</span></li>')); 
            
    }
});
// Vui's function ENDS


// Vui's function BEGINS
$("#override").on('click', function(e){
    socket.emit('toggle motor', {value: 0, userId: userId});
});

// Vui's function ENDS

socket.on('chat message', function(msg) {
    $('#messages').prepend($('<li>'+msg.value+'<span> - '+msg.userId+'</span></li>'));
});

socket.on('connected users', function(msg) {
    $('#user-container').html("");
    for(var i = 0; i < msg.length; i++) {
        //console.log(msg[i]+" )msg[i] == userId( "+userId);
        if(msg[i] == userId)
            $('#user-container').append($("<div id='" + msg[i] + "' class='my-circle'><span>"+msg[i]+"</span></div>"));
        else
            $('#user-container').append($("<div id='" + msg[i] + "' class='user-circle'><span>"+msg[i]+"</span></div>"));
    }
});

socket.on('user connect', function(msg) {
    if(userId === "user"){
        console.log("Client side userId: "+msg);
        userId = msg;
    }
});

socket.on('user disconnect', function(msg) {
    console.log("user disconnect: " + msg);
    var element = '#'+msg;
    console.log(element)
    $(element).remove();
});

window.onunload = function(e) {
    socket.emit("user disconnect", userId);
}