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


  // Zipcode set to determine which zipcodes are just Cincinnati
  let top_zipcodes = new Set([
    45205,
    45211,
    45202,
    45238,
    45237,
    45208,
    45219,
    45229,
    45223,
    45224,
    45214,
    45206,
    45204,
    45227,
    45213,
    45220,
    45225,
    45230,
    45216,
    45209,
    45207,
    45226
  ]);

  // Bar chart for displaying zipcodes
  zipcodes = new BarChart({
    parentElement: "#zipcodes",
    xAxisLabel: "Zipcodes",
    yAxisLabel: "Number of Calls",
    title: "Calls by Zipcode",
    xAxisLambda: (d) => {
      return top_zipcodes.has(+d['zipcode']) ? Math.trunc(+d['zipcode']) : "other" 
    },
    logScale: false,
    tiltTicks: true,
    containerWidth: 660
  },
  data
  );
  zipcodes.updateVis();

  }).catch(error => console.error(error));
