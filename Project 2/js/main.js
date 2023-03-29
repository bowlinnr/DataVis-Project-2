d3.dsv("|","data/cincy311_cleaned_2021.tsv")
.then(data => {
  leafletMap = new LeafletMap({ parentElement: '#map'}, data);

  data.sort(function(a, b) {
    return new Date(a['requested_datetime']) - new Date(b['requested_datetime']);
  })
  
  timeline = new Timeline({ parentElement: '#timeline'}, data)
  })
  .catch(error => console.error(error));


  let selectedOption;
        
  function updateVariable() {
    selectedOption = document.getElementById("colorBy").value;
    console.log("Selected option: " + selectedOption);
  } 
