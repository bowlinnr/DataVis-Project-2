class Timeline {

    constructor(_config, _data) {
      this.config = {
        parentElement: _config.parentElement,
        containerWidth: _config.containerWidth || 600,
        containerHeight: _config.containerHeight || 500,
        contextHeight: 50,
        margin: { top: 40, bottom: 150, right: 30, left: 60 },
        contextMargin: {top: 400, right: 10, bottom: 20, left: 45}
      }
  
      this.data = _data
  
      // Call a class function
      this.initVis();
    }

    initVis() {
        let vis = this;
        vis.width = vis.config.containerWidth - vis.config.margin.left - vis.config.margin.right;
        vis.height = vis.config.containerHeight - vis.config.margin.top - vis.config.margin.bottom;

        vis.xValue = d => d.date; 
        vis.yValue = d => d.count;

        vis.timelineData = vis.arrangeData(vis.data);
        
        vis.xScale = d3.scaleTime()
            .domain(d3.extent(vis.timelineData, vis.xValue))
            .range([0, vis.width]);

        vis.xScaleContext = d3.scaleTime()
            .domain(d3.extent(vis.timelineData, vis.xValue))
            .range([0, vis.width]);
          
        vis.yScale = d3.scaleLinear()
            .domain(d3.extent(vis.timelineData, vis.yValue))
            .range([vis.height, 0]);
        
        vis.yScaleContext = d3.scaleLinear()
            .domain(d3.extent(vis.timelineData, vis.yValue))
            .range([vis.contextHeight, 0]); 
        
        vis.xAxis = d3.axisBottom(vis.xScale)
            .ticks(20)
            .tickSizeOuter(0)
            .tickPadding(10);

        vis.xAxisContext = d3.axisBottom(vis.xScaleContext)
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
            .attr('transform', `translate(825, -470)`);

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
            .attr("x", (vis.width + vis.config.margin.right) / 2)
            .attr("text-anchor", "end")
            .attr("font-size", "15px")
            .text("Dates");

        vis.chart.append("text")
            .attr("transform", "rotate(-90)")
            .attr("y", vis.config.margin.top - 10)
            .attr("x", -(vis.config.margin.right + vis.config.margin.left + 20))
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

        vis.context = vis.svg.append('g')
            .attr('transform', `translate(${vis.config.contextMargin.left},${vis.config.contextMargin.top})`);

        vis.contextAreaPath = vis.context.append('path')
            .attr('class', 'chart-line');

        vis.xAxisContextG = vis.context.append('g')
            .attr('class', 'axis x-axis')
            .attr('transform', `translate(0,${vis.config.contextHeight})`);

        vis.brushG = vis.context.append('g')
            .attr('class', 'brush x-brush');

        // Initialize brush component
        vis.brush = d3.brushX()
            .extent([[0, 0], [vis.config.containerWidth, vis.config.contextHeight]])
            .on('brush', function({selection}) {
            if (selection) vis.brushed(selection);
            })
            .on('end', function({selection}) {
            if (!selection) vis.brushed(null);
            });

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

    vis.area = d3.area()
        .x(d => vis.xScaleContext(vis.xValue(d)))
        .y1(d => vis.yScaleContext(vis.yValue(d)))
        .y0(vis.config.contextHeight);

    vis.line2 = d3.line()
        .x(d => vis.xScaleContext(vis.xValue(d)))
        .y(d => vis.yScaleContext(vis.yValue(d)));

    // vis.xScaleContext.domain(vis.xScale.domain());
    // vis.yScaleContext.domain(vis.yScale.domain());
        
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

     vis.contextAreaPath
         //.data([vis.timelineData])
         //.attr('d', vis.area);
        .data([vis.timelineData])
        .join('path')
        .attr('class', 'line')
        .attr('stroke-width', 2)
        .attr('d', vis.line); 

    vis.trackingArea
        .on('mouseenter', (event, d) => {
        vis.tooltip.style('display', 'block');

    })      
        .on('mouseleave', (event, d) => {
        vis.tooltip.style('display', 'none');
        vis.tooltip.style('left', (event.pageX) + 'px');   
        vis.tooltip.style('top', (event.pageY) + 'px');
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
        // Update tooltip
        vis.tooltip.select('circle')
            .attr('transform', `translate(${vis.xScale(d.date)},${vis.yScale(d.count)})`);
        
        vis.tooltip.select('text')
            .attr('transform', `translate(${30},${30})`)
            .text("Date: " + d.date.getDate() + " " + d.date.toLocaleString('default', { month: 'long' }) + " " + d.date.getFullYear() + ", Number of Discoveries: " + Math.round(d.count));
        });
    
    vis.xAxisG.call(vis.xAxis);
    vis.yAxisG.call(vis.yAxis);

    vis.xAxisContextG.call(vis.xAxisContext);

    const defaultBrushSelection = [vis.xScale(new Date('2021-01-01')), vis.xScaleContext.range()[1]];
    vis.brushG
        .call(vis.brush)
        .call(vis.brush.move, defaultBrushSelection);

  }

  arrangeData(data) {
    var dataDict = {};
    var dataList = [];

    data.forEach(d => {
        if (d['requested_datetime'] in dataDict) {
            dataDict[d['requested_datetime']] += 1;
        } 
        else {
            dataDict[d['requested_datetime']] = 1;
        }
    })

    for (const [key, value] of Object.entries(dataDict)) {
        dataList.push({
            date: new Date(key),
            count: value
        });
      }

    //console.log(dataList);
    return dataList;
  }

  brushed(selection) {
    let vis = this;

    // Check if the brush is still active or if it has been removed
    if (selection) {
      // Convert given pixel coordinates (range: [x0,x1]) into a time period (domain: [Date, Date])
      const selectedDomain = selection.map(vis.xScaleContext.invert, vis.xScaleContext);

      // Update x-scale of the focus view accordingly
      vis.xScale.domain(selectedDomain);
    } else {
      // Reset x-scale of the focus view (full time period)
      vis.xScale.domain(vis.xScaleContext.domain());
    }

    // Redraw line and update x-axis labels in focus view
    vis.chart.selectAll(".line")
        .data([vis.timelineData])
        .join('path')
        .attr('class', 'line')
        .attr('stroke-width', 2)
        .attr('d', vis.line); 
    vis.xAxisG.call(vis.xAxis);
  }
  
}       
  