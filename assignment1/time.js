//adding node modules
var $ = require('jquery');
var d3 = require('d3');

//instagram API instructions are at:
//https://instagram.com/developer/

//instagram id
var clientID = 'e99fdcee55a641358aa44f3ccaf7bc9b';

//rit cooodinates from Google
var lat = 43.083347;
var lng = -77.675613;

//more active instagrammers near the city...
//var lat = 43.130506;
//var lng = -77.625875;

var distance = 5000; //meters away from this point

//number of "pages" of data to get (calls to the API)
//instagram limits to 20 images per call
var maxCalls = 20;

//values for keeping track of what data has been collected already
var curDate = new Date();
var curTime = Math.round(curDate.getTime()/1000);
var cutoffTime = curTime - (60*60*24); // only get data up to the past 24 hours
var minTimestamp = curTime;
var maxTimestamp = curTime;
var updateInterval = 30000; //ms

//store time info
var createdTimes = [];
var imagesPerHour = [];
var hours = []; //this will save the order of hours (last in array is current hour)
var days = [];
var updateHour = false;

//needed for d3 graph (x-axis indices)
var hourIndex = []
for (var i = 0; i < 25; i++) {
	hourIndex[i] = i;
}

//d3 graph components
var graph = {}

//for storing data to use in d3 graph
var d3Data = [];

//for storing latest instagram image
var latestImage = new Image();
//extremely important to include when getting images from different domain!
//source: https://github.com/lokesh/color-thief/issues/20
latestImage.crossOrigin = 'Anonymous';


//now actually start everything once the page is ready
window.onload = function() {
	//get data to make graph first
	getPreviousData();
	//then update graph
	setInterval(getNewData, updateInterval); //get new data every minute
}

//this gets data before now
function getPreviousData() {
	//get the number of instragram posts over time in rit
	$.ajax({
		url: 'https://api.instagram.com/v1/media/search?lat=' + lat + '&lng=' + lng + '&distance=' + distance + 
		'&max_timestamp=' + maxTimestamp + '&client_id=' + clientID,
		dataType: 'jsonp',
		success: getPastImages
	});
}

//this gets any new data
function getNewData() {
	$.ajax({
		url: 'https://api.instagram.com/v1/media/search?lat=' + lat + '&lng=' + lng + '&distance=' + distance + 
		'&min_timestamp=' + minTimestamp + '&client_id=' + clientID,
		dataType: 'jsonp',
		success: getNewImages
	});
}

//get the latest image and timestamps for all previous data
function getPastImages(instadata) {
	var stopRetrieval = false;
	for (var i = 0; i < instadata.data.length; i++) {
		//first get the image if no image has been retrieved yet
		if (latestImage.src.length == 0 && instadata.data[i].type == "image") {
			latestImage.src = instadata.data[i].images.low_resolution.url;
		}

		//get post timestamp
		var createdTime = instadata.data[i].created_time;

		//break out of this loop once we've reached our cutoff time
		if (createdTime < cutoffTime) {
			processData();
			stopRetrieval = true;
			break;
		}

		//update max timestamp so that we can keep getting older data
		if (createdTime < maxTimestamp) {
			maxTimestamp = createdTime;
		}

		//put earlier times at end of array (since data in instagram data is organized latest first)
		createdTimes.push(instadata.data[i].created_time);
	}

	maxCalls--;
	//make sure max # of calls hasn't been met, to ensure it's not getting data forever
	if (maxCalls <= 0) {
		processData();
	}
	//get more data if the timestamp isn't older than the cutoff time
	else if (!stopRetrieval) {
		getPreviousData();
	}

}

//get the latest image and timestamps for all new data
function getNewImages(instadata) {

	//traversing backwards to get earliest data first
	for (var i = instadata.data.length-1; i >= 0 ; i--) {
		//get latest image in the set
		if (instadata.data[i].type == "image") {
			latestImage.src = instadata.data[i].images.low_resolution.url;
		}

		//get post timestamp
		var createdTime = instadata.data[i].created_time;

		//update min timestamp so that we can keep getting newer data
		if (createdTime > minTimestamp) {
			minTimestamp = createdTime;
		}

		//put data at beginning of array
		createdTimes.unshift(instadata.data[i].created_time);
	}

	//if any new data was received, update graph
	if (instadata.data.length > 0) {
		newDate = new Date(minTimestamp*1000);
		updateData(newDate);
	}
}

