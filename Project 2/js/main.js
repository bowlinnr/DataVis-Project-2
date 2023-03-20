d3.dsv("|","data/cincy311_cleaned_reduced.tsv")
.then(data => {
  //leafletMap = new LeafletMap({ parentElement: '#my-map'}, data);
  d.latitude = +d.latitude; //make sure these are not strings
  d.longitude = +d.longitude; //make sure these are not strings

  data.sort(function(a, b) {
    return new Date(a['updated_datetime']) - new Date(b['updated_datetime']);
  })
  
  timeline = new Timeline({ parentElement: '#timeline'}, data)
  })
  .catch(error => console.error(error));
