class Timeline {

    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 500,
        containerHeight: _config.containerHeight || 400,
        margin: { top: 40, bottom: 60, right: 30, left: 60 }
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

        console.log(d3.extent(vis.timelineData, vis.xValue));
        
        vis.xScale = d3.scaleTime()
            .domain(d3.extent(vis.timelineData, vis.xValue))
            .range([0, vis.width]);
          
        vis.yScale = d3.scaleLinear()
            .domain(d3.extent(vis.timelineData, vis.yValue))
            .range([vis.height, 0]); 
        
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(20)
            .tickSizeOuter(0)
            .tickPadding(10);
  
        vis.yAxis = d3.axisLeft(vis.yScale)
            .ticks(6)
            .tickSizeOuter(0)
            .tickPadding(10);
        
        // CHANGE POSITION OF TIMELINE HERE
        vis.svg = d3.select(vis.config.parentElement)
            .attr('width', vis.config.containerWidth)
            .attr('height', vis.config.containerHeight)
            .attr('transform', `translate(825, -450)`);

        vis.chart = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.margin.left}, ${vis.config.margin.top})`);
      
        vis.xAxisG = vis.chart.append('g')
          .attr('class', 'axis x-axis')
          .attr('transform', `translate(0,${vis.height})`);
  
        vis.yAxisG = vis.chart.append('g')
            .attr('class', 'axis y-axis');

        vis.chart.append("text")
            .attr("transform", "translate(0,-70)")
            .attr("x", vis.width/2)
            .attr("y", 50)
            .attr("font-size", "15px")
            .attr("font-weight", "bold")
            .attr("text-anchor", "middle")
            .text("Calls Over Time");
        
        vis.chart.append("text")
            .attr("y", vis.height + vis.config.margin.bottom)
            .attr("x", (vis.width + vis.config.margin.left) / 2)
            .attr("text-anchor", "end")
            .attr("font-size", "15px")
            .text("Dates");

        vis.chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", vis.config.margin.top)
            .attr("x", -(vis.config.margin.right + vis.config.margin.left))
            .attr("dy", "-5.1em")
            .attr("text-anchor", "end")
            .attr("font-size", "15px")
            .text("Discoveries");
        
        // We need to make sure that the tracking area is on top of other chart elements
        vis.marks = vis.chart.append('g');
        vis.trackingArea = vis.chart.append('rect')
            .attr('width', vis.width)
            .attr('height', vis.height)
            .attr('fill', 'none')
            .attr('pointer-events', 'all');

        // Empty tooltip group (hidden by default)
        vis.tooltip = vis.chart.append('g')
            .attr('class', 'tooltip')
            .style('display', 'none');

        vis.tooltip.append('circle')
            .attr('r', 4);

        vis.tooltip.append('text');

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
        
    vis.bisectDate = d3.bisector(vis.xValue).left;

    vis.renderVis()     
    }
    
    
  renderVis() { 
    let vis = this;

    vis.chart.selectAll(".line")
        .data([vis.timelineData])
        .join('path')
        .attr('class', 'line')
        .attr('stroke-width', 2)
        .attr('d', vis.line); 

    vis.trackingArea
        .on('mouseenter', () => {
        vis.tooltip.style('display', 'block');
        })
        .on('mouseleave', () => {
        vis.tooltip.style('display', 'none');
        })
        .on('mousemove', function(event) {
        // Get date that corresponds to current mouse x-coordinate
        const xPos = d3.pointer(event, this)[0]; // First array element is x, second is y
        const date = vis.xScale.invert(xPos);

        // Find nearest data point
        const index = vis.bisectDate(vis.timelineData, date, 1);
        const a = vis.timelineData[index - 1];
        const b = vis.timelineData[index];
        const d = b && (date - a.date > b.date - date) ? b : a; 
        console.log(d);
        // Update tooltip
        vis.tooltip.select('circle')
            .attr('transform', `translate(${vis.xScale(d.date)},${vis.yScale(d.count)})`);
        
        vis.tooltip.select('text')
            .attr('transform', `translate(${vis.xScale(d.date)},${(vis.yScale(d.count) - 15)})`)
            .text(Math.round(d.count));
        });
    
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

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
  