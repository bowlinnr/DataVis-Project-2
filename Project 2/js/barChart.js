class BarChart {
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
      containerWidth: _config.containerWidth || 300,
      containerHeight: _config.containerHeight || 350,
      margin: _config.margin || { top: 60, bottom: 50, right: 20, left: 70 },
    };
    this.xAxisLabel = _config.xAxisLabel;
    this.yAxisLabel = _config.yAxisLabel;
    this.title = _config.title;
    this.xAxisLambda = _config.xAxisLambda;
    this.logScale = _config.logScale;
    this.orderedKeys = _config.orderedKeys || [];
    this.tiltTicks = _config.tiltTicks;
    this.data = _data;
    this.no_data_key = _config.no_data_key || "No Data";

    this.initVis();
  }

  initVis() {
    let vis = this;

    // Adjust width and height to handle margins
    vis.width =
      vis.config.containerWidth -
      vis.config.margin.left -
      vis.config.margin.right;
    vis.height =
      vis.config.containerHeight -
      vis.config.margin.top -
      vis.config.margin.bottom;

    // Create our scales
    vis.xScale = d3.scaleBand().range([0, vis.width]).paddingInner(0.2);

    if (vis.logScale) {
      vis.yScale = d3.scaleLog().range([vis.height, 0]);
    } else {
      vis.yScale = d3.scaleLinear().range([vis.height, 0]);
    }

    // Create the axes

    if (vis.tiltTicks) {
      vis.xAxis = (svg) =>
        svg
          .call(d3.axisBottom(vis.xScale).tickSizeOuter(0))
          .call((g) =>
            g
              .selectAll(".tick text")
              .style("text-anchor", "end")
              .attr("dx", "-.8em")
              .attr("dy", "-.15em")
              .attr("transform", "rotate(-40)")
          );
    } else {
      vis.xAxis = d3.axisBottom(vis.xScale).tickSizeOuter(0);
    }

    vis.yAxis = d3.axisLeft(vis.yScale).ticks(10, ",.0f").tickSizeOuter(0);

    // Create the SVG
    vis.svg = d3
      .select(vis.config.parentElement)
      .attr("width", vis.config.containerWidth)
      .attr("height", vis.config.containerHeight);

    // Add the axes to the SVG
    vis.chart = vis.svg
      .append("g")
      .attr(
        "transform",
        `translate(${vis.config.margin.left}, ${vis.config.margin.top})`
      );

    vis.xAxisGroup = vis.chart
      .append("g")
      .attr("class", "axis x-axis")
      .attr("transform", `translate(0,${vis.height})`);

    vis.yAxisGroup = vis.chart.append("g").attr("class", "axis y-axis");

    vis.svg
      .append("text")
      .attr("class", "x label")
      .attr("text-anchor", "middle")
      .attr("x", vis.width * 0.5 + vis.config.margin.left)
      .attr("y", vis.config.containerHeight - 4)
      .text(vis.xAxisLabel);

    vis.svg
      .append("text")
      .attr("class", "y label")
      .attr("text-anchor", "middle")
      .attr("x", -vis.height * 0.5 - vis.config.margin.top)
      .attr("y", 10)
      .attr("dy", ".75em")
      .attr("transform", "rotate(-90)")
      .text(vis.yAxisLabel);

    vis.svg
      .append("text")
      //.attr("transform", "translate(0,-70)")
      .attr("x", vis.width/2 + vis.config.margin.left)
      .attr("y", 50)
      .attr("font-size", "15px")
      .attr("font-weight", "bold")
      .attr("text-anchor", "middle")
      .text(vis.title);
  }

  updateVis() {
    let vis = this;

    const aggregatedDataMap = d3.rollups(
      vis.data,
      (v) => v.length,
      vis.xAxisLambda
    );
    vis.aggregatedData = Array.from(aggregatedDataMap, ([key, count]) => ({
      key,
      count,
    }));

    if (vis.orderedKeys.length == 0) {
      vis.aggregatedData = vis.aggregatedData.sort((a, b) => {
        if (a.key == vis.no_data_key) {
          return 1;
        }
        if (b.key == vis.no_data_key) {
          return -1;
        }
        return b.count - a.count;
      });
    } else {
      vis.aggregatedData = vis.aggregatedData.sort((a, b) => {
        return vis.orderedKeys.indexOf(a.key) - vis.orderedKeys.indexOf(b.key);
      });
    }

    vis.xValue = (d) => d.key;
    vis.yValue = (d) => d.count;

    vis.xScale.domain(vis.aggregatedData.map(vis.xValue));
    if (vis.logScale) {
      vis.yScale.domain([1, d3.max(vis.aggregatedData, vis.yValue)]);
    } else {
      vis.yScale.domain([0, d3.max(vis.aggregatedData, vis.yValue)]);
    }

    vis.renderVis();
  }

  renderVis() {
    let vis = this;

    vis.bars = vis.chart
      .selectAll(".bar")
      .data(vis.aggregatedData, vis.xValue)
      .join("rect");

    vis.bars
      .on("mouseover", (event, d) => {
        d3.select("#barchart-tooltip").style("display", "block");
      })
      .on("mousemove", (event, d) => {
        d3.select("#barchart-tooltip")
          .style("left", event.pageX + 15 + "px")
          .style("top", event.pageY + 15 + "px")
          .html(`Value: ${vis.yValue(d)}`);
      })
      .on("mouseleave", () => {
        d3.select("#barchart-tooltip").style("display", "none");
      })
      .on("click", function (event, d) {
        d3.select(this).classed("active", true);
        //filterData(vis.xAxisLambda, vis.xValue(d));
      });

    vis.bars
      .transition()
      .duration(1000)
      .attr("class", "bar")
      .attr("x", (d) => vis.xScale(vis.xValue(d)))
      .attr("width", vis.xScale.bandwidth())
      .attr("height", (d) => vis.height - vis.yScale(vis.yValue(d)))
      .attr("y", (d) => vis.yScale(vis.yValue(d)))
      .attr("fill", "#4682B4");

    vis.xAxisGroup.call(vis.xAxis);
    vis.yAxisGroup.call(vis.yAxis);
  }
}
