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

  }).catch(error => console.error(error));
