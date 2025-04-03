const width = 800;
const height = 600;

const svg = d3.select("body")
              .append("svg")
              .attr("width", width)
              .attr("height", height);

const projection = d3.geoMercator()
                     .fitSize([width, height], geojsonData);

const path = d3.geoPath().projection(projection);

d3.json("Trinidad_and_Tobago_Constituency_Map_(2010-present).geojson").then(function(data) {
  svg.selectAll("path")
     .data(data.features)
     .enter()
     .append("path")
     .attr("d", path)
     .attr("fill", "#ccc")
     .attr("stroke", "#333");
});