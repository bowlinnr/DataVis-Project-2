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
      .style("left", "8px")
      .style("top", "515px")
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
      var dict = {
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

      for (const [key, value] of Object.entries(dict)) {
        if (sn.toUpperCase().includes(key.toUpperCase())) {
          return dict[key];
        }
      }

      return dict["other"];
    }

    function color_by_agency(a) {
      var dict = {
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
      return dict[a]
    }

    var requestDateColorScale = d3.scaleSequential()
      .interpolator(d3.interpolateGreys) 
      .domain(d3.extent(vis.data, d => new Date(d.requested_datetime)));

    var responseTimeColorScale = d3.scaleLog()
      .range(["blue", "red"])
      .domain([1, d3.max(vis.data, d => new Date(d.updated_datetime) - new Date(d.requested_datetime))]);

    function color_by_request_date(rd) {
      return requestDateColorScale(new Date(rd));
    }

    function color_by_response_time(t) {
      var responseTime = new Date(t.updated_datetime) - new Date(t.requested_datetime);
      return responseTimeColorScale(new Date(responseTime));
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
                        .on('mouseleave', function() { //function to add mouseover event
                            d3.select(this).transition() //D3 selects the object we have moused over in order to perform operations on it
                              .duration('150') //how long we are transitioning between the two states (works like keyframes)
                              .attr("fill", d => color_by_service_name(d.service_name)) //change the fill
                              .attr('r', 3) //change radius

                            d3.select('#tooltip').style('opacity', 0);//turn off the tooltip

                          })
                        .on('click', (event, d) => { //experimental feature I was trying- click on point and then fly to it
                           // vis.newZoom = vis.theMap.getZoom()+2;
                           // if( vis.newZoom > 18)
                           //  vis.newZoom = 18; 
                           // vis.theMap.flyTo([d.latitude, d.longitude], vis.newZoom);
                          });
    
    //handler here for updating the map, as you zoom in and out           
    vis.theMap.on("zoomend", function(){
      vis.updateVis();
    });
    console.log("Ending initVis")
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