//get the data into the right format (images per hour)
function processData() {
	//need to first bin timestamps by hour
	//create bin categories
	//this is in order of earliest to latest
	var curHour = curDate.getHours();
	var curDay = curDate.getDay();
	var prevDay = curDay - 1;
	if (prevDay == -1) {
		prevDay = 6;
	}

	for (var i = 0; i < 25; i++) {
		//this stores the actual hour that matches with each tick in the graph
		hours[i] = (curHour + i) % 24;

		//also figure out the day that matches with the hour
		if (curHour + i == hours[i]) {
			days[i] = prevDay;
		}
		else {
			days[i] = curDay;
		}

		//also pre-allocate values in imagesPerHour array
		imagesPerHour[i] = 0;
	}

	//for all the timestamps, figure out which hour bin they belong in
	for (var i = 0; i < createdTimes.length; i++) {
		countImage(createdTimes[i], curHour, curDay);
	}

	makeD3Data();
	plotData();
	showImage();
}

//get the new data into the right format (images per hour)
function updateData(newDate) {
	var lastIndex = hours.length-1;
	var lastHour = hours[lastIndex];
	var lastDay = days[lastIndex];
	var newHour = newDate.getHours();
	var newDay = newDate.getDay();

	//if it's a new hour, we need to make room for it
	if (newHour != lastHour) {
		hours[lastIndex+1] = newHour;
		imagesPerHour[lastIndex+1] = 0;
		updateHour = true;
	}

	//add day
	if (newDay != lastDay) {
		days[lastIndex+1] = newDay;
	}

	//check for timestamps that are from the latest update
	for (i = 0; i < createdTimes.length; i++) {
		if (createdTimes[i] > curTime) {
			countImage(createdTimes[i], newHour, newDay);
		}
		else {
			//break out of loop because rest of data has already been added
			break;
		}
	}

	//get rid of the earliest hour's data
	if (updateHour) {
		hours.shift();
		days.shift();
		imagesPerHour.shift();
		updateHour = false;
	}

	//update time
	curDate = newDate;
	curTime = Math.round(newDate.getTime()/1000);

	//update the data
	makeD3Data();
	updatePlot();
	showImage();
}

//need to format data nicely for d3
function makeD3Data() {
	var dayNames = ["Sun", "Mon", "Tue", "Wed", "Thu", "Fri", "Sat"];

	//clear out d3Data array
	d3Data = [];

	for (var i = 0; i < imagesPerHour.length; i++) {
		//format time to be in AM/PM
		var dataPoint = {};
		var period = "AM";
		var altHour = hours[i];
		if (hours[i] > 12) {
			altHour = hours[i] % 12;
			period = "PM";
		}
		else if (hours[i] == 0) {
			altHour = 12;
		}
		else if (hours[i] == 12) {
			period = "PM";
		}

		//make tick labels for graph
		if (i == 0 || hours[i] == 0) {
			dataPoint.timeLabel = dayNames[days[i]] + ", " + altHour + period;
		}
		else {
			dataPoint.timeLabel = altHour + period;
		}

		//store data for graph
		dataPoint.hour = i;
		dataPoint.imagesPerHour = imagesPerHour[i];
		d3Data.push(dataPoint);
	}
}

//determine which hour a photo was posted to instagram
function countImage(time, curHour, curDay) {
	var timestamp = new Date(time*1000);
	var hour = timestamp.getHours();
	var day = timestamp.getDay();

	if (hour == curHour) {
		if (day == curDay) {
			imagesPerHour[imagesPerHour.length-1]++;
		}
		else {
			imagesPerHour[0]++;
		}
	}
	else {
		imagesPerHour[hours.indexOf(hour)]++;
	}
}

