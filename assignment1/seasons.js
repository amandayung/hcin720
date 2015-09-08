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