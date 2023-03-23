d3.dsv("|","data/cincy311_cleaned.tsv")
.then(data => {
  leafletMap = new LeafletMap({ parentElement: '#map'}, data);

  data.sort(function(a, b) {
    return new Date(a['updated_datetime']) - new Date(b['updated_datetime']);
  })
  
  timeline = new Timeline({ parentElement: '#timeline'}, data)
  })
  .catch(error => console.error(error));
