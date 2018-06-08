// Define one big global to eventually rule them all.
// null values are placeholders for globals that will be filled in
var waterUseViz = {
  dims: {
    map: {
      width: 1000,
      height: 700
    },
    buttonBox: {
      widthDesktop: 250,
      heightDesktop: 275,
      width: null,
      height: null,
      titlesHeight: null
    },
    svg: {
      width: null,
      height: null
    },
    watermark: {
      width: null,
      height: null
    }
  },
  elements: {
    //svg: null,
    //map: null,
    buttonBox: null
  },
  stateAbrvs: [], // created in extractNames()
  stateBoundsUSA: {},
  countyCentroids: {},
  nationalData: {},
  stateData: {},
  isEmbed: RegExp("embed-water-use-15").test(window.location.pathname),
  firstLoad: true
};

// Globals not yet in waterUseViz
var activeView, activeCategory, prevCategory;
var stateBoundsZoom, countyBoundsUSA;
var countyBoundsZoom = new Map();
var categories = ["total", "thermoelectric", "irrigation","publicsupply", "industrial"];

// Projection
var projection = albersUsaTerritories()
  .scale([1200])
  .translate([waterUseViz.dims.map.width / 2, waterUseViz.dims.map.height / 2]);
  // default is .rotate([96,0]) to center on US (we want this)
    
var buildPath = d3.geoPath()
  .projection(projection);

// circle scale
var scaleCircles = d3.scaleSqrt()
  .range([0, 10]);
  
/** Get user view preferences **/

readHashes();
  
/** Add major svg elements and then set their sizes **/
    
// Create container
var container = d3.select('body div#mapSVG');

// Create SVG and map
var svg = d3.select("#mapSVG")
  .append("svg")
  .attr('preserveAspectRatio', 'xMidYMid');

var map = svg.append("g")
  .attr("id", "map");

var mapBackground = map.append("rect")
  .attr("id", "map-background")
  .on('click', zoomToFromState);

detectDevice(); // sets waterUseViz.interactiveMode
addButtons(); // sets waterUseViz.elements.buttonBox

var watermark = addWatermark();

// Set sizes once now and plan to resize anytime the user resizes their window
resize();
d3.select(window).on('resize', resize); 

/** Add major map-specific elements **/

// Set up some map elements so we're ready to add data piece by piece
prepareMap();

// Set up tooltips
var tooltipDiv = d3.select("body").append("div")
  .classed("tooltip hidden", true);

// Read data and add to map
var stateDataFile;
if(waterUseViz.interactionMode === 'tap') {
  stateDataFile = "data/state_boundaries_mobile.json";
} else {
  stateDataFile = "data/state_boundaries_USA.json";
}

d3.json(stateDataFile)
  .then(function(stateBoundsRaw) {
    drawMap(stateBoundsRaw);
  });

var county_data_promise = d3.tsv("data/county_centroids_wu.tsv")
  .then(function(countyCentroids) {
    waterUseViz.countyCentroids = countyCentroids;
  });
  
var range_data_promise = d3.json("data/wu_data_15_range.json")
  .then(function(waterUseRange) {
    // nationalRange gets used in drawMap->addStates->applyZoomAndStyle and
    // fillMap->scaleCircles-update
    waterUseViz.nationalRange = waterUseRange;
  });
  
var sum_data_promise = d3.json("data/wu_data_15_sum.json")
  .then(function(waterUseNational) {
    // cache data for dotmap and update legend if we're in national view
    waterUseViz.nationalData = waterUseNational;
  });
      
var state_data_promise = d3.json("data/wu_state_data.json")
  .then(function(waterUseState) {
    // cache data for dotmap
    waterUseViz.stateData = waterUseState;
  });     

Promise.all([county_data_promise, range_data_promise, sum_data_promise, state_data_promise])
  .then(function() {
    waterUseViz.course_county_bounds_promise = d3.json('data/county_boundaries_USA.json');
    
    fillMap();
  });
