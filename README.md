# hcin720
This is repository where I store class assignments and projects for RIT's HCIN 720.

## Assignment 1 Description:

This assignment required the use of a web API to visualize data. The web API I chose was the [Instagram API](https://instagram.com/developer/).

### Part 1
For the time-based graph, I used the API to gather Instagram posting activity at RIT. Using the GPS coordinates of RIT as parameters for the API, I grabbed timestamps of each Instagram post within the area for the past 24 hours. These timestamps were then binned in order to plot them in a graph displaying the number of posts per hour at RIT. The latest image post to Instagram is also displayed next to this graph.

The data updates every 30 seconds, which any necessary changes made to the graph and the latest image. The graph only displays the past 24 hours, so if the latest change is in a new hour, the x-axis shifts over. The y-axis also dynamically updates, depending on the maximum number of posts per hour.

Libraries used in this visualization:
* [JQuery](https://jquery.com/)
* [d3 - for easier graph creation](http://d3js.org/)
* [Google Fonts](https://www.google.com/fonts)
* [Bootstrap - for some css styling](http://getbootstrap.com/)

### Part 2
For the abstract visualization, I used the API to gather images that are tagged with one of the 4 seasons (fall, winter, spring, summer). The 5 most dominant colors in each image are then determined and "splattered" onto the screen in their respective season category.

The paint splatters are updated every 10 seconds when new tagged images are retrieved from Instagram. If more than 100 pseudo paint splatters exist for a season, the earliest splatters are removed to keep a maximum of 100 splatters per season.

Libraries used in this visualization:
* [JQuery](https://jquery.com/)
* [Paper.js - for splatter visualization](http://paperjs.org/)
* [Color Thief - nifty library for retrieving dominant colors from an image](http://lokeshdhakar.com/projects/color-thief/) 
* [Google Fonts](https://www.google.com/fonts)

