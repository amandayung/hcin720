//adding node modules
var $ = require('jquery');

//instagram API instructions are at:
//https://instagram.com/developer/

//instagram info
var clientID = 'e99fdcee55a641358aa44f3ccaf7bc9b';
var seasonTags = ['FALL', 'WINTER', 'SPRING', 'SUMMER'];
var lastSeasonID = [0, 0, 0, 0];

//store current indices for updating shapes
var seasonIndex = [0, 0, 0, 0];

//display parameters
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

//create a color thief object
var colorThief = new ColorThief();

//setup paper globally so it can happily interact with js
//see: http://paperjs.org/tutorials/getting-started/using-javascript-directly/
paper.install(window);

//season section params
var sectionParams = {
	margin: 100
	//the rest get defined in onload, since the canvas size needs to be known
}

//placement parameters
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

	//size for each season section
	sectionParams.width = view.size.width/seasonTags.length - sectionParams.margin;
	sectionParams.height = view.size.height - 200;

	//get position and size for each section
	for (var i = 0; i < seasonTags.length; i++) {
		//determine bounds for each section
		var sectionPos = new Point(sectionParams.width*i + sectionParams.margin*i+sectionParams.margin/2, 0);
		var sectionSize = new Size(sectionParams.width, sectionParams.height);
		seasonBounds[i] = new Rectangle(sectionPos, sectionSize);

		//add labels for each section
		var text = new PointText({
		    point: new Point(sectionPos.x, sectionPos.y+50),
		    content: seasonTags[i],
		    fillColor: 'grey', //british spelling, apparently
		    fontFamily: 'Noto Sans',
		    fontWeight: 'bold',
		    fontSize: 50
		});
	}

	//update canvas with season labels
	view.draw();

	//get current image data
	getImageData();
	//then update image data every time interval passes
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
	for (i=0; i < instadata.data.length; i++) {
		//make sure it's an image type
		if (instadata.data[i].type == "image") {
			//get image url
			var source = instadata.data[i].images.thumbnail.url;

			//updat last season ID to ensure the latest data is being retrieved
			var id = instadata.data[i].id;
			if (id > lastSeasonID[season]) {
				lastSeasonID[season] = id;
			}

			//create image object so that we can get color data
			var image = new Image();
			//extremely important to include when getting images from different domain!
			//source: https://github.com/lokesh/color-thief/issues/20
			image.crossOrigin = 'Anonymous';
			image.src = source;
			image.onload = function () {
				//get the dominate colors in this image
	  			var colors = colorThief.getPalette(this, colorsPerImage);
	  			//now add colors to the canvas
	  			createPaintSplatter(colors, season);
			}
		}
	}
}

//create paint splatter-like objects
//code for createPaths and createBlob modified from:
//http://paperjs.org/examples/hit-testing/
function createPaintSplatter(colors, season) {
	for (var i = 0; i < colorsPerImage; i++) {
		//need to adjust RGB value to be between 0-1 for paperjs
		var paperColor = [colors[i][0]/255, colors[i][1]/255, colors[i][2]/255];

		//determine random variables to create the paint splatter blob for this particular season
		var radiusDelta = shapeParams.maxRadius - shapeParams.minRadius;
		var pointsDelta = shapeParams.maxPoints - shapeParams.minPoints;
		var radius = shapeParams.minRadius + Math.random() * radiusDelta;
		var points = shapeParams.minPoints + Math.floor(Math.random() * pointsDelta);
		var centerPoint = new Point(sectionParams.width*Math.random()+seasonBounds[season].x, sectionParams.height*Math.random()+100);

		//delete an existing blob if it's there
		if (colorShapes[season][seasonIndex[season]]) {
			colorShapes[season][seasonIndex[season]].remove();
		}
		//create blob and add color
		colorShapes[season][seasonIndex[season]] = createBlob(centerPoint, radius, points);
		colorShapes[season][seasonIndex[season]].fillColor = paperColor;
		colorShapes[season][seasonIndex[season]].fillColor.alpha = 0.8;

		//update shape index
		seasonIndex[season]++;
		if (seasonIndex[season] >= imagesPerSeason*colorsPerImage) {
			seasonIndex[season] = 0;
		}
	}
	//update canvas
	view.draw();
}

//make a random blob-like shape based on parameters given
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