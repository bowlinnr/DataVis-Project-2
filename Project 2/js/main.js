let data, filtered_data;

let weekdays, service_names, zipcodes, leafletMap, response_time;

d3.dsv("|","data/cincy311_cleaned_2021_bucketed.tsv")
.then(_data => {

  _data.sort(function(a, b) {
    return new Date(a['requested_datetime']) - new Date(b['requested_datetime']);
  })

  data = _data;
  filtered_data = data;

  leafletMap = new LeafletMap({ parentElement: '#map'}, data);
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
      containerWidth: 500,
    },
    data
  );


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
      containerWidth: 500
    },
    data
    );

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
    xAxisLabel: "Zipcode",
    yAxisLabel: "Number of Calls",
    title: "Calls by Zipcode",
    xAxisLambda: (d) => {
      return top_zipcodes.has(+d['zipcode']) ? Math.trunc(+d['zipcode']) : "Other"
    },
    logScale: false,
    tiltTicks: true,
    containerWidth: 500,
    no_data_key: "Other",
  },
  data
  );

  response_time = new BarChart(
    {
      parentElement: "#responsetime",
      xAxisLabel: "Response Time (days)",
      yAxisLabel: "Count",
      title: "Response Time",
      xAxisLambda: (d) => d.days_bucket,
      logScale: false,
      containerWidth: 600,
      orderedKeys: [
        "0-1",
        "1-2",
        "2-5",
        "5-10",
        "10-20",
        "21+",
      ],
    },
    data
  );

  updateAll();

  }).catch(error => console.error(error));

function filterData(xAxisLambda, value) {
  old_data = filtered_data
  filtered_data = data.filter((d) => xAxisLambda(d) == value);
  console.log(old_data)
  console.log(filtered_data)
  if (!arraysEqual(old_data, filtered_data)) {
    updateAll();
  }
}

function restoreData() {
  filtered_data = data;
  updateAll();
}

function updateAll() {
  weekdays.updateVis();
  service_names.updateVis();
  zipcodes.updateVis();
  leafletMap.updateVis();
  response_time.updateVis();
}

function arraysEqual(a, b) {
  if (a === b) return true;
  if (a == null || b == null) return false;
  if (a.length !== b.length) return false;
  for (var i = 0; i < a.length; ++i) {
    if (a[i] !== b[i]) return false;
  }
  return true;
}
