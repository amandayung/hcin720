var $ = window.$;

//plant shapes
var stem;
var leftLeaf;
var RightLeaf;

//pot shapes
var pot;
var potTrim;

//initialize plant
drawPlant(0);

function onFrame(event) {
	//check if the plant visualization needs to be updated
	var droopiness;
	var moisture = window.photonData.curMoistureSensor;
	if (moisture > window.params.maxMoisture) {
		droopiness = 0;
	}
	else if (moisture < window.params.minMoisture) {
		droopiness = 100;
	}
	else {
		var moistureRange = window.params.maxMoisture - window.params.minMoisture;
		var droopiness = Math.round(100 - ((moisture - window.params.minMoisture)/moistureRange * 100));
	}
	
	drawPlant(droopiness);
}

//update plant visualization based on moisture level ("rotation angle")
function drawPlant(rotationAngle) {
	if (stem) {
		stem.remove();
		leftLeaf.remove();
		rightLeaf.remove();
		pot.remove();
		potTrim.remove();
	}
	//stem points
	var point1 = new Point(view.center.x, view.center.y + 250);
	var point2 = new Point(view.center.x, view.center.y + 100);
	var point3 = new Point(view.center.x, view.center.y - 50);
	var point4 = new Point(view.center.x, view.center.y - 150);

	//rotate top portion of stem to create droopiness
	//based on moisture level
	var vector = point4 - point3;
	var newPoint4 = point3 + vector.rotate(rotationAngle);

	//create the plant stem
	stem = new Path(point1, point2);
	stem.strokeColor = '#99CC00';
	stem.strokeWidth = 20;
	stem.strokeCap = 'round';
	stem.quadraticCurveTo(point3, newPoint4);

	//pot
	pot = new Path();
	pot.closed = true;
	pot.add(new Point(view.center.x - 105, view.center.y + 150));
	pot.add(new Point(view.center.x + 105, view.center.y + 150));
	pot.add(new Point(view.center.x + 80, view.center.y + 300));
	pot.add(new Point(view.center.x - 80, view.center.y + 300));
	pot.strokeColor = "#472400";
	pot.fillColor = "#7A5229";
	pot.strokeWidth = 2;

	//pot trim
	var rectangle = new Rectangle(new Point(view.center.x - 125, view.center.y + 90), new Size(250, 60));
	var cornerSize = new Size(10, 10);
	potTrim = new Shape.Rectangle(rectangle, cornerSize);
	potTrim.strokeColor = "#472400";
	potTrim.fillColor = "#7A5229";
	potTrim.strokeWidth = 2;

	//leaves
	rightLeaf = new Path();
	rightLeaf.closed = true;
	rightLeaf.add(newPoint4);
	rightLeaf.quadraticCurveTo(new Point(newPoint4.x+50, newPoint4.y + 90), new Point(newPoint4.x+200, newPoint4.y));
	rightLeaf.quadraticCurveTo(new Point(newPoint4.x+50, newPoint4.y - 90), new Point(newPoint4.x, newPoint4.y));
	rightLeaf.fillColor = '#99CC00';

	leftLeaf = rightLeaf.clone();
	leftLeaf.position = new Point(rightLeaf.position.x - 200, rightLeaf.position.y);

	rightLeaf.rotate(-25 + rotationAngle, newPoint4);
	leftLeaf.rotate(180);
	leftLeaf.rotate(15 + rotationAngle, newPoint4);
}