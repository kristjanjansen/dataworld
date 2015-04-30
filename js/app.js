// Utility function

function area2radius(area) {
  return Math.sqrt(area / Math.PI);
}


// Set up up the datastore

var finalData = {}
finalData.data = {}
finalData.tables = []


// Fetch the index file

$.ajaxSetup({async: false, cache: false})

$.get('./data/index.yml', function(index) {
    
  index = yaml.load(index)

  // Fetch the datafiles and join them with the master datafile

  index.data.forEach(function(i) {
    i.table = i.file.replace('.csv', '')
    $.get('/data/' + i.file, function(data) {
      if (!i.master) {
        i.multiplier = i.multiplier ? i.multiplier : 1
        i.add = i.add ? i.add : 0
        finalData.tables.push(i)
      } else {
        finalData.master = i.table
      }
      var data = Papa.parse(data, {header: true}).data
      data.forEach(function(row) {
        for (var key in row) {
          if (!finalData.data[row.country]) {
            finalData.data[row.country] = {}
          }
          if (!finalData.data[row.country][i.table]) {
            finalData.data[row.country][i.table] = {}
          }
          finalData.data[row.country][i.table][key] = row[key]
        }
      })
    })
  })

})


// Go through the datastore and set up the bubbles

var bubbles = []

for (var key in finalData.data) {

  var data = finalData.data[key]

  finalData.tables.forEach(function(tbl) {

  if (data[tbl.table] && data[tbl.table][tbl.value] && data.countries) {

      var latitude = data.countries.lat 
      var longitude = data.countries.lng
      var radius = area2radius(data[tbl.table][tbl.value] * tbl.multiplier) + tbl.add
      var display = tbl.display ? data[tbl.table][tbl.display] : ''
      var fillKey = tbl.table ? tbl.table : null;
      var fillOpacity = tbl.opacity ? tbl.opacity : 0.1
      var borderWidth = tbl.border ? 1 : 0

      var bubble = {
        latitude: latitude,
        longitude: longitude,
        name: tbl.table, 
        radius: radius,
        display: display,
        fillKey: fillKey,
        borderWidth: borderWidth,
        borderColor: 'rgba(1,1,1,0.1)',
        fillOpacity: fillOpacity
      }
      bubbles.push(bubble)
    
    }

  })

}


// Set up bubble fills

var fills = {defaultFill: '#eee'}

finalData.tables.forEach(function(tbl) {
  fills[tbl.table] = tbl.color
})


// Build the map

var zoom = new Datamap({
  element: document.getElementById("container"),
  scope: 'world',
  setProjection: function(element) {
    var projection = d3.geo.equirectangular()
      .center([50, 15])
      .rotate([4.4, 0])
      .scale(400)
      .translate([element.offsetWidth / 2, element.offsetHeight / 2]);
    var path = d3.geo.path()
      .projection(projection);
    return {path: path, projection: projection}
  },
  geographyConfig: {
    highlightFillColor: '#e8e8e8',
    highlightBorderWidth: 0
},
  fills: fills,
});

zoom.bubbles(bubbles, {
   popupTemplate: function(geo, data) { return "<div class='hoverinfo'>" + data.name + ': ' + data.display + "</div>"},
   highlightFillColor: 'rgb(0,0,0)',
   highlightFillOpacity: 0.05,
   highlightBorderColor: 'rgba(0, 0, 0, 0.1)',
   highlightBorderWidth: 1,
});

