
// call a series of functions to 
// make sure we have the USA data and then
// make sure we have this state stored in countyBoundsZoom and then
// visualize
function updateCounties(state) {
  loadCountyBounds(state);
}

// make sure we have the USA data and then
// call the next function (make sure we have this state stored in countyBoundsZoom and then visualize)
function loadCountyBounds(state) {
  
  // for now let's always load the county data all at once. later we can again split
  // into single-state files if that turns out to be useful for performance.
  if(state === 'USA') {
    // For national view, use the coarse-resolution county boundaries
    if(!countyBoundsUSA) {
      // load the json file if it hasn't been loaded yet.
      d3.json('data/county_boundaries_USA.json', function(error, allCountiesTopo) {
        if(error) throw error;
      
        // extract the topojson to geojson and add data. cache the data to a global variable, countyBoundsUSA
        allCountiesGeo = topojson.feature(allCountiesTopo, allCountiesTopo.objects.counties).features;
        countyBoundsUSA = addDataToCounties(allCountiesGeo);
        
        // do the update
        displayCountyBounds(countyBoundsUSA);
        
      });
    } else {
      // if the data has been loaded before, just show them (switches back to course if at finer scale)
      // NOT SURE IF THIS IS EVER CALLED
      displayCountyBounds(countyBoundsUSA);
    }
  } else if(!countyBoundsZoom.has('USA')) {
    // if the detailed county bounds data has not been loaded, let's load it
    var countyJson;
    if(waterUseViz.interactionMode === 'tap') {
      countyJson = "data/county_boundaries_mobile.json";
    } else {
      countyJson = "data/county_boundaries_zoom.json";
    }
    d3.json(countyJson, function(error, allCountiesTopo) {
      if(error) throw error;
      
      // extract the topojson to geojson and add data
      allCountiesGeo = topojson.feature(allCountiesTopo, allCountiesTopo.objects.counties).features;
      allCountiesGeoData = addDataToCounties(allCountiesGeo);
      
      // cache in countyBoundsZoom
      countyBoundsZoom.set('USA', allCountiesGeo);
      // also cache for this state specfically then display the more detailed bounds
      cacheCountyBounds(state); // this adds to countyBoundsZoom
      displayCountyBounds(countyBoundsZoom.get(state));
      // make sure the styles are right. this is only important for mobile when loading
      // into USA view such that the first call to updateCounties happens when zooming in;
      // otherwise the styles will already be right shortly
      if(waterUseViz.interactionMode === 'tap') {
        applyZoomAndStyle(activeView, false);
      }
    });
  } else {
    // if the detailed boundaries have been loaded, cache the state specifically if it hasn't
    // then, actually display these detailed boundaries
    cacheCountyBounds(state);
    displayCountyBounds(countyBoundsZoom.get(state));
  }
}

function addDataToCounties(countyBounds) {
  // make countyCentroids easily searchable
  var countyDataMap = d3.map(countyCentroids, function(d) { return d.GEOID; });
  
  // iterate over countyBounds, adding data from countyCentroids to each
  for(var i = 0; i < countyBounds.length; i++) {
    // identify the data row (object) relevant to this county
    var currentCountyData = countyDataMap.get(countyBounds[i].properties.GEOID);
    
    // set the countyBounds properties equal to this data object.
    // no need to keep the old properties; they were just GEOID (G)
    countyBounds[i].properties = currentCountyData;
  }
  
  return(countyBounds);
}

// make sure we have the state stored in countyBoundsZoom and then
// call the next function (visualization)
function cacheCountyBounds(state) {
  // if the county boundaries for this state are already loaded, do nothing.
  // otherwise load them now. (loading currently just means subsetting them from
  // the complete set of counties). 
  if(!countyBoundsZoom.has(state)) {
    // subset the data and run the processing function
    oneStateCounties = countyBoundsZoom.get('USA').filter(function(d) {
      return(d.properties.STATE_ABBV === state);
    });
    countyBoundsZoom.set(state, oneStateCounties);
  } 
}

// visualize
function displayCountyBounds(activeCountyData) {
    
    currentCountyBounds = map.select('#county-bounds').selectAll('.county');
    
    // return immediately if we already have the counties defined and we're zooming out
    if(currentCountyBounds._groups[0].length > 3000 & activeCountyData === countyBoundsUSA) {
      return;
    }
    
    // attach data
    var countyBounds = currentCountyBounds
      .data(activeCountyData, function(d) {
        return d.properties.GEOID;
      });
    
    // enter
    var countyMouser = countyBounds
      .enter()
      .append("path")
      .classed('county', true) // by default, county bounds not seen
      .attr('id', function(d) {
        return d.properties.GEOID;
      })
      .attr('d', buildPath);
      
    // mobile mouse events - click only for zoom and highlight
    if(waterUseViz.interactionMode === "tap") {
      
      countyMouser.on('click', function(d,i,j) {
        // hide on any tap because either we'll zoom out or we'll switch
        // to highlighting a different county
        unhighlightCounty();
        unhighlightCircle();

        // highlight the clicked county if it's a new county, or zoom out
        // if it's the same county as before
        var prevCounty = waterUseViz.prevClickCounty;
        var thisCountyID = d3.select(this).attr("id");
        if(prevCounty === thisCountyID) {
          updateLegendTextToView(); 
          zoomToFromState(d,i,j, d3.select(this));
        } else {
          updateLegendText(d.properties, activeCategory);
          highlightCounty(d3.select(this)); 
          highlightCircle(d.properties, activeCategory);
          updateCountySelector(thisCountyID);
        }

        // set prevClickCounty as global var for next click
        waterUseViz.prevClickCounty = thisCountyID;
      });
      
    // desktop mouse events - click to zoom, hover to highlight
    } else if(waterUseViz.interactionMode === "hover") {
      countyMouser
        .on('click', function(d,i,j) {
          zoomToFromState(d,i,j, d3.select(this));
        })
        .on("mouseover", function(d) {
          highlightCounty(d3.select(this)); 
          highlightCircle(d.properties, activeCategory);
          updateLegendText(d.properties, activeCategory); 
        })
        .on("mouseout", function(d) { 
          unhighlightCounty();
          unhighlightCircle();
          updateLegendTextToView();
        });
    }
    
    // update
    countyBounds
      .attr('d', buildPath);
}
