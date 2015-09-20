//node libraries
var d3 = require('d3');

//Photon info
var device = "put your device ID here";
var token = "put your token ID here";
var callback = "fanfare";

//parameter for controlling whether the data is retrieved
//from the serial port or from the cloud
var viaCloud = true;

var socket = io();

//parameters for data processing
window.params = {
	minDarkness: 0,
	maxDarkness: 4095,
	minMoisture: 600, //minimum moisture set for visual
	//testing values
	/*attendMoisture: 300, //level of moisture that it starts complaining it's too low
	maxMoisture: 800, //level of moisture to set off sound
	waterThreshold: 200, //how much difference there needs to be between readings to consider it a cause of watering*/
	attendMoisture: 1000, //level of moisture that it starts complaining it's too low
	maxMoisture: 1500, //level of moisture to set off sound
	waterThreshold: 400, //how much difference there needs to be between readings to consider it a cause of watering
	maxStorage: 500, //have a cutoff for length of the data arrays
	waitToCheck: 10, //wait 10 readings before checking the moisture level again for watering
	currentWait: 0 //wait counter
}

//data storage
window.photonData = {
	photoresistorHistory: [],
	moistureSensorHistory: [],
	curPhotoresistor: window.params.maxDarkness,
	curMoistureSensor: 0
}

//once everything's set up, start getting the data
$(document).ready(function() {
	$("#water-button").click(playFanfare);

	//figure out how to parse data, based on source
	if (viaCloud) {
		getCloudData();
	}
	else {
		//otherwise, get it through the serial port
		socket.on('to browser', function(data) {
			getData(data);
		});

	}

	//start running plot visualization
	plotLightData();

});


//parse the measurement readings from the photon sensors
function getData(data) {
	var measurements = JSON.parse(data);

	//value to currently pass to paper
	window.photonData.curPhotoresistor = measurements.photoresistor;
	window.photonData.curMoistureSensor = measurements.moisture_sensor;

	//also store data for later use, potentially
	window.photonData.photoresistorHistory.push(measurements.photoresistor);
	window.photonData.moistureSensorHistory.push(measurements.moisture_sensor);

	//check to make sure arrays aren't getting unnecessarily large
	if (window.photonData.photoresistorHistory.length > window.params.maxStorage) {
		window.photonData.photoresistorHistory.shift();
	}

	if (window.photonData.moistureSensorHistory.length > window.params.maxStorage) {
		window.photonData.moistureSensorHistory.shift();
	}

	//now check for any signs of watering
	checkForWater();
}


//using Spark.publish to pass data, tutorial from:
//https://community.particle.io/t/tutorial-getting-started-with-spark-publish/3422
function getCloudData() {
	var eventSource = new EventSource(
		"https://api.spark.io/v1/devices/" + device + "/events/?access_token=" + token);

	//readings is the name of event in the firmware
	eventSource.addEventListener("readings", function(e) {
		var cloudData = JSON.parse(e.data);

		//the data needs to be parsed twice (SparkJSON sends it as a string variable, rather than just JSON)
		getData(cloudData.data);
	})

}

//check if the plant just recently got watered
//if it did, play fanfare!
function checkForWater() {
	console.log("current moisture: " + window.photonData.curMoistureSensor);
	if (window.params.currentWait == 0) {
		//check history over past 3 readings (if it's been that long)
		var latest = window.photonData.moistureSensorHistory.length-1;

		var previous = 0;
		if (window.photonData.moistureSensorHistory.length > 3) {
			previous = window.photonData.moistureSensorHistory.length - 3;
		}

		var moistureDifference = window.photonData.moistureSensorHistory[latest] - window.photonData.moistureSensorHistory[previous];
		if (window.photonData.moistureSensorHistory[latest] > window.params.maxMoisture & 
			moistureDifference > window.params.waterThreshold) {
			window.params.currentWait = window.params.waitToCheck;
			playFanfare();
		}

		console.log(window.photonData.curMoistureSensor + ", " + moistureDifference);
	}
	else {
		window.params.currentWait--;
	}
}

//call the function on the photon for playing fanfare
function playFanfare() {
	$.ajax({
  		type: "POST",
  		url: "https://api.particle.io/v1/devices/" + device + "/" + callback + "?access_token=" + token,
 		data: {
 			args: "play"
 		},
  		success: function(data) {
			//console.log(data);
		}
	});
}


//d3 plot of the incoming photoresistor data
//this plot is modeled after examples from:
//http://bost.ocks.org/mike/path/
//http://bl.ocks.org/d3noob/e1aa61856118edfa624d
function plotLightData() {
	var n = 243,
	    duration = 750,
	    now = new Date(Date.now() - duration),
	    data = d3.range(n).map(function() { return 0; });

	var margin = {top: 20, right: 20, bottom: 100, left: 100},
	    width = 600 - margin.left - margin.right;
	    height = 500 - margin.top - margin.bottom;

	var x = d3.time.scale()
	    .domain([now - (n - 2) * duration, now - duration])
	    .range([0, width]);

	var y = d3.scale.linear()
		.domain([0, 100])
	    .range([height, 0]);

	var yAxis = d3.svg.axis()
		.scale(y)
		.orient("left")
		.ticks(5);

	var line = d3.svg.line()
	    .interpolate("basis")
	    .x(function(d, i) { return x(now - (n - 1 - i) * duration); })
	    .y(function(d, i) { return y(d); });

	var svg = d3.select("#graph").append("p").append("svg")
	    .attr("width", width + margin.left + margin.right)
	    .attr("height", height + margin.top + margin.bottom)
	    .style("margin-left", -margin.left + "px")
	  .append("g")
	    .attr("transform", "translate(" + margin.left + "," + margin.top + ")");

	svg.append("defs").append("clipPath")
	    .attr("id", "clip")
	  .append("rect")
	    .attr("width", width)
	    .attr("height", height);

	var xAxis = svg.append("g")
	    .attr("class", "x axis")
	    .attr("transform", "translate(0," + height + ")")
	    .call(x.axis = d3.svg.axis().scale(x).orient("bottom").ticks(d3.time.minute, 1));

	svg.append("g")
		.attr("class", "y axis")
		.call(yAxis)		
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -75)
		.attr("x", -height/2)
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.style("font-weight", "bold")
		.text("Amount of Light (%)");

	//adding grid lines
    svg.append("g")            
        .attr("class", "grid")
        .call(yAxis
            .tickSize(-width, 0, 0)
            .tickFormat("")
            );

	var path = svg.append("g")
	    .attr("clip-path", "url(#clip)")
	  .append("path")
	    .datum(data)
	    .attr("class", "line");

	var transition = d3.select({}).transition()
	    .duration(750)
	    .ease("linear");

	//continually update the graph based on the current data
	(function tick() {
	  transition = transition.each(function() {

	    // update the domains
	    now = new Date();
	    x.domain([now - (n - 2) * duration, now - duration]);
	    y.domain([0, 100]);

	    // push the accumulated photorsistor readings to the data array
	    data.push(((window.params.maxDarkness - window.photonData.curPhotoresistor)/window.params.maxDarkness)*100);

	    // redraw the line
	    svg.select(".line")
	        .attr("d", line)
	        .attr("transform", null);

	    // slide the x-axis left
	    xAxis.call(x.axis);

	    // slide the line left
	    path.transition()
	        .attr("transform", "translate(" + x(now - (n - 1) * duration) + ")");

	    // pop the old data point off the front
	    data.shift();

	  }).transition().each("start", tick);
	})();
}