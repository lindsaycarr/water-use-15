// Width and height
var chart_width     =   1000;
var chart_height    =   800;

// Projection
var projection = d3.geoAlbers()
    .scale([1200])
    // default is .rotate([96,0]) to center on US (we want this)
    .translate([chart_width / 2, chart_height / 2]);
var buildPath = d3.geoPath()
    .projection(projection);

// Create SVG
var svg = d3.select("body")
    .append("svg")
    .attr("width", chart_width)
    .attr("height", chart_height);
    
var map = svg.append("g")
  .attr("id", "map");
  
d3.queue()
  .defer(d3.json, "data/conus_map.geojson")
  .await(create_map);
  
// dummy var for now
var years = [1950, 1960, 1970, 1980, 1990, 1995, 2000, 2005, 2010, 2015];

function create_map() {
  
  // arguments[0] is the error
	var error = arguments[0];
	
	// the rest of the indices of arguments are all the other arguments passed in
	// so in this case, all of the results from q.defers
	var state_data = arguments[1];
  
  add_states(map, state_data);
  add_timeslider(map, years, chart_width, chart_height);
  
}