//using d3 to plot the data
//this code was modified based on the tutorials from:
//http://bl.ocks.org/mbostock/3883245
//http://www.d3noob.org/2012/12/adding-axis-labels-to-d3js-graph.html
//http://bl.ocks.org/mbostock/4403522
//http://stackoverflow.com/questions/29385146/changing-ticks-values-to-text-using-d3
function plotData() {
	graph.margin = {top: 20, right: 20, bottom: 100, left: 100};
	graph.width = 960 - graph.margin.left - graph.margin.right;
	graph.height = 600 - graph.margin.top - graph.margin.bottom;

	graph.x = d3.scale.linear()
		.range([0, graph.width]);

	graph.y = d3.scale.linear()
		.range([graph.height, 0]);

	graph.xAxis = d3.svg.axis()
		.scale(graph.x)
		.tickValues(hourIndex)
		.tickFormat(function(d,i){ return d3Data[i].timeLabel})
		.orient("bottom");

	graph.yAxis = d3.svg.axis()
		.scale(graph.y)
		.orient("left");

	graph.line = d3.svg.line()
		.x(function(d) { return graph.x(d.hour); })
		.y(function(d) { return graph.y(d.imagesPerHour); });

	graph.svg = d3.select("#graph").append("svg")
		.attr("width", graph.width + graph.margin.left + graph.margin.right)
		.attr("height", graph.height + graph.margin.top + graph.margin.bottom)
		.append("g")
		.attr("transform", "translate(" + graph.margin.left + "," + graph.margin.top + ")");

	graph.x.domain(d3.extent(d3Data, function(d) { return d.hour; }));
	graph.y.domain(d3.extent(d3Data, function(d) { return d.imagesPerHour; }));

	graph.svg.append("g")
		.attr("class", "x axis")
		.attr("transform", "translate(0," + graph.height + ")")
		.call(graph.xAxis)
		.selectAll("text")
		.attr("y", 10)
		.attr("x", -graph.margin.bottom/6)
		.attr("dy", ".35em")
		.attr("transform", "rotate(-60)")
		.style("text-anchor", "end")

	graph.svg.append("g")
		.attr("class", "y axis")
		.call(graph.yAxis)
		.append("text")
		.attr("transform", "rotate(-90)")
		.attr("y", -graph.margin.left/2)
		.attr("x", -graph.height/2)
		.attr("dy", "1em")
		.style("text-anchor", "middle")
		.style("font-weight", "bold")
		.text("Instagram Posts Per Hour");

	graph.svg.select(".y.axis")
		.call(graph.yAxis)
		.selectAll("text")

	graph.svg.append("path")
		.datum(d3Data)
		.attr("class", "line")
		.attr("d", graph.line);
}

//updating d3 plot; function based on tutorial from:
//http://bl.ocks.org/d3noob/7030f35b72de721622b8
function updatePlot() {
	//update x-axis labels
	graph.xAxis = d3.svg.axis()
	.scale(graph.x)
	.tickValues(hourIndex)
	.tickFormat(function(d,i){ return d3Data[i].timeLabel})
	.orient("bottom");

	//updating ranges
	graph.x.domain(d3.extent(d3Data, function(d) { return d.hour; }));
	graph.y.domain(d3.extent(d3Data, function(d) { return d.imagesPerHour; }));

	//update line
	graph.svg.select(".line")
		.attr("d", graph.line(d3Data));

	//update x axis
	graph.svg.select(".x.axis")
		.call(graph.xAxis)
		.selectAll("text")
		.attr("y", 10)
		.attr("x", -graph.margin.bottom/6)
		.attr("dy", ".35em")
		.attr("transform", "rotate(-60)")
		.style("text-anchor", "end")

	//update y axis
	graph.svg.select(".y.axis") // change the y axis
		.call(graph.yAxis)
		.selectAll("text")
}

//show the latest image
function showImage() {
	$("#image-holder .panel-body").append(latestImage);
	$("#image-holder").show();
}

