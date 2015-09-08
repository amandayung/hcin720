(function e(t,n,r){function s(o,u){if(!n[o]){if(!t[o]){var a=typeof require=="function"&&require;if(!u&&a)return a(o,!0);if(i)return i(o,!0);var f=new Error("Cannot find module '"+o+"'");throw f.code="MODULE_NOT_FOUND",f}var l=n[o]={exports:{}};t[o][0].call(l.exports,function(e){var n=t[o][1][e];return s(n?n:e)},l,l.exports,e,t,n,r)}return n[o].exports}var i=typeof require=="function"&&require;for(var o=0;o<r.length;o++)s(r[o]);return s})({1:[function(require,module,exports){
//instagram API instructions are at:
//https://instagram.com/developer/

//instagram info
var clientID = 'e99fdcee55a641358aa44f3ccaf7bc9b';
var seasonTags = ['FALL', 'WINTER', 'SPRING', 'SUMMER'];

//store current indices for updating
var seasonIndex = [0, 0, 0, 0];
var lastSeasonID = [0, 0, 0, 0];

//display parameters
//var shapeDims = [30, 90];
var imagesPerSeason = 20; //limited by instagram API
var colorsPerImage = 5;
var updateInterval = 10000; //time in ms

//shape parameters
var shapeParams = {
	minPoints: 10,
	maxPoints: 15,
	minRadius: 30,
	maxRadius: 50
};

/*var shapeParams = {
//these will get initialized once the canvas size is known
width: 0,
height: 0
}*/

//create a color thief object
var colorThief = new ColorThief();

//setup paper globally so it can happily interact with js
//see: http://paperjs.org/tutorials/getting-started/using-javascript-directly/
paper.install(window);

//season section params
var sectionParams = {
	margin: 100
	//these get defined in onload, since the canvas size needs to be known
}

var seasonSections = [];
var seasonBounds = [];

//store season colors
var seasonColors = [];
//set up 2D array
for (var i = 0; i < seasonTags.length; i++) {
	seasonColors[i] = [];
}

//store shapes
var colorShapes = [];
//set up 2D array
for (var i = 0; i < seasonTags.length; i++) {
	colorShapes[i] = [];
}


//setup the paper canvas once everything is ready
window.onload = function() {
	paper.setup('instaCanvas');

	sectionParams.width = view.size.width/seasonTags.length - sectionParams.margin;
	sectionParams.height = view.size.height - 200;

	shapeParams.width = sectionParams.width/colorsPerImage;
	shapeParams.height = sectionParams.height/imagesPerSeason;

	//get position and size for each section
	for (var i = 0; i < seasonTags.length; i++) {
		var sectionPos = new Point(sectionParams.width*i + sectionParams.margin*i+sectionParams.margin/2, 0);
		var sectionSize = new Size(sectionParams.width, sectionParams.height);
		seasonBounds[i] = new Rectangle(sectionPos, sectionSize);
		//var path = new Path.Rectangle(seasonBounds[i]);
		//path.strokeColor = 'grey';

		var text = new PointText({
		    point: new Point(sectionPos.x, sectionPos.y+50),
		    content: seasonTags[i],
		    fillColor: 'grey',
		    fontFamily: 'Noto Sans',
		    fontWeight: 'bold',
		    fontSize: 50
		});
	}

	//create shapes to display colors
	/*for (var i = 0; i < seasonTags.length; i++) {
		var startY = seasonBounds[i].y;
		for (var j = 0; j < imagesPerSeason; j++) {
			var startX = seasonBounds[i].x;
			colorShapes[i][j] = [];

			for (var k = 0; k < colorsPerImage; k++) {
				//var shapePos = new Point(startX + shapeDims[0]*j, startY + shapeDims[1]*i);
				var shapePos = new Point(startX, startY);
				var shapeSize = new Size(shapeParams.width, shapeParams.height);
				var rect = new Rectangle(shapePos, shapeSize);
				colorShapes[i][j][k] = new Path.Rectangle(rect);
				colorShapes[i][j][k].fillColor = 'black';

				startX = startX + shapeParams.width;
			}
			startY = startY + shapeParams.height;

		}

	}*/

	view.draw();

	/*var startX = 10;
	var startY = 20;

	//create shapes to display colors
	//set them to be invisible for now
	for (var i = 0; i < seasonTags.length; i++) {
		for (var j = 0; j < imagesPerSeason*colorsPerImage; j++) {
			var shapePos = new Point(startX + shapeDims[0]*j, startY + shapeDims[1]*i);
			var shapeSize = new Size(shapeDims[0], shapeDims[1]);
			var rect = new Rectangle(shapePos, shapeSize);
			colorShapes[i][j] = new Path.Rectangle(rect);
			//colorShapes[i][j].fillColor = 'black';
			//view.draw();
		}
	}*/

	getImageData();
	//update image data every 10 seconds
	setInterval(updateImageData, updateInterval);
}

//get image data from instagram
function getImageData() {
	//get images from instagram

	for (var i = 0; i < seasonTags.length; i++) {
		$.ajax({
		url: 'https://api.instagram.com/v1/tags/' + seasonTags[i] + '/media/recent?client_id=' + clientID,
		dataType: 'jsonp',
		//for storing index value to pass to function:
		//http://stackoverflow.com/questions/18413969/pass-variable-to-function-in-jquery-ajax-success-callback
		curIndex: i,
		success: function (data) {
			processImages(data, this.curIndex);
		},
          error: function() {
          	console.log("no data?");
          }
		});
	}
	
}

//basically the same as getImageData, but uses a max_tag_id parameter to get the latest images
function updateImageData() {
	for (var i = 0; i < seasonTags.length; i++) {
		$.ajax({
		url: 'https://api.instagram.com/v1/tags/' + seasonTags[i] + '/media/recent?client_id=' + clientID + '&max_tag_id=' + lastSeasonID[i],
		dataType: 'jsonp',
		//for storing index value to pass to function:
		//http://stackoverflow.com/questions/18413969/pass-variable-to-function-in-jquery-ajax-success-callback
		curIndex: i,
		success: function (data) {
			processImages(data, this.curIndex);
		},
          error: function() {
          	console.log("no data?");
          }
		});
	}
}

//manipulate images
function processImages(instadata, season) {
	images = [];
	for (i=0; i < instadata.data.length; i++) {
		if (instadata.data[i].type == "image") {
			var source = instadata.data[i].images.thumbnail.url;
			var id = instadata.data[i].id;
			if (id > lastSeasonID[season]) {
				lastSeasonID[season] = id;
			}

			var image = new Image();
			//extremely important to include when getting images from different domain!
			//source: https://github.com/lokesh/color-thief/issues/20
			image.crossOrigin = 'Anonymous';
			image.src = source;
			image.onload = function () {
	  			var colors = colorThief.getPalette(this, colorsPerImage);
	  			createPaintSplatter(colors, season);
	  			//sendColors(colors, season);
			}
		}
	}
}

//display images
function sendColors(colors, season) {
	//need to adjust RGB value to be between 0-1 for paperjs
	for (var i = 0; i < colorsPerImage; i++) {
		var paperColor = [colors[i][0]/255.0, colors[i][1]/255.0, colors[i][2]/255.0];
		colorShapes[season][seasonIndex[season]][i].fillColor = paperColor;
	}
	view.draw();

	//update shape index
	seasonIndex[season]++;
	if (seasonIndex[season] >= imagesPerSeason) {
		seasonIndex[season] = 0;
	}
}


//create paint splatter-like objects
//code for createPaths and createBlob modified from:
//http://paperjs.org/examples/hit-testing/
function createPaintSplatter(colors, season) {
	for (var i = 0; i < colorsPerImage; i++) {
		var paperColor = [colors[i][0]/255, colors[i][1]/255, colors[i][2]/255];

		var radiusDelta = shapeParams.maxRadius - shapeParams.minRadius;
		var pointsDelta = shapeParams.maxPoints - shapeParams.minPoints;
		var radius = shapeParams.minRadius + Math.random() * radiusDelta;
		var points = shapeParams.minPoints + Math.floor(Math.random() * pointsDelta);
		var centerPoint = new Point(sectionParams.width*Math.random()+seasonBounds[season].x, sectionParams.height*Math.random()+100);

		//delete an existing blob if it's there
		if (colorShapes[season][seasonIndex[season]]) {
			colorShapes[season][seasonIndex[season]].remove();
		}
		colorShapes[season][seasonIndex[season]] = createBlob(centerPoint, radius, points);
		colorShapes[season][seasonIndex[season]].fillColor = paperColor;
		colorShapes[season][seasonIndex[season]].fillColor.alpha = 0.8;

		//update shape index
		seasonIndex[season]++;
		if (seasonIndex[season] >= imagesPerSeason*colorsPerImage) {
			seasonIndex[season] = 0;
		}
	}
	view.draw();
}

function createBlob(center, maxRadius, points) {
	var path = new Path();
	path.closed = true;
	for (var i = 0; i < points; i++) {
		var delta = new Point({
			length: (maxRadius * 0.5) + (Math.random() * maxRadius * 0.5),
			angle: (360 / points) * i
		});
		path.add(new Point(center.x + delta.x, center.y + delta.y));
	}
	path.smooth();
	return path;
}
},{}]},{},[1])
//# sourceMappingURL=data:application/json;charset:utf-8;base64,eyJ2ZXJzaW9uIjozLCJzb3VyY2VzIjpbIi4uLy4uLy4uLy4uL0FwcERhdGEvUm9hbWluZy9ucG0vbm9kZV9tb2R1bGVzL3dhdGNoaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyaWZ5L25vZGVfbW9kdWxlcy9icm93c2VyLXBhY2svX3ByZWx1ZGUuanMiLCJzZWFzb25zLmpzIl0sIm5hbWVzIjpbXSwibWFwcGluZ3MiOiJBQUFBO0FDQUE7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0E7QUFDQTtBQUNBO0FBQ0EiLCJmaWxlIjoiZ2VuZXJhdGVkLmpzIiwic291cmNlUm9vdCI6IiIsInNvdXJjZXNDb250ZW50IjpbIihmdW5jdGlvbiBlKHQsbixyKXtmdW5jdGlvbiBzKG8sdSl7aWYoIW5bb10pe2lmKCF0W29dKXt2YXIgYT10eXBlb2YgcmVxdWlyZT09XCJmdW5jdGlvblwiJiZyZXF1aXJlO2lmKCF1JiZhKXJldHVybiBhKG8sITApO2lmKGkpcmV0dXJuIGkobywhMCk7dmFyIGY9bmV3IEVycm9yKFwiQ2Fubm90IGZpbmQgbW9kdWxlICdcIitvK1wiJ1wiKTt0aHJvdyBmLmNvZGU9XCJNT0RVTEVfTk9UX0ZPVU5EXCIsZn12YXIgbD1uW29dPXtleHBvcnRzOnt9fTt0W29dWzBdLmNhbGwobC5leHBvcnRzLGZ1bmN0aW9uKGUpe3ZhciBuPXRbb11bMV1bZV07cmV0dXJuIHMobj9uOmUpfSxsLGwuZXhwb3J0cyxlLHQsbixyKX1yZXR1cm4gbltvXS5leHBvcnRzfXZhciBpPXR5cGVvZiByZXF1aXJlPT1cImZ1bmN0aW9uXCImJnJlcXVpcmU7Zm9yKHZhciBvPTA7bzxyLmxlbmd0aDtvKyspcyhyW29dKTtyZXR1cm4gc30pIiwiLy9pbnN0YWdyYW0gQVBJIGluc3RydWN0aW9ucyBhcmUgYXQ6XHJcbi8vaHR0cHM6Ly9pbnN0YWdyYW0uY29tL2RldmVsb3Blci9cclxuXHJcbi8vaW5zdGFncmFtIGluZm9cclxudmFyIGNsaWVudElEID0gJ2U5OWZkY2VlNTVhNjQxMzU4YWE0NGYzY2NhZjdiYzliJztcclxudmFyIHNlYXNvblRhZ3MgPSBbJ0ZBTEwnLCAnV0lOVEVSJywgJ1NQUklORycsICdTVU1NRVInXTtcclxuXHJcbi8vc3RvcmUgY3VycmVudCBpbmRpY2VzIGZvciB1cGRhdGluZ1xyXG52YXIgc2Vhc29uSW5kZXggPSBbMCwgMCwgMCwgMF07XHJcbnZhciBsYXN0U2Vhc29uSUQgPSBbMCwgMCwgMCwgMF07XHJcblxyXG4vL2Rpc3BsYXkgcGFyYW1ldGVyc1xyXG4vL3ZhciBzaGFwZURpbXMgPSBbMzAsIDkwXTtcclxudmFyIGltYWdlc1BlclNlYXNvbiA9IDIwOyAvL2xpbWl0ZWQgYnkgaW5zdGFncmFtIEFQSVxyXG52YXIgY29sb3JzUGVySW1hZ2UgPSA1O1xyXG52YXIgdXBkYXRlSW50ZXJ2YWwgPSAxMDAwMDsgLy90aW1lIGluIG1zXHJcblxyXG4vL3NoYXBlIHBhcmFtZXRlcnNcclxudmFyIHNoYXBlUGFyYW1zID0ge1xyXG5cdG1pblBvaW50czogMTAsXHJcblx0bWF4UG9pbnRzOiAxNSxcclxuXHRtaW5SYWRpdXM6IDMwLFxyXG5cdG1heFJhZGl1czogNTBcclxufTtcclxuXHJcbi8qdmFyIHNoYXBlUGFyYW1zID0ge1xyXG4vL3RoZXNlIHdpbGwgZ2V0IGluaXRpYWxpemVkIG9uY2UgdGhlIGNhbnZhcyBzaXplIGlzIGtub3duXHJcbndpZHRoOiAwLFxyXG5oZWlnaHQ6IDBcclxufSovXHJcblxyXG4vL2NyZWF0ZSBhIGNvbG9yIHRoaWVmIG9iamVjdFxyXG52YXIgY29sb3JUaGllZiA9IG5ldyBDb2xvclRoaWVmKCk7XHJcblxyXG4vL3NldHVwIHBhcGVyIGdsb2JhbGx5IHNvIGl0IGNhbiBoYXBwaWx5IGludGVyYWN0IHdpdGgganNcclxuLy9zZWU6IGh0dHA6Ly9wYXBlcmpzLm9yZy90dXRvcmlhbHMvZ2V0dGluZy1zdGFydGVkL3VzaW5nLWphdmFzY3JpcHQtZGlyZWN0bHkvXHJcbnBhcGVyLmluc3RhbGwod2luZG93KTtcclxuXHJcbi8vc2Vhc29uIHNlY3Rpb24gcGFyYW1zXHJcbnZhciBzZWN0aW9uUGFyYW1zID0ge1xyXG5cdG1hcmdpbjogMTAwXHJcblx0Ly90aGVzZSBnZXQgZGVmaW5lZCBpbiBvbmxvYWQsIHNpbmNlIHRoZSBjYW52YXMgc2l6ZSBuZWVkcyB0byBiZSBrbm93blxyXG59XHJcblxyXG52YXIgc2Vhc29uU2VjdGlvbnMgPSBbXTtcclxudmFyIHNlYXNvbkJvdW5kcyA9IFtdO1xyXG5cclxuLy9zdG9yZSBzZWFzb24gY29sb3JzXHJcbnZhciBzZWFzb25Db2xvcnMgPSBbXTtcclxuLy9zZXQgdXAgMkQgYXJyYXlcclxuZm9yICh2YXIgaSA9IDA7IGkgPCBzZWFzb25UYWdzLmxlbmd0aDsgaSsrKSB7XHJcblx0c2Vhc29uQ29sb3JzW2ldID0gW107XHJcbn1cclxuXHJcbi8vc3RvcmUgc2hhcGVzXHJcbnZhciBjb2xvclNoYXBlcyA9IFtdO1xyXG4vL3NldCB1cCAyRCBhcnJheVxyXG5mb3IgKHZhciBpID0gMDsgaSA8IHNlYXNvblRhZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRjb2xvclNoYXBlc1tpXSA9IFtdO1xyXG59XHJcblxyXG5cclxuLy9zZXR1cCB0aGUgcGFwZXIgY2FudmFzIG9uY2UgZXZlcnl0aGluZyBpcyByZWFkeVxyXG53aW5kb3cub25sb2FkID0gZnVuY3Rpb24oKSB7XHJcblx0cGFwZXIuc2V0dXAoJ2luc3RhQ2FudmFzJyk7XHJcblxyXG5cdHNlY3Rpb25QYXJhbXMud2lkdGggPSB2aWV3LnNpemUud2lkdGgvc2Vhc29uVGFncy5sZW5ndGggLSBzZWN0aW9uUGFyYW1zLm1hcmdpbjtcclxuXHRzZWN0aW9uUGFyYW1zLmhlaWdodCA9IHZpZXcuc2l6ZS5oZWlnaHQgLSAyMDA7XHJcblxyXG5cdHNoYXBlUGFyYW1zLndpZHRoID0gc2VjdGlvblBhcmFtcy53aWR0aC9jb2xvcnNQZXJJbWFnZTtcclxuXHRzaGFwZVBhcmFtcy5oZWlnaHQgPSBzZWN0aW9uUGFyYW1zLmhlaWdodC9pbWFnZXNQZXJTZWFzb247XHJcblxyXG5cdC8vZ2V0IHBvc2l0aW9uIGFuZCBzaXplIGZvciBlYWNoIHNlY3Rpb25cclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IHNlYXNvblRhZ3MubGVuZ3RoOyBpKyspIHtcclxuXHRcdHZhciBzZWN0aW9uUG9zID0gbmV3IFBvaW50KHNlY3Rpb25QYXJhbXMud2lkdGgqaSArIHNlY3Rpb25QYXJhbXMubWFyZ2luKmkrc2VjdGlvblBhcmFtcy5tYXJnaW4vMiwgMCk7XHJcblx0XHR2YXIgc2VjdGlvblNpemUgPSBuZXcgU2l6ZShzZWN0aW9uUGFyYW1zLndpZHRoLCBzZWN0aW9uUGFyYW1zLmhlaWdodCk7XHJcblx0XHRzZWFzb25Cb3VuZHNbaV0gPSBuZXcgUmVjdGFuZ2xlKHNlY3Rpb25Qb3MsIHNlY3Rpb25TaXplKTtcclxuXHRcdC8vdmFyIHBhdGggPSBuZXcgUGF0aC5SZWN0YW5nbGUoc2Vhc29uQm91bmRzW2ldKTtcclxuXHRcdC8vcGF0aC5zdHJva2VDb2xvciA9ICdncmV5JztcclxuXHJcblx0XHR2YXIgdGV4dCA9IG5ldyBQb2ludFRleHQoe1xyXG5cdFx0ICAgIHBvaW50OiBuZXcgUG9pbnQoc2VjdGlvblBvcy54LCBzZWN0aW9uUG9zLnkrNTApLFxyXG5cdFx0ICAgIGNvbnRlbnQ6IHNlYXNvblRhZ3NbaV0sXHJcblx0XHQgICAgZmlsbENvbG9yOiAnZ3JleScsXHJcblx0XHQgICAgZm9udEZhbWlseTogJ05vdG8gU2FucycsXHJcblx0XHQgICAgZm9udFdlaWdodDogJ2JvbGQnLFxyXG5cdFx0ICAgIGZvbnRTaXplOiA1MFxyXG5cdFx0fSk7XHJcblx0fVxyXG5cclxuXHQvL2NyZWF0ZSBzaGFwZXMgdG8gZGlzcGxheSBjb2xvcnNcclxuXHQvKmZvciAodmFyIGkgPSAwOyBpIDwgc2Vhc29uVGFncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0dmFyIHN0YXJ0WSA9IHNlYXNvbkJvdW5kc1tpXS55O1xyXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBpbWFnZXNQZXJTZWFzb247IGorKykge1xyXG5cdFx0XHR2YXIgc3RhcnRYID0gc2Vhc29uQm91bmRzW2ldLng7XHJcblx0XHRcdGNvbG9yU2hhcGVzW2ldW2pdID0gW107XHJcblxyXG5cdFx0XHRmb3IgKHZhciBrID0gMDsgayA8IGNvbG9yc1BlckltYWdlOyBrKyspIHtcclxuXHRcdFx0XHQvL3ZhciBzaGFwZVBvcyA9IG5ldyBQb2ludChzdGFydFggKyBzaGFwZURpbXNbMF0qaiwgc3RhcnRZICsgc2hhcGVEaW1zWzFdKmkpO1xyXG5cdFx0XHRcdHZhciBzaGFwZVBvcyA9IG5ldyBQb2ludChzdGFydFgsIHN0YXJ0WSk7XHJcblx0XHRcdFx0dmFyIHNoYXBlU2l6ZSA9IG5ldyBTaXplKHNoYXBlUGFyYW1zLndpZHRoLCBzaGFwZVBhcmFtcy5oZWlnaHQpO1xyXG5cdFx0XHRcdHZhciByZWN0ID0gbmV3IFJlY3RhbmdsZShzaGFwZVBvcywgc2hhcGVTaXplKTtcclxuXHRcdFx0XHRjb2xvclNoYXBlc1tpXVtqXVtrXSA9IG5ldyBQYXRoLlJlY3RhbmdsZShyZWN0KTtcclxuXHRcdFx0XHRjb2xvclNoYXBlc1tpXVtqXVtrXS5maWxsQ29sb3IgPSAnYmxhY2snO1xyXG5cclxuXHRcdFx0XHRzdGFydFggPSBzdGFydFggKyBzaGFwZVBhcmFtcy53aWR0aDtcclxuXHRcdFx0fVxyXG5cdFx0XHRzdGFydFkgPSBzdGFydFkgKyBzaGFwZVBhcmFtcy5oZWlnaHQ7XHJcblxyXG5cdFx0fVxyXG5cclxuXHR9Ki9cclxuXHJcblx0dmlldy5kcmF3KCk7XHJcblxyXG5cdC8qdmFyIHN0YXJ0WCA9IDEwO1xyXG5cdHZhciBzdGFydFkgPSAyMDtcclxuXHJcblx0Ly9jcmVhdGUgc2hhcGVzIHRvIGRpc3BsYXkgY29sb3JzXHJcblx0Ly9zZXQgdGhlbSB0byBiZSBpbnZpc2libGUgZm9yIG5vd1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2Vhc29uVGFncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0Zm9yICh2YXIgaiA9IDA7IGogPCBpbWFnZXNQZXJTZWFzb24qY29sb3JzUGVySW1hZ2U7IGorKykge1xyXG5cdFx0XHR2YXIgc2hhcGVQb3MgPSBuZXcgUG9pbnQoc3RhcnRYICsgc2hhcGVEaW1zWzBdKmosIHN0YXJ0WSArIHNoYXBlRGltc1sxXSppKTtcclxuXHRcdFx0dmFyIHNoYXBlU2l6ZSA9IG5ldyBTaXplKHNoYXBlRGltc1swXSwgc2hhcGVEaW1zWzFdKTtcclxuXHRcdFx0dmFyIHJlY3QgPSBuZXcgUmVjdGFuZ2xlKHNoYXBlUG9zLCBzaGFwZVNpemUpO1xyXG5cdFx0XHRjb2xvclNoYXBlc1tpXVtqXSA9IG5ldyBQYXRoLlJlY3RhbmdsZShyZWN0KTtcclxuXHRcdFx0Ly9jb2xvclNoYXBlc1tpXVtqXS5maWxsQ29sb3IgPSAnYmxhY2snO1xyXG5cdFx0XHQvL3ZpZXcuZHJhdygpO1xyXG5cdFx0fVxyXG5cdH0qL1xyXG5cclxuXHRnZXRJbWFnZURhdGEoKTtcclxuXHQvL3VwZGF0ZSBpbWFnZSBkYXRhIGV2ZXJ5IDEwIHNlY29uZHNcclxuXHRzZXRJbnRlcnZhbCh1cGRhdGVJbWFnZURhdGEsIHVwZGF0ZUludGVydmFsKTtcclxufVxyXG5cclxuLy9nZXQgaW1hZ2UgZGF0YSBmcm9tIGluc3RhZ3JhbVxyXG5mdW5jdGlvbiBnZXRJbWFnZURhdGEoKSB7XHJcblx0Ly9nZXQgaW1hZ2VzIGZyb20gaW5zdGFncmFtXHJcblxyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2Vhc29uVGFncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0JC5hamF4KHtcclxuXHRcdHVybDogJ2h0dHBzOi8vYXBpLmluc3RhZ3JhbS5jb20vdjEvdGFncy8nICsgc2Vhc29uVGFnc1tpXSArICcvbWVkaWEvcmVjZW50P2NsaWVudF9pZD0nICsgY2xpZW50SUQsXHJcblx0XHRkYXRhVHlwZTogJ2pzb25wJyxcclxuXHRcdC8vZm9yIHN0b3JpbmcgaW5kZXggdmFsdWUgdG8gcGFzcyB0byBmdW5jdGlvbjpcclxuXHRcdC8vaHR0cDovL3N0YWNrb3ZlcmZsb3cuY29tL3F1ZXN0aW9ucy8xODQxMzk2OS9wYXNzLXZhcmlhYmxlLXRvLWZ1bmN0aW9uLWluLWpxdWVyeS1hamF4LXN1Y2Nlc3MtY2FsbGJhY2tcclxuXHRcdGN1ckluZGV4OiBpLFxyXG5cdFx0c3VjY2VzczogZnVuY3Rpb24gKGRhdGEpIHtcclxuXHRcdFx0cHJvY2Vzc0ltYWdlcyhkYXRhLCB0aGlzLmN1ckluZGV4KTtcclxuXHRcdH0sXHJcbiAgICAgICAgICBlcnJvcjogZnVuY3Rpb24oKSB7XHJcbiAgICAgICAgICBcdGNvbnNvbGUubG9nKFwibm8gZGF0YT9cIik7XHJcbiAgICAgICAgICB9XHJcblx0XHR9KTtcclxuXHR9XHJcblx0XHJcbn1cclxuXHJcbi8vYmFzaWNhbGx5IHRoZSBzYW1lIGFzIGdldEltYWdlRGF0YSwgYnV0IHVzZXMgYSBtYXhfdGFnX2lkIHBhcmFtZXRlciB0byBnZXQgdGhlIGxhdGVzdCBpbWFnZXNcclxuZnVuY3Rpb24gdXBkYXRlSW1hZ2VEYXRhKCkge1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgc2Vhc29uVGFncy5sZW5ndGg7IGkrKykge1xyXG5cdFx0JC5hamF4KHtcclxuXHRcdHVybDogJ2h0dHBzOi8vYXBpLmluc3RhZ3JhbS5jb20vdjEvdGFncy8nICsgc2Vhc29uVGFnc1tpXSArICcvbWVkaWEvcmVjZW50P2NsaWVudF9pZD0nICsgY2xpZW50SUQgKyAnJm1heF90YWdfaWQ9JyArIGxhc3RTZWFzb25JRFtpXSxcclxuXHRcdGRhdGFUeXBlOiAnanNvbnAnLFxyXG5cdFx0Ly9mb3Igc3RvcmluZyBpbmRleCB2YWx1ZSB0byBwYXNzIHRvIGZ1bmN0aW9uOlxyXG5cdFx0Ly9odHRwOi8vc3RhY2tvdmVyZmxvdy5jb20vcXVlc3Rpb25zLzE4NDEzOTY5L3Bhc3MtdmFyaWFibGUtdG8tZnVuY3Rpb24taW4tanF1ZXJ5LWFqYXgtc3VjY2Vzcy1jYWxsYmFja1xyXG5cdFx0Y3VySW5kZXg6IGksXHJcblx0XHRzdWNjZXNzOiBmdW5jdGlvbiAoZGF0YSkge1xyXG5cdFx0XHRwcm9jZXNzSW1hZ2VzKGRhdGEsIHRoaXMuY3VySW5kZXgpO1xyXG5cdFx0fSxcclxuICAgICAgICAgIGVycm9yOiBmdW5jdGlvbigpIHtcclxuICAgICAgICAgIFx0Y29uc29sZS5sb2coXCJubyBkYXRhP1wiKTtcclxuICAgICAgICAgIH1cclxuXHRcdH0pO1xyXG5cdH1cclxufVxyXG5cclxuLy9tYW5pcHVsYXRlIGltYWdlc1xyXG5mdW5jdGlvbiBwcm9jZXNzSW1hZ2VzKGluc3RhZGF0YSwgc2Vhc29uKSB7XHJcblx0aW1hZ2VzID0gW107XHJcblx0Zm9yIChpPTA7IGkgPCBpbnN0YWRhdGEuZGF0YS5sZW5ndGg7IGkrKykge1xyXG5cdFx0aWYgKGluc3RhZGF0YS5kYXRhW2ldLnR5cGUgPT0gXCJpbWFnZVwiKSB7XHJcblx0XHRcdHZhciBzb3VyY2UgPSBpbnN0YWRhdGEuZGF0YVtpXS5pbWFnZXMudGh1bWJuYWlsLnVybDtcclxuXHRcdFx0dmFyIGlkID0gaW5zdGFkYXRhLmRhdGFbaV0uaWQ7XHJcblx0XHRcdGlmIChpZCA+IGxhc3RTZWFzb25JRFtzZWFzb25dKSB7XHJcblx0XHRcdFx0bGFzdFNlYXNvbklEW3NlYXNvbl0gPSBpZDtcclxuXHRcdFx0fVxyXG5cclxuXHRcdFx0dmFyIGltYWdlID0gbmV3IEltYWdlKCk7XHJcblx0XHRcdC8vZXh0cmVtZWx5IGltcG9ydGFudCB0byBpbmNsdWRlIHdoZW4gZ2V0dGluZyBpbWFnZXMgZnJvbSBkaWZmZXJlbnQgZG9tYWluIVxyXG5cdFx0XHQvL3NvdXJjZTogaHR0cHM6Ly9naXRodWIuY29tL2xva2VzaC9jb2xvci10aGllZi9pc3N1ZXMvMjBcclxuXHRcdFx0aW1hZ2UuY3Jvc3NPcmlnaW4gPSAnQW5vbnltb3VzJztcclxuXHRcdFx0aW1hZ2Uuc3JjID0gc291cmNlO1xyXG5cdFx0XHRpbWFnZS5vbmxvYWQgPSBmdW5jdGlvbiAoKSB7XHJcblx0ICBcdFx0XHR2YXIgY29sb3JzID0gY29sb3JUaGllZi5nZXRQYWxldHRlKHRoaXMsIGNvbG9yc1BlckltYWdlKTtcclxuXHQgIFx0XHRcdGNyZWF0ZVBhaW50U3BsYXR0ZXIoY29sb3JzLCBzZWFzb24pO1xyXG5cdCAgXHRcdFx0Ly9zZW5kQ29sb3JzKGNvbG9ycywgc2Vhc29uKTtcclxuXHRcdFx0fVxyXG5cdFx0fVxyXG5cdH1cclxufVxyXG5cclxuLy9kaXNwbGF5IGltYWdlc1xyXG5mdW5jdGlvbiBzZW5kQ29sb3JzKGNvbG9ycywgc2Vhc29uKSB7XHJcblx0Ly9uZWVkIHRvIGFkanVzdCBSR0IgdmFsdWUgdG8gYmUgYmV0d2VlbiAwLTEgZm9yIHBhcGVyanNcclxuXHRmb3IgKHZhciBpID0gMDsgaSA8IGNvbG9yc1BlckltYWdlOyBpKyspIHtcclxuXHRcdHZhciBwYXBlckNvbG9yID0gW2NvbG9yc1tpXVswXS8yNTUuMCwgY29sb3JzW2ldWzFdLzI1NS4wLCBjb2xvcnNbaV1bMl0vMjU1LjBdO1xyXG5cdFx0Y29sb3JTaGFwZXNbc2Vhc29uXVtzZWFzb25JbmRleFtzZWFzb25dXVtpXS5maWxsQ29sb3IgPSBwYXBlckNvbG9yO1xyXG5cdH1cclxuXHR2aWV3LmRyYXcoKTtcclxuXHJcblx0Ly91cGRhdGUgc2hhcGUgaW5kZXhcclxuXHRzZWFzb25JbmRleFtzZWFzb25dKys7XHJcblx0aWYgKHNlYXNvbkluZGV4W3NlYXNvbl0gPj0gaW1hZ2VzUGVyU2Vhc29uKSB7XHJcblx0XHRzZWFzb25JbmRleFtzZWFzb25dID0gMDtcclxuXHR9XHJcbn1cclxuXHJcblxyXG4vL2NyZWF0ZSBwYWludCBzcGxhdHRlci1saWtlIG9iamVjdHNcclxuLy9jb2RlIGZvciBjcmVhdGVQYXRocyBhbmQgY3JlYXRlQmxvYiBtb2RpZmllZCBmcm9tOlxyXG4vL2h0dHA6Ly9wYXBlcmpzLm9yZy9leGFtcGxlcy9oaXQtdGVzdGluZy9cclxuZnVuY3Rpb24gY3JlYXRlUGFpbnRTcGxhdHRlcihjb2xvcnMsIHNlYXNvbikge1xyXG5cdGZvciAodmFyIGkgPSAwOyBpIDwgY29sb3JzUGVySW1hZ2U7IGkrKykge1xyXG5cdFx0dmFyIHBhcGVyQ29sb3IgPSBbY29sb3JzW2ldWzBdLzI1NSwgY29sb3JzW2ldWzFdLzI1NSwgY29sb3JzW2ldWzJdLzI1NV07XHJcblxyXG5cdFx0dmFyIHJhZGl1c0RlbHRhID0gc2hhcGVQYXJhbXMubWF4UmFkaXVzIC0gc2hhcGVQYXJhbXMubWluUmFkaXVzO1xyXG5cdFx0dmFyIHBvaW50c0RlbHRhID0gc2hhcGVQYXJhbXMubWF4UG9pbnRzIC0gc2hhcGVQYXJhbXMubWluUG9pbnRzO1xyXG5cdFx0dmFyIHJhZGl1cyA9IHNoYXBlUGFyYW1zLm1pblJhZGl1cyArIE1hdGgucmFuZG9tKCkgKiByYWRpdXNEZWx0YTtcclxuXHRcdHZhciBwb2ludHMgPSBzaGFwZVBhcmFtcy5taW5Qb2ludHMgKyBNYXRoLmZsb29yKE1hdGgucmFuZG9tKCkgKiBwb2ludHNEZWx0YSk7XHJcblx0XHR2YXIgY2VudGVyUG9pbnQgPSBuZXcgUG9pbnQoc2VjdGlvblBhcmFtcy53aWR0aCpNYXRoLnJhbmRvbSgpK3NlYXNvbkJvdW5kc1tzZWFzb25dLngsIHNlY3Rpb25QYXJhbXMuaGVpZ2h0Kk1hdGgucmFuZG9tKCkrMTAwKTtcclxuXHJcblx0XHQvL2RlbGV0ZSBhbiBleGlzdGluZyBibG9iIGlmIGl0J3MgdGhlcmVcclxuXHRcdGlmIChjb2xvclNoYXBlc1tzZWFzb25dW3NlYXNvbkluZGV4W3NlYXNvbl1dKSB7XHJcblx0XHRcdGNvbG9yU2hhcGVzW3NlYXNvbl1bc2Vhc29uSW5kZXhbc2Vhc29uXV0ucmVtb3ZlKCk7XHJcblx0XHR9XHJcblx0XHRjb2xvclNoYXBlc1tzZWFzb25dW3NlYXNvbkluZGV4W3NlYXNvbl1dID0gY3JlYXRlQmxvYihjZW50ZXJQb2ludCwgcmFkaXVzLCBwb2ludHMpO1xyXG5cdFx0Y29sb3JTaGFwZXNbc2Vhc29uXVtzZWFzb25JbmRleFtzZWFzb25dXS5maWxsQ29sb3IgPSBwYXBlckNvbG9yO1xyXG5cdFx0Y29sb3JTaGFwZXNbc2Vhc29uXVtzZWFzb25JbmRleFtzZWFzb25dXS5maWxsQ29sb3IuYWxwaGEgPSAwLjg7XHJcblxyXG5cdFx0Ly91cGRhdGUgc2hhcGUgaW5kZXhcclxuXHRcdHNlYXNvbkluZGV4W3NlYXNvbl0rKztcclxuXHRcdGlmIChzZWFzb25JbmRleFtzZWFzb25dID49IGltYWdlc1BlclNlYXNvbipjb2xvcnNQZXJJbWFnZSkge1xyXG5cdFx0XHRzZWFzb25JbmRleFtzZWFzb25dID0gMDtcclxuXHRcdH1cclxuXHR9XHJcblx0dmlldy5kcmF3KCk7XHJcbn1cclxuXHJcbmZ1bmN0aW9uIGNyZWF0ZUJsb2IoY2VudGVyLCBtYXhSYWRpdXMsIHBvaW50cykge1xyXG5cdHZhciBwYXRoID0gbmV3IFBhdGgoKTtcclxuXHRwYXRoLmNsb3NlZCA9IHRydWU7XHJcblx0Zm9yICh2YXIgaSA9IDA7IGkgPCBwb2ludHM7IGkrKykge1xyXG5cdFx0dmFyIGRlbHRhID0gbmV3IFBvaW50KHtcclxuXHRcdFx0bGVuZ3RoOiAobWF4UmFkaXVzICogMC41KSArIChNYXRoLnJhbmRvbSgpICogbWF4UmFkaXVzICogMC41KSxcclxuXHRcdFx0YW5nbGU6ICgzNjAgLyBwb2ludHMpICogaVxyXG5cdFx0fSk7XHJcblx0XHRwYXRoLmFkZChuZXcgUG9pbnQoY2VudGVyLnggKyBkZWx0YS54LCBjZW50ZXIueSArIGRlbHRhLnkpKTtcclxuXHR9XHJcblx0cGF0aC5zbW9vdGgoKTtcclxuXHRyZXR1cm4gcGF0aDtcclxufSJdfQ==
