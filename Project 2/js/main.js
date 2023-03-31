

d3.dsv("|","data/cincy311_cleaned_2021.tsv")
.then(data => {
  leafletMap = new LeafletMap({ parentElement: '#map'}, data);

  data.sort(function(a, b) {
    return new Date(a['requested_datetime']) - new Date(b['requested_datetime']);
  })
  
  timeline = new Timeline({ parentElement: '#timeline'}, data)

  // Translate number to day
  let day_to_text = {
    0: "Sunday",
    1: "Monday",
    2: "Tuesday",
    3: "Wednesday",
    4: "Thursday",
    5: "Friday",
    6: "Saturday",
  };

  // Bar chart to show which day of the week each call was made
  weekdays = new BarChart(
    {
      parentElement: "#weekdays",
      xAxisLabel: "Day of the Week",
      yAxisLabel: "Number of Calls",
      title: "Calls by Day",
      xAxisLambda: (d) => {
        return day_to_text[(new Date(d.requested_datetime)).getDay()]
      },
      logScale: false,
      orderedKeys: Object.values(day_to_text),
      containerWidth: 480,
    },
    data
  );
  weekdays.updateVis();


    // Dictionary to map colors to service names
    let service_name_colors = {
      "Metal": "#E9F00C",
      "Trash": "#F01D0C",
      "Building": "#F47E01",
      "Default": "#8FF100",
      "Grasstree": "#02E109",
      "Pothole": "#00D591",
      "Litter": "#00D4BD",
      "Yard": "#00BFFC",
      "Recycle": "#0063FC",
      "Sign" : "#000087",
      "Sidewalk": "#9900F7",
      "Tire": "#CD8EF4",
      "Animal": "#F1A8FE",
      "Other": "#F900C1",
  };

    // Bar chart for displaying zipcodes
    service_names = new BarChart({
      parentElement: "#servicenames",
      xAxisLabel: "Service Name",
      yAxisLabel: "Number of Calls",
      title: "Calls by Service Name",
      xAxisLambda: (d) => {
        for (const [key, value] of Object.entries(service_name_colors)) {
          if (d.service_name.toUpperCase().includes(key.toUpperCase())) {
            return key;
          }
        }
        return "Other";
        },
      fillLambda: (d) => {
        return service_name_colors[d.key];
      },
      logScale: false,
      tiltTicks: true,
      containerWidth: 660
    },
    data
    );
    service_names.updateVis();
  

  }).catch(error => console.error(error));
