$(document).ready(function(){
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