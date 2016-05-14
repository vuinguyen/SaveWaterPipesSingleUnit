var socket = io();
var userId = "user";


$('form').submit(function() {
    socket.emit('chat message', {value: $('#m').val(), userId: userId});
    $('#m').val('');
    return false;
});

$("#led-link").on('click', function(e){
    socket.emit('toogle led', {value: 0, userId: userId});
});

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


// Vui's function BEGINS
/*
socket.on('voltage value', function(msg) {
    //$('#messages-voltage').prepend($('<li>Vui - Toogle LED: ON<span> - '+msg.userId+'</span></li>')); // VN
    $('#messages-voltage').prepend($('<li><span>' + msg.voltageValue + '</span></li>')); // VN
};
*/
socket.on('voltage value', function(msg) {
    $('#messages-voltage').prepend($('<li><span> - '+msg+'</span></li>'));
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