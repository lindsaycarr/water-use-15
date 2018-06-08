function updateStates(newView) {
  updateStateData(newView);
}

function updateStateData(newView) {
  if(newView === 'USA') {
    updateStateBounds('lowres');
  } else {
    if(waterUseViz.interactionMode === 'tap') {
      // don't need to load or point to highres data in mobile mode
      stateBoundsZoom = stateBoundsUSA;
      updateStateBounds('lowres');

    } else if(map.select('#state-bounds-highres').empty()) {
      
      d3.json('data/state_boundaries_zoom.json', function(error, stateBoundsTopo) {
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
}

function updateStateBounds(resolution) {
  
  map.select('#state-bounds')
    .selectAll( 'use' )
    .attr('xlink:href', function(d) {
      return '#' + d + '-' + resolution;
    });
}
  
