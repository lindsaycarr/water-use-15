function updateStates(newView) {
  var state_promise = updateStateData(newView);
  return(state_promise);
}

function updateStateData(newView) {
  var state_bounds_promise = null;
  if(newView === 'USA') {
    updateStateBounds('lowres');
  } else {
    if(waterUseViz.interactionMode === 'tap') {
      // don't need to load or point to highres data in mobile mode
      stateBoundsZoom = waterUseViz.stateBoundsUSA;
      updateStateBounds('lowres');
    } else if(map.select('#state-bounds-highres').empty()) {
      
      state_bounds_promise = d3.json('data/state_boundaries_zoom.json')
        .then(function(stateBoundsTopo) {
          stateBoundsZoom = topojson.feature(stateBoundsTopo, stateBoundsTopo.objects.states);
          // load the data and create the state boundaries in <use>
          d3.select('defs').append('g').attr('id', 'state-bounds-highres')
            .selectAll('path')
            .data(stateBoundsZoom.features, function(d) {
              return d.properties.STATE_ABBV;
            })
            .enter()
            .append('path')
            .attr('id', function(d) {
              return d.properties.STATE_ABBV+'-highres';
            })
            .attr('d', buildPath);
            
          console.log('statebounds detailed done');
          // do the update to highres data
          updateStateBounds('highres');
        });
      
    } else {
      // do the update to highres data
      updateStateBounds('highres');
    }
    
  }
  return state_bounds_promise;
}

function updateStateBounds(resolution) {
  
  map.select('#state-bounds')
    .selectAll( 'use' )
    .attr('xlink:href', function(d) {
      return '#' + d + '-' + resolution;
    });
}
  
