class LeafletMap {

  /**
   * Class constructor with basic configuration
   * @param {Object}
   * @param {Array}
   */
  constructor(_config, _data) {
    this.config = {
      parentElement: _config.parentElement,
    }
    this.data = _data;
    this.initVis();
  }
  
  /**
   * We initialize scales/axes and append static elements, such as axis titles.
   */
  initVis() {
    let vis = this;
    console.log("Beginning initVis");


    //ESRI
    vis.esriUrl = 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}';
    vis.esriAttr = 'Tiles &copy; Esri &mdash; Source: Esri, i-cubed, USDA, USGS, AEX, GeoEye, Getmapping, Aerogrid, IGN, IGP, UPR-EGP, and the GIS User Community';

    //TOPO
    vis.topoUrl ='https://{s}.tile.opentopomap.org/{z}/{x}/{y}.png';
    vis.topoAttr = 'Map data: &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, <a href="http://viewfinderpanoramas.org">SRTM</a> | Map style: &copy; <a href="https://opentopomap.org">OpenTopoMap</a> (<a href="https://creativecommons.org/licenses/by-sa/3.0/">CC-BY-SA</a>)'

    //Thunderforest Outdoors- requires key... so meh... 
    vis.thOutUrl = 'https://{s}.tile.thunderforest.com/outdoors/{z}/{x}/{y}.png?apikey={apikey}';
    vis.thOutAttr = '&copy; <a href="http://www.thunderforest.com/">Thunderforest</a>, &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    //Stamen Terrain
    vis.stUrl = 'https://stamen-tiles-{s}.a.ssl.fastly.net/terrain/{z}/{x}/{y}{r}.{ext}';
    vis.stAttr = 'Map tiles by <a href="http://stamen.com">Stamen Design</a>, <a href="http://creativecommons.org/licenses/by/3.0">CC BY 3.0</a> &mdash; Map data &copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors';

    // Dictionary to map service names to colors
    vis.service_name_dict = {
        "metal": "#E9F00C",
        "trash": "#F01D0C",
        "building": "#F47E01",
        "default": "#8FF100",
        "grasstree": "#02E109",
        "pothole": "#00D591",
        "litter": "#00D4BD",
        "yard": "#00BFFC",
        "recycle": "#0063FC",
        "sign" : "#000087",
        "sidewalk": "#9900F7",
        "tire": "#CD8EF4",
        "animal": "#F1A8FE",
        "other": "#F900C1",
    };

    vis.agency_dict = {
        "Cin Water Works": "#E9F00C",
        "Cinc Building Dept": "#F01D0C",
        "Cinc Health Dept": "#F47E01",
        "Cincinnati Recreation": "#8FF100",
        "City Manager's Office": "#02E109",
        "Community Development": "#00D591",
        "Dept of Trans and Eng": "#00D4BD",
        "Enterprise Services": "#00BFFC",
        "Fire Department": "#0063FC",
        "Fire Dept" : "#000087",
        "Law Department": "#9900F7",
        "Metropolitan Sewer": "#CD8EF4",
        "Park Department": "#F1A8FE",
        "Police Department": "#F900C1",
        "Public Services": "#92F1A5",
        "Regional Computer Center": "#660E25",
        "Treasury Department": "#9D4F4F"
    };

    //this is the base map layer, where we are showing the map background
    vis.base_layer = L.tileLayer(vis.esriUrl, {
      id: 'esri-image',
      attribution: vis.esriAttr,
      ext: 'png'
    });

    vis.theMap = L.map('map', {
      center: [39.103119, -84.512016], //39.103119, -84.512016
      zoom: 11,
      layers: [vis.base_layer]
    });

    //if you stopped here, you would just have a map

    //initialize svg for d3 to add to map
    L.svg({clickable:true}).addTo(vis.theMap)// we have to make the svg layer clickable
    vis.overlay = d3.select(vis.theMap.getPanes().overlayPane)
    vis.svg = vis.overlay.select('svg').attr("pointer-events", "auto")

    // Map Background toggle
    vis.bckgrnd_toggle = d3.select("#map-container")
      .append("button")
      .text("Toggle Map Background")
      .style("position", "absolute")
      .style("z-index", "1000")
      .style("left", "260px")
      .style("top", "540px")
      .on('click',() => {
        if (vis.base_layer.options.id == 'esri-image') {
          vis.base_layer = L.tileLayer(vis.stUrl, {
            id: 'st-image',
            attribution: vis.stAttr,
            ext: 'png'
          });
        }
        else {
          vis.base_layer = L.tileLayer(vis.esriUrl, {
            id: 'esri-image',
            attribution: vis.esriAttr,
            ext: 'png'
          });
        }    
        vis.theMap.removeLayer(vis.theMap.options.layers[0]);
        vis.theMap.addLayer(vis.base_layer);
      });

    function color_by_service_name(sn) {
      for (const [key, value] of Object.entries(vis.service_name_dict)) {
        if (sn.toUpperCase().includes(key.toUpperCase())) {
          return vis.service_name_dict[key];
        }
      }
      return vis.service_name_dict["other"];
    }

