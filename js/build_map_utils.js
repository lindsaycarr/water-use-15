/** Functions **/
  
  function readHashes() {
    // Zoom status: default is nation-wide
    activeView = getHash('view');
    if(!activeView) activeView = 'USA';
    
    // Water use category: default is total. To make these readable in the URLs,
    // let's use full-length space-removed lower-case labels, e.g. publicsupply and thermoelectric
    activeCategory = getHash('category');
    if(!activeCategory) activeCategory = 'total';
    // default for prev is total
    prevCategory = 'total';
  }
    
    function prepareMap() {
    
    /** Add map elements **/
    // add placeholder groups for geographic boundaries and circles
    map.append('g').attr('id', 'county-bounds');
    map.append('g').attr('id', 'state-bounds');
    map.append('g').attr('id', 'wu-circles');
    /* creating "defs" which is where we can put things that the browser doesn't render, 
    but can be used in parts of the svg that are rendered (e.g., <use/>) */
      map.append('defs').append('g').attr('id', 'state-bounds-lowres');
    
    /** Initialize URL **/
      setHash('view', activeView);
    setHash('category', activeCategory);
    
    /** Update caption **/
      customizeCaption();
    }

// customize the caption according to the mode (mobile, desktop, etc.)
function customizeCaption() {
  var captionText = 
    "Circle sizes represent rates of water withdrawals by county. ";
  if(waterUseViz.interactionMode === 'tap') {
    captionText = captionText +
      "Tap in the legend to switch categories. " +
      "Tap a state to zoom in, then tap a county for details.";
  } else {
    captionText = captionText +
      "Hover over the map for details. Click a button to switch categories. " +
      "Click a state to zoom in, and click the same state to zoom out.";
  }
  
  d3.select('#map-caption p')
  .text(captionText);
}

function drawMap(stateBoundsRaw) {
  
  // Immediately convert to geojson so we have that converted data available globally.
  waterUseViz.stateBoundsUSA = topojson.feature(stateBoundsRaw, stateBoundsRaw.objects.states);
  
  // get state abreviations into waterUseViz.stateAbrvs for later use
  extractNames(waterUseViz.stateBoundsUSA);  
  
  // add the main, active map features
  addStates(map, waterUseViz.stateBoundsUSA);
  
}

function fillMap() {
  
  // be ready to update the view in case someone resizes the window when zoomed in
  // d3 automatically zooms out when that happens so we need to get zoomed back in
  d3.select(window).on('resize', function(d) {
    resize();
    updateView(activeView, fireAnalytics = false, doTransition = false);
  }); 
  
  // manipulate dropdowns - selector options require countyCentroids if starting zoomed in
  updateViewSelectorOptions(activeView, waterUseViz.stateBoundsUSA);
  addZoomOutButton(activeView);
  
  // update circle scale with data
  scaleCircles = scaleCircles
  .domain(waterUseViz.nationalRange);
  
  // add the circles
  // CIRCLES-AS-CIRCLES
  /*addCircles(countyCentroids);*/
  // CIRCLES-AS-PATHS
  var circlesPaths = prepareCirclePaths(categories, waterUseViz.countyCentroids);
  addCircles(circlesPaths);
  updateCircleCategory(activeCategory);
  
  // update the legend values and text
  updateLegendTextToView();

  // get county bounds displayed after circles 
  if(waterUseViz.interactionMode === 'tap') {
    // set countyBoundsUSA to something small for which !countyBoundsUSA is false so that 
    // if and when the user zooms out from a state, updateCounties won't try to load the low-res data
    countyBoundsUSA = true;
  }
  loadCountyBounds(activeView);

  // once the main map has been filled, any other click is no longer the firstLoad
  waterUseViz.firstLoad = false;

  // format data for rankEm
  var  barData = [];
  waterUseViz.stateData.forEach(function(d) {
    var x = {
      'abrv': d.abrv,
      'STATE_NAME': d.STATE_NAME,
      'open': d.open,
      'wu': d.use.filter(function(e) {return e.category === 'total';})[0].wateruse,
      'fancynums': d.use.filter(function(e) {return e.category === 'total';})[0].fancynums
    };
    barData.push(x);
  });
  
  // create big pie figure (uses waterUseViz.nationalData)
  if(!waterUseViz.isEmbed) loadPie();
  
  // create rankEm figure  
  if(!waterUseViz.isEmbed) rankEm(barData);

}
