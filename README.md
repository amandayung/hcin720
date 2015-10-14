# hcin720
This is repository where I store class assignments and projects for RIT's HCIN 720.

## Assignment 1

This assignment required the use of a web API to visualize data. The web API I chose was the [Instagram API](https://instagram.com/developer/).

### Part 1
For the time-based graph, I used the API to gather Instagram posting activity at RIT. Using the GPS coordinates of RIT as parameters for the API, I grabbed timestamps of each Instagram post within the area for the past 24 hours. These timestamps were then binned in order to plot them in a graph displaying the number of posts per hour at RIT. The latest image post to Instagram is also displayed next to this graph.

The data updates every 30 seconds, which any necessary changes made to the graph and the latest image. The graph only displays the past 24 hours, so if the latest change is in a new hour, the x-axis shifts over. The y-axis also dynamically updates, depending on the maximum number of posts per hour.

Libraries used in this visualization:
* [JQuery](https://jquery.com/)
* [d3](http://d3js.org/) - for easier graph creation
* [Google Fonts](https://www.google.com/fonts)
* [Bootstrap](http://getbootstrap.com/) - for some css styling

Demo:
[http://rawgit.com/amandayung/hcin720/master/assignment1/time.html](http://rawgit.com/amandayung/hcin720/master/assignment1/time.html)

### Part 2
For the abstract visualization, I used the API to gather images that are tagged with one of the 4 seasons (fall, winter, spring, summer). The 5 most dominant colors in each image are then determined and "splattered" onto the screen in their respective season category.

The paint splatters are updated every 10 seconds when new tagged images are retrieved from Instagram. If more than 100 pseudo paint splatters exist for a season, the earliest splatters are removed to keep a maximum of 100 splatters per season.

Libraries used in this visualization:
* [JQuery](https://jquery.com/)
* [Paper.js](http://paperjs.org/) - for splatter visualization
* [Color Thief](http://lokeshdhakar.com/projects/color-thief/) - nifty library for retrieving dominant colors from an image
* [Google Fonts](https://www.google.com/fonts)

Demo:
[http://rawgit.com/amandayung/hcin720/master/assignment1/seasons.html](http://rawgit.com/amandayung/hcin720/master/assignment1/seasons.html)


## Assignment 2

This assignment required the use of a Photon with sensors to send data over a serial port and via the cloud. The circuit I built was designed for watching the status of a plant (both its soil moisture level and how much light it is getting), in addition to providing a feature through the cloud to remotely water the plant.

![Plantcare setup](https://raw.githubusercontent.com/amandayung/hcin720/master/assignment2/plantcare-setup.png)

### Circuit

The circuit includes:
* **a photoresistor:** this sensor reports how much light the plant is currently receiving. This data is sent both through the serial port and via the cloud. Both are in JSON format.
* **a soil moisture sensor:** this sensor reports how much water is currently in the soil. This data is sent both through the serial port and via the cloud. Both are in JSON format.
* **a servo:** Attached to the servo is a small plastic container that can be filled with water. When monitoring the plant via the web page, you can press a button to call a function that turns the servo on to dump the water into the plant's pot. This can be sent either via the cloud or through the serial port.
* **a speaker:** Once the plant is watered (based on the current moisture level), the circuit also plays a quick song to let you know you watered the plant successfully. Since this feature is based on checking the change in moisture level of the soil, it will also play music if you water the plant yourself. This function is called on the photon via the cloud or the serial port.

![Circuit setup](https://raw.githubusercontent.com/amandayung/hcin720/master/assignment2/circuit-setup.png)

### Visualization

The data for the visualizatio can be retrieved either via the cloud or through the serial port by setting the variable "viaCloud" as true or false.

For the visualization of the photoresistor data, a line graph displays the amount of light the plant is currently receiving (this is on a scale of 0-100% light, based on an inverse relationship to the amount of resistance in the photoresistor). This dynamically updates as data is received every second.

This assignment's line graph is different from the previous assignment's, as it updates more dynamically. The x-axis is now continually scrolling based on the current time, as opposed to the previous graph which only updated its axis every hour.

The moisture sensor data is displayed via an image of a plant: if the plant is upright, this indicates there is plenty of water in the soil. However, if the water level is lower than optimal, the plant begins to droop. When the soil is very dry, the plant is extremely droopy, almost falling out of its pot. This "droopiness" of the plant is controlled by a quadratic bezier curve. The vector between the "control point" of the curve and the end point is rotated in order to achieve this effect. The plant droopiness is updated dynamically as moisture sensor data is received.

Libraries used in these visualizations:
* [JQuery](https://jquery.com/)
* [d3](http://d3js.org/) - for line graph
* [Paper.js](http://paperjs.org/) - for plant image
* [Google Fonts](https://www.google.com/fonts)

Other libraries used for sending and receiving data:
* [socket.io](http://socket.io/)
* [express](http://expressjs.com/)
* [http](https://nodejs.org/api/http.html)
* [serialport](https://github.com/voodootikigod/node-serialport)
* [SparkJson](https://github.com/menan/SparkJson)


## Assignment 3

For this assignment, a container needed to be made for the electronics put together in Assignment 2. I created one container for the circuit board and another container for the servo which waters the plant.

![overall setup](https://raw.githubusercontent.com/amandayung/hcin720/master/assignment3/overall-container.png)

### Preparing the Circuit

Since the circuit was originally created on a breadboard, I soldered the circuit pieces to a perf board so that the circuit could have a smaller footprint. I also added a power switch to the battery so that the device could be easily powered on and off once the circuit board was inside the container.

### Circuit Board Container

![container front](https://raw.githubusercontent.com/amandayung/hcin720/master/assignment3/container-front.png)

![container back](https://raw.githubusercontent.com/amandayung/hcin720/master/assignment3/container-back.png)

The circuit board container is a model of the pokemon bulbasaur (original model by FLOWALISTIK from Thingiverse: [http://www.thingiverse.com/thing:327753](http://www.thingiverse.com/thing:327753)), modified to have a hole in the body of the bulbasaur which snugly fits the circuit board. The "bulb" of the bulbasaur became the lid of the container. I created the lid model from scratch in order to incorporate a portion that could be inserted into the rectangular hole cut into the body. Both TinkerCAD and 123D Design were using for these 3D models.

I then processed the models in 123D Make in order to create 3D objects with 2D pieces via the laser cutter. The body of the bulbasaur was formed with stacked slices, while the bulb was formed with radial slices. For the laser cutter to properly cut the pieces, I then modified the files output by 123D Make in Illustrator to support the color conventions of the lab laser cutter.

The stacked slices were glued together, while the radial slices of the lid simply hold together on their own. A hole at the back of the body of the bulbasaur allows for USB cable access. The open design of the lid was chosen for easy visibility of the Photon's status LED and for the ability to hear the sound produced by the speaker. Additionally, this design allows for openings for all of the external components of the circuit: the photoresistor can be extended out of the top of the bulb, while the wires to the photoresistor and servo can come out from the side of the bulb. These wires were wrapped with floral tape to give them a more "vine-like" appearance.

### Watering Dish

![watering dish](https://raw.githubusercontent.com/amandayung/hcin720/master/assignment3/watering-dish.png)

The container for the servo, or the "watering dish", was designed to be a holder for both the servo and the flower pot. The dish has a slight inset to snugly fit the base of the flower pot. The dish then has a post to the side that sticks out vertically, in order to support a modeled cloud -- this cloud holds the servo. The original watering container (a small plastic cup) was replaced with a simple half-sphere container. All of the pieces in this container were modeled using both TinkerCAD and 123D Design.

These pieces were then 3D printed. The dish and post could be printed together, but the cloud piece needed to be printed separately. The post was designed with a tapered end that could be inserted into a matching hole at the bottom of the cloud piece. These two pieces were then glued together for a strong base to support the servo. When printing the small water container, it did not print as expected -- the base of the print was not secure to the print bed. Consequently, the half-sphere wobbled as it was continually pushed by the 3D printer's extruder. However, this ended up forming a useful spout for the container, so I kept the print as-is.


