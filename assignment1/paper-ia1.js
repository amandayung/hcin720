// get jQuery if needed
var $ = window.$;

//just playing with paper.js tutorials for now:

// Create a circle shaped path at the center of the view,
// with a radius of 70:
var path = new Path.Circle({
	center: view.center,
	radius: 70,
	fillColor: 'red'
});

function onFrame(event) {
	// Each frame, change the fill color of the path slightly by
	// adding 1 to its hue:
	path.fillColor.hue += 1;
}

function onResize(event) {
	// Whenever the window is resized, recenter the path:
	path.position = view.center;
}