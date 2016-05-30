		// //Get Current Date and Time
$(document).ready(function(){
	// var now = moment().format("dddd, MMMM Do, YYYY");
	// $("#currentDate").text(now);
	// alert(now);
	
	
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
});