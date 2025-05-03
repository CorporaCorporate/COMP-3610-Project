const width = 1500;
const height = 800;

// Add this at the top of your D3 script
const tooltip = d3.select("#tooltip");

// Create SVG element
const svg = d3.select("#svgWrapper")
    .append("svg")
    .attr("viewBox", `0 0 ${width} ${height}`)
    .attr("preserveAspectRatio", "xMidYMid meet")
    .classed("responsive-svg", true);

// Background of SVG
svg.append("rect")
    .attr("width", width)
    .attr("height", height)
    .attr("fill", "#fff"); 

// Define party colors
const partyColors = {
    "P.N.M.": "#FF0000",
    "U.N.C.": "#FFD700", 
    "UNKNOWN": "#FFF"   
};


window.addEventListener("resize", () => {
    const container = document.getElementById("svgWrapper");
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight || 800;

    projection.fitSize([newWidth, newHeight], { type: "FeatureCollection", features });
    path.projection(projection);

    svg.selectAll("path")
        .attr("d", path);
});

// Utility function to normalize constituency names
const normalizeName = name => name.trim().toLowerCase();

// Load constituency predictions
d3.json("constituency_leaning_predictions.json").then(function(predictions) {
    console.log("Constituency predictions loaded:", predictions);

    // Normalize predictions keys
    const normalizedPredictions = {};
    Object.keys(predictions).forEach(key => {
        normalizedPredictions[normalizeName(key)] = predictions[key];
    });

    // Load GeoJSON data and render the map
    d3.json("Trinidad_Constituencies_Labeled.geojson").then(function(data) {
        console.log("GeoJSON data loaded:", data);

        // Access the features array
        const features = data.features.filter(feature => {
            const geometry = feature.geometry;
            return geometry && geometry.type && geometry.coordinates && geometry.type !== "Polygon" || geometry.coordinates[0].length > 1;
        });

        console.log("Filtered features:", features);

        // Log constituency names for debugging
        console.log("Constituencies in GeoJSON:", features.map(f => f.properties.constituency));
        console.log("Constituencies in Predictions:", Object.keys(normalizedPredictions));

        // Create the projection after the GeoJSON data is loaded
        const projection = d3.geoMercator().fitSize([width, height], { type: "FeatureCollection", features });
        const path = d3.geoPath().projection(projection);

        // Render the map with constituency colors
        svg.selectAll("path")
        .data(features)
        .enter()
        .append("path")
        .attr("d", d => path(d))
        .attr("fill", d => {
          const constituencyName = normalizeName(d.properties.constituency);
          const predictedParty = normalizedPredictions[constituencyName];
          return partyColors[predictedParty] || partyColors["Other"];
        })
        .attr("stroke", "#fff")
        .attr("stroke-width", 1)
        .on("mouseover", function(event, d) {
          const constituencyName = normalizeName(d.properties.constituency);
          const rawName = d.properties.constituency;
          const predictedParty = normalizedPredictions[constituencyName] || "UNKNOWN";
      
          d3.select(this)
            .attr("stroke", "#000")
            .attr("stroke-width", 2);
      
          d3.select("#tooltip")
            .style("display", "block")
            .html(`<strong>${rawName}</strong><br>Winner: ${predictedParty}`)
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mousemove", function(event) {
          d3.select("#tooltip")
            .style("left", `${event.pageX + 10}px`)
            .style("top", `${event.pageY - 28}px`);
        })
        .on("mouseout", function(event, d) {
          const constituencyName = normalizeName(d.properties.constituency);
          const predictedParty = normalizedPredictions[constituencyName];
          const color = partyColors[predictedParty] || partyColors["Other"];
      
          d3.select(this)
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .attr("fill", color);
      
          d3.select("#tooltip").style("display", "none");
        });



        // Count seats
        let seatCounts = {
            "P.N.M.": 0,
            "U.N.C.": 0,
            "UNKNOWN": 0
        };

        features.forEach(feature => {
            const name = normalizeName(feature.properties.constituency);
            const party = normalizedPredictions[name];
            if (seatCounts.hasOwnProperty(party)) {
                seatCounts[party]++;
            } else {
                seatCounts["UNKNOWN"]++;
            }
        });

        // Update DOM
        document.getElementById("pnmCount").textContent = seatCounts["P.N.M."];
        document.getElementById("uncCount").textContent = seatCounts["U.N.C."];
        // document.getElementById("unknownCount").textContent = seatCounts["UNKNOWN"];

        const totalSeats = 41;
        const pnmPct = (seatCounts["P.N.M."] / totalSeats) * 100;
        const uncPct = (seatCounts["U.N.C."] / totalSeats) * 100;

        d3.select("#pnmBar").style("width", `${pnmPct}%`);
        d3.select("#uncBar").style("width", `${uncPct}%`);


    }).catch(function(error) {
        console.error("Error loading GeoJSON:", error);
    });
}).catch(function(error) {
    console.error("Error loading constituency predictions:", error);
});

