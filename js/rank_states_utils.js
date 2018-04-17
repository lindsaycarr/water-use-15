
var rankSvg = {
    width: 1000,
    height: 300
};

var svgStates = d3.select("#rank-states-interactive")
  .append("svg")
  .attr('viewBox', '0 0 '+ rankSvg.width + " " + rankSvg.height)
  .attr('preserveAspectRatio', 'xMidYMid');

var stateMap = svgStates.append('g')
  .attr('id','ranked-states-map')
  .attr('transform',"scale(0.4)");

stateMap.append('g')
  .attr('id','ranked-states-moved');

stateMap.append('g')
  .attr('id','ranked-states-draggable');
  
svgStates.append('g')
  .attr('id','ranked-states-bars');
  
// Read state data and add it to figure
d3.queue()
  .defer(d3.json, "data/wu_state_data.json")
  .await(rankEm);
  
function rankEm() {

  // arguments[0] is the error
	var error = arguments[0];
	if (error) throw error;
	
	var bardata = arguments[1];
	
	svgStates.select('#ranked-states-moved')
    .selectAll( 'use' )
    .data(bardata)
    .enter()
    .append('use')
    .style('stroke-dasharray',"10, 10")
    .classed('static-state', true)
    .attr('xlink:href', function(d) {
      return '#'+ d.abrv +'-lowres';
    });
    
    svgStates.select('#ranked-states-draggable')
    .selectAll( 'use' )
    .data(bardata)
    .enter()
    .append('use')
    .filter(function(d){
      return d.open;
    })
      .classed('draggable','true') 
      .style("fill",categoryToColor("total"))
      .attr('id', function(d) {
        return d.abrv + '-rank';
      })
      .attr('xlink:href', function(d) {
        return '#'+ d.abrv +'-lowres';
      })
      .datum({x: 0, y: 0})
      .call(d3.drag()
        .on("drag", dragging)
        .on("end", dragdone));
    
  // add states
  
  var barGroups = svgStates.select('#ranked-states-bars')
    .selectAll('g')
    .data(bardata)
    .enter()
    .append('g')
    .attr('transform', function(d, i){
      return 'translate(' + (500 + i *30) + "," + (280-d.wu) + ")";
    });
    
    barGroups.append('text')
    .attr('y', function(d){
      return d.wu;
    })
    .classed('bar-name',true)
    .classed('open-bar-name', function(d){
      return d.open;
    })
    .attr('dy',"1em")
    .text(function(d){
      return d.abrv;
    });
  
  barGroups.append('rect')
    .attr('height', function(d){
      return d.wu;
    })
    .attr('width','20')
    .style("stroke-dasharray","4, 2")
    .classed('open-rank-bar', function(d){
      return d.open;
    })
    .classed('closed-rank-bar', function(d){
      return !d.open;
    })
    .style('fill', categoryToColor("total"));
  
    function dragging(d) {
      var thisShape = d3.select(this);
      thisShape.attr("transform", "translate(" + (d3.event.x) + "," + (d3.event.y) + ")");
      overRankBar(thisShape.node().getBoundingClientRect());
    }

    function dragdone(d) {
      var barchoice = d3.select('.chosen-rank-bar');
      if (barchoice.empty()){
        d3.select(this)
          .transition().duration(600)
            .attr('transform','translate(0,0)'); 
      } else {
        barchoice
          .on('mouseover', null)
          .on('mouseout', null)
          .attr('class','closed-rank-bar');
        d3.select(barchoice.node().parentNode).select('text')
          .classed('open-bar-name',false);
        d3.select(this).style('opacity', 0)
          .attr('transform','scale(0)'); 
      }
      overRankBar( d3.select(this).node().getBoundingClientRect()); // one last time in cast it overlapped two rectangles
      d3.select(this).attr("transform", "translate(" + (d3.event.x) + "," + (d3.event.y) + ")");
  }
  function overRankBar(shapeBox){
  
  var openBars = d3.selectAll('.open-rank-bar').nodes();
  for (var i = 0; i < openBars.length; i++) { 
    var thisBar = openBars[i];
    var barBox = thisBar.getBoundingClientRect();
    //console.log('testing overlap on bar '+bbox.right+' vs '+x);
    var isOverBar = !(barBox.right < shapeBox.left || 
                barBox.left > shapeBox.right || 
                barBox.bottom < shapeBox.top || 
                barBox.top > shapeBox.bottom);
    if (isOverBar){
      d3.select(thisBar).classed('chosen-rank-bar',true);
    } else {
      d3.select(thisBar).classed('chosen-rank-bar',false);
    }
  }
  
}
}


  

    
