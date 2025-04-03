const width = 1700;
const height = 700;

// Create the SVG element
const svg = d3.select("body")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Add a white background to the SVG
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#fff"); // Set the background color to white

d3.json("Trinidad_and_Tobago_Constituency_Map_(2010-present).svg-geoMercator.geojson").then(function(data) {console.log("GeoJSON data loaded:", data);

// Access the features array
// Filter out features that represent the ocean or bounding box
const features = data.features.filter(feature => {
    const geometry = feature.geometry;
    // Ensure the feature has valid geometry and exclude large bounding box-like features
    return geometry && geometry.type && geometry.coordinates && geometry.type !== "Polygon" || geometry.coordinates[0].length > 1;
});

console.log("Filtered features:", features);

// Create the projection after the GeoJSON data is loaded
const projection = d3.geoMercator().fitSize([width, height], { type: "FeatureCollection", features });

const path = d3.geoPath().projection(projection);

// Render the map
svg.selectAll("path")
    .data(features)
    .enter()
    .append("path")
    .attr("d", d => {
        console.log("Path data:", path(d));
        return path(d);
    })
    .attr("fill", "#ccc") // Fill the landmasses
    .attr("stroke", "#fff") // Add stroke for landmasses
    .attr("stroke-width", 1); // Adjust stroke width
})
.catch(function(error) {
  console.error("Error loading GeoJSON:", error);
});