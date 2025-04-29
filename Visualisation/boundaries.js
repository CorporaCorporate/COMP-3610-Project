const width = 1500;
const height = 800;

// Create SVG element
const svg = d3.select("#svgWrapper")
    .append("svg")
    .attr("width", width)
    .attr("height", height);

// Background of SVG
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#fff"); // Set the background color to white

// Load GeoJSON data and render  map
d3.json("Trinidad_and_Tobago_Constituency_Map_(2010-present).svg-geoMercator.geojson").then(function(data) {
    console.log("GeoJSON data loaded:", data);

    // Access the features array
    const features = data.features.filter(feature => {
        const geometry = feature.geometry;
        return geometry && geometry.type && geometry.coordinates && geometry.type !== "Polygon" || geometry.coordinates[0].length > 1;
    });

    console.log("Filtered features:", features);

    // Create the projection after the GeoJSON data is loaded
    const projection = d3.geoMercator().fitSize([width, height], { type: "FeatureCollection", features });
    const path = d3.geoPath().projection(projection);

    // Render the map with interactivity
    svg.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", d => {
            console.log("Path data:", path(d));
            return path(d);
        })
        .attr("fill", "#ccc") 
        .attr("stroke", "#fff") 
        .attr("stroke-width", 1) 
        .on("mouseover", function(event, d) {
            // Highlight  region only if it doesn't already have a custom color
            if (d3.select(this).attr("fill") === "#ccc") {
                d3.select(this).attr("fill", "#809c13");
            }
        })
        .on("mouseout", function(event, d) {
            // Revert to the default color only if it doesn't already have a custom color
            if (d3.select(this).attr("fill") === "#809c13") {
                d3.select(this).attr("fill", "#ccc");
            }
        })
        .on("click", function(event, d) {
            // Get the selected color from the dropdown
            const color = document.getElementById("colorPicker").value;
            // Apply the selected color to the clicked region
            d3.select(this).attr("fill", color);
        });

    // Add functionality to clear all colors
    document.getElementById("clearButton").addEventListener("click", function() {
        svg.selectAll("path").attr("fill", "#ccc");
    });
}).catch(function(error) {
    console.error("Error loading GeoJSON:", error);
});