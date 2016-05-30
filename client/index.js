var socket = io();
var userId = "user";


$('form').submit(function() {
    socket.emit('chat message', {value: $('#m').val(), userId: userId});
    $('#m').val('');
    return false;
});

// This will be OBE: BEGIN
$("#led-link").on('click', function(e){
    socket.emit('toogle led', {value: 0, userId: userId});
});
// This will be OBE: END

// This will be OBE: BEGIN
socket.on('toogle led', function(msg) {
    if(msg.value === false) {
        $('#messages').prepend($('<li>Toogle LED: OFF<span> - '+msg.userId+'</span></li>'));
        //$('#messages-voltage').prepend($('<li>Vui - Toogle LED: OFF<span> - '+msg.userId+'</span></li>')); // VN
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


// Vui's function BEGINS
socket.on('temp value', function(msg) {
    if (msg.severity == 1)
        {
            
    $('#messages-temp').prepend($('<li class="good"><span>Temp '+msg.temp+'&nbspF,&nbspSeverity:'+'Good'+'</span></li>'));
        }
    else if (msg.severity == 2)
        {
           $('#messages-temp').prepend($('<li class="warning"><span>Temp '+msg.temp+'&nbspF,&nbspSeverity:'+'Warning'+'</span></li>')); 
        }
    else if (msg.severity == 3)
        {
            $('#messages-temp').prepend($('<li class="danger"><span>Temp '+msg.temp+'&nbspF,&nbspSeverity:'+'Danger'+'</span></li>'));
        }
    else // we're offline and in trouble
        {
           $('#messages-temp').append($('<li class="error"><span>'+'***WARNING: SENSOR OFFLINE ***'+'</span></li>')); 
            
        }
});
// Vui's function ENDS


// Vui's function BEGINS
$("#override").on('click', function(e){
    socket.emit('toogle led', {value: 0, userId: userId});
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