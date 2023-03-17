class Timeline {

    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 500,
        margin: { top: 20, bottom: 30, right: 30, left: 30 }
      }
  
      this.data = _data
  
      // Call a class function
      this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xValue = d =>   d.date; 
        vis.yValue = d => d.count;
        vis.timelineData = vis.arrangeData(vis.data);

        vis.xScale = d3.scaleTime()
            .domain(d3.extent(vis.timelineData, vis.xValue))
            .range([0, vis.width]);
          
        vis.yScale = d3.scaleLinear()
            .domain(d3.extent(vis.timelineData, vis.yValue))
            .range([vis.height, 0]); 
        
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickPadding(10);
  
        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickPadding(10);

        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);

        vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
  
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');
    
        vis.updateVis(); 
      }
  

   updateVis() { 
     let vis = this;

     vis.chart.select('.x-axis')
        .call(vis.xAxis)
        .selectAll("text")  
        .style("text-anchor", "end")
        .attr("dx", "-.8em")
        .attr("dy", ".15em")
        .attr("transform", "rotate(-45)"); 
 
    vis.chart.select('.y-axis') 
        .call(vis.yAxis);

    vis.line = d3.line()
        .x(d => vis.xScale(vis.xValue(d)))
        .y(d => vis.yScale(vis.yValue(d)));

    vis.chart.selectAll(".line")
        .data([vis.timelineData])
        .join('path')
        .attr('class', 'line')
        .attr('stroke-width', 2)
        .attr('d', vis.line); 
    }
    
    
  renderVis() { 
  
  }

  arrangeData(data) {
    var dataDict = {};
    var dataList = [];

    data.forEach(d => {
        if (d['updated_datetime'] in dataDict) {
            dataDict[d['updated_datetime']] += 1;
        } 
        else {
            dataDict[d['updated_datetime']] = 1;
        }
    })

    for (const [key, value] of Object.entries(dataDict)) {
        dataList.push({
            date: new Date(key),
            count: value
        });
      }

    console.log(dataList);
    return dataList;
  }
  
}
  