    function color_by_agency(a) {
      return vis.agency_dict[a]
    }

    var requestDateColorScale = d3.scaleSequential()
      .interpolator(d3.interpolateGreys) 
      .domain(d3.extent(vis.data, d => new Date(d.requested_datetime)));

    // Create dictionary for request date legend
    vis.called_date_dict = {}
    let num_quantiles = 8
    for (let i = 0; i < num_quantiles; i++) {
      let timestamp = d3.quantile(vis.data, (i/(num_quantiles-1)), d => new Date(d.requested_datetime))
      let date = (new Date(timestamp)).toLocaleDateString("en-US")
      vis.called_date_dict[date] = requestDateColorScale(timestamp)
    }


    var responseTimeColorScale = d3.scaleLog()
      .range(["yellow", "yellow"])
      //.domain([1, d3.max(vis.data, d => new Date(d.updated_datetime) - new Date(d.requested_datetime))]);
      .domain([1, d3.max(vis.data, d => Math.floor(Math.abs((new Date(d.updated_datetime)) - (new Date(d.requested_datetime))) / (1000 * 60 * 60 * 24)))]);

    var responseTimeColorScale2 = d3.scaleLog()
      .range(["orange", "red"])
      //.domain([1, d3.max(vis.data, d => new Date(d.updated_datetime) - new Date(d.requested_datetime))]);
      .domain([1, d3.max(vis.data, d => Math.floor(Math.abs((new Date(d.updated_datetime)) - (new Date(d.requested_datetime))) / (1000 * 60 * 60 * 24)))]);

    function color_by_request_date(rd) {
      return requestDateColorScale(new Date(rd));
    }

    function color_by_response_time(t) {
      //var responseTime = new Date(t.updated_datetime) - new Date(t.requested_datetime);
      var responseTimeMs = Math.abs((new Date(t.updated_datetime)) - (new Date(t.requested_datetime)));
      var responseTimeDays = Math.floor(responseTimeMs / (1000 * 60 * 60 * 24));
      if(responseTimeDays == 0){
        return responseTimeColorScale(responseTimeDays);
      }
      else{
        //console.log("Dates:");
        //console.log(new Date(t.updated_datetime));
        //console.log(new Date(t.requested_datetime));
        console.log("~~~~~~~~~~~~~~~~~~~~~~~~~~~~")
        console.log("Response Time in Ms:");
        console.log(responseTimeMs)
        console.log("Response Time in Days:");
        console.log(responseTimeDays);
        return responseTimeColorScale2(responseTimeDays);
      }
      
    }

    // Create dictionary for request date legend
    vis.called_date_dict = {}
    let num_quantiles = 8
    for (let i = 0; i < num_quantiles; i++) {
      let timestamp = d3.quantile(vis.data, (i/(num_quantiles-1)), d => new Date(d.requested_datetime))
      let date = (new Date(timestamp)).toLocaleDateString("en-US")
      vis.called_date_dict[date] = requestDateColorScale(timestamp)
    }

    vis.response_time_dict = {}
    num_quantiles = 10
    for (let i = 0; i < num_quantiles; i++) {
      let num_days = Math.floor(d3.quantile(vis.data, (i/(num_quantiles-1)), d => (new Date(d.updated_datetime)) - (new Date(d.requested_datetime))) / (1000 * 60 * 60 * 24))
      if (num_days < 0) {
        continue
      }
      vis.response_time_dict[num_days] = responseTimeColorScale2(num_days)
    }

    //these are the city locations, displayed as a set of dots
    vis.Dots = vis.svg.selectAll('circle')
                    .data(vis.data) 
                    .join('circle')
                        .attr("fill", d => color_by_service_name(d.service_name)) 
                        .attr("stroke", "black")
                        //Leaflet has to take control of projecting points. Here we are feeding the latitude and longitude coordinates to
                        //leaflet so that it can project them on the coordinates of the view. Notice, we have to reverse lat and lon.
                        //Finally, the returned conversion produces an x and y point. We have to select the the desired one using .x or .y
                        
                        .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
                        .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y) 
                        .attr("r", 3)
                        .on('mouseover', function(event,d) { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                              .duration('150') //how long we are transitioning between the two states (works like keyframes)
                              .attr("fill", "red") //change the fill
                              .attr('r', 4); //change radius

                            //create a tool tip
                            d3.select('#tooltip')
                                .style('opacity', 1)
                                .style('z-index', 1000000)
                                  // Format number with million and thousand separator
                                .html(`<div class="tooltip-label">Call Date: ${d.requested_date}<br>
                                Updated Date: ${d.updated_date}<br>
                                Agency Responsible: ${d.agency_responsible}<br>
                                Type of Call: ${d.service_name}<br>
                                Descriptive Information: ${d.description}</div>`);

                          })
                        .on('mousemove', (event) => {
                            //position the tooltip
                            d3.select('#tooltip')
                             .style('left', (event.pageX + 10) + 'px')   
                              .style('top', (event.pageY + 10) + 'px');
                         })              
                        .on('mouseleave', function() {       
                          d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                            .duration('150') //how long we are transitioning between the two states (works like keyframes)
                            .attr("fill", d => color_by_service_name(d.service_name)) //change the fill
                            .attr('r', 3); //change radius
            
                          d3.select('#tooltip').style('opacity', 0);//turn off the tooltip
                        });

    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function(){
      vis.updateVis();
    });

    // Color by
    d3.select("#colorBy")
    .style("position", "absolute")
    .style("left", "250px")
    .style("top", "515px")
    .append('label')
    .text('Color By: ');

    // Create a legend
    vis.legend = L.control({ position: "topright" });

    // Function that recolors the legend when the coloring is changed
    function recolor_legend(title, dict) {
      vis.legend.remove(vis.theMap)
      vis.legend.onAdd = function(map) {
          var div = L.DomUtil.create("div", "legend");
          div.innerHTML += `<h4>${title}</h4>`;
          for (const [key, value] of Object.entries(dict)) {
            var name = key.charAt(0).toUpperCase() + key.slice(1);
            div.innerHTML += `<i style="background: ${value}"></i><span>${name}</span><br>`;
          }
          return div;
      };
      vis.legend.addTo(vis.theMap);
    }

    recolor_legend("Service Name", vis.service_name_dict)

    vis.colorBySelect = d3.select('#colorBy')
      .append('select')
      .on('change', function () {
        if (d3.select(this).property('value') == "Service Name") {
          vis.Dots
            .attr('fill', d => color_by_service_name(d.service_name))
            .on('mouseleave', function() {
              d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                .duration('150') //how long we are transitioning between the two states (works like keyframes)
                .attr("fill", d => color_by_service_name(d.service_name)) //change the fill
                .attr('r', 3); //change radius

              d3.select('#tooltip').style('opacity', 0);//turn off the tooltip
            })
          recolor_legend("Service Name", vis.service_name_dict)
        }
        else if (d3.select(this).property('value') == "Agency") {
          vis.Dots
            .attr('fill', d => color_by_agency(d.agency_responsible))
            .on('mouseleave', function() {
              d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                .duration('150') //how long we are transitioning between the two states (works like keyframes)
                .attr("fill", d => color_by_agency(d.agency_responsible)) //change the fill
                .attr('r', 3); //change radius

              d3.select('#tooltip').style('opacity', 0);//turn off the tooltip
            })
          recolor_legend("Agency", vis.agency_dict)
        }
        else if (d3.select(this).property('value') == "Called Date") {
          vis.Dots
            .attr('fill', d => color_by_request_date(d.requested_datetime))
            .on('mouseleave', function() {
              d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                .duration('150') //how long we are transitioning between the two states (works like keyframes)
                .attr("fill", d => color_by_agency(d.requested_datetime)) //change the fill
                .attr('r', 3); //change radius

              d3.select('#tooltip').style('opacity', 0);//turn off the tooltip
            })
          recolor_legend("Called Date", vis.called_date_dict)
        }
        else {
          vis.Dots
            .attr('fill', d => color_by_response_time(d))
            .on('mouseleave', function() {
              d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                .duration('150') //how long we are transitioning between the two states (works like keyframes)
                .attr("fill", d => color_by_response_time(d)) //change the fill
                .attr('r', 3); //change radius

              d3.select('#tooltip').style('opacity', 0);//turn off the tooltip
            })
          recolor_legend("Response Time (days)", vis.response_time_dict)
        }


      });
    
    var options = ["Service Name", "Agency", "Called Date", "Response Time"]
    vis.colorBySelect.selectAll('option')
      .data(options)
      .enter()
      .append('option')
      .text(d => d);
  }

  updateVis() {
    let vis = this;
    console.log("Beginning updateVis.")

    //want to see how zoomed in you are? 
    // console.log(vis.map.getZoom()); //how zoomed am I
    
    //want to control the size of the radius to be a certain number of meters? 
    vis.radiusSize = 3; 

    // if( vis.theMap.getZoom > 15 ){
    //   metresPerPixel = 40075016.686 * Math.abs(Math.cos(map.getCenter().lat * Math.PI/180)) / Math.pow(2, map.getZoom()+8);
    //   desiredMetersForPoint = 100; //or the uncertainty measure... =) 
    //   radiusSize = desiredMetersForPoint / metresPerPixel;
    // }
   
   //redraw based on new zoom- need to recalculate on-screen position
    vis.Dots
      .attr("cx", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).x)
      .attr("cy", d => vis.theMap.latLngToLayerPoint([d.latitude,d.longitude]).y) 
      .attr("r", vis.radiusSize);
    console.log("Ending updateVis");
  }


  renderVis() {
    let vis = this;
    console.log("Calling renderVis")

    //not using right now... 
 
  }
}
