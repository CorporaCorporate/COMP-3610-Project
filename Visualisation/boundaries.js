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
    .attr("fill", "#fff"); 

// Define party colors
const partyColors = {
    "P.N.M.": "#FF0000",
    "U.N.C.": "#FFFF00", 
    "Other": "#CCCCCC"   
};

// Load constituency predictions
d3.json("constituency_leaning_predictions.json").then(function(predictions) {
    console.log("Constituency predictions loaded:", predictions);

    // Load GeoJSON data and render the map
    d3.json("Trinidad_Constituencies_Labeled.geojson").then(function(data) {
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

        // Render the map with constituency colors
        svg.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", d => {
                return path(d);
            })
            .attr("fill", d => {
                const constituencyName = d.properties.constituency;
                const predictedParty = predictions[constituencyName];
                console.log( "Party Colours", partyColors[predictedParty] || partyColors["Other"])
                return partyColors[predictedParty] || partyColors["Other"]; // Default to gray if no prediction is found
            })

            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                const constituencyName = d.properties.constituency;
                const predictedParty = predictions[constituencyName];
                if (d3.select(this).attr("fill") === partyColors["Other"]) {
                    d3.select(this).attr("fill", partyColors[predictedParty] || partyColors["Other"]);
                }
            })
            .on("mouseout", function(event, d) {
                if (d3.select(this).attr("fill") === "#809c13") {
                    const constituencyName = d.properties.constituency; 
                    const predictedParty = predictions[constituencyName];
                    d3.select(this).attr("fill", partyColors[predictedParty] || partyColors["Other"]);
                }
            })
        //     .on("click", function(event, d) {
        //         const color = document.getElementById("colorPicker").value;
        //         d3.select(this).attr("fill", color);
        //     }
        // );

        // Clear all colors
        document.getElementById("clearButton").addEventListener("click", function() {
            svg.selectAll("path").attr("fill", partyColors["Other"]);
        });
    }).catch(function(error) {
        console.error("Error loading GeoJSON:", error);
    });
}).catch(function(error) {
    console.error("Error loading constituency predictions:", error);
});
