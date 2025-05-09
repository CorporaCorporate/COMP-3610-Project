const width = 800;
const height = 800;
const padding = 20;


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

const mapGroup = svg.append("g")
    .attr("transform", `translate(${padding}, ${padding})`);

const adjustedWidth = width - padding * 2;
const adjustedHeight = height - padding * 2;
const partyColors = {
    "P.N.M.": "#FF0000",
    "U.N.C.": "#FFD700"
};

const colorScales = {
    "P.N.M.": d3.interpolateRgb("#ffe5e5", "#FF0000"),   // light red → strong red
    "U.N.C.": d3.interpolateRgb("#fff8cc", "#FFD700")    // light yellow → deep gold
};

// Utility function to normalize constituency names
const normalizeName = name => name.trim().toLowerCase();

// Load constituency predictions
d3.json("/csvs/constituency_leaning_predictions.json").then(function(predictions) {
    console.log("Constituency predictions loaded:", predictions);

    // Normalize predictions keys
    const normalizedPredictions = {};
    const numRows = Object.keys(predictions.Constituency).length;
    
    for (let i = 0; i < numRows; i++) {
        const name = normalizeName(predictions.Constituency[i]);
        normalizedPredictions[name] = {
            Predicted_Winning_Party: predictions.Predicted_Winning_Party[i],
            Predicted_UNC_Vote_Share_2025: predictions.Predicted_UNC_Vote_Share_2025[i],
            Predicted_PNM_Vote_Share_2025: predictions.Predicted_PNM_Vote_Share_2025[i]
        };
    }

    // Load GeoJSON data and render the map
    d3.json("Trinidad_Constituencies_Labeled.geojson").then(function(data) {
        // console.log("GeoJSON data loaded:", data);

        // Access the features array
        const features = data.features.filter(feature => {
            const geometry = feature.geometry;
            return geometry && geometry.type && geometry.coordinates && geometry.type !== "Polygon" || geometry.coordinates[0].length > 1;
        });

        // console.log("Filtered features:", features);

        // Log constituency names for debugging
        // console.log("Constituencies in GeoJSON:", features.map(f => f.properties.constituency));
        // console.log("Constituencies in Predictions:", Object.keys(normalizedPredictions));

        // Create the projection after the GeoJSON data is loaded
        const projection = d3.geoMercator().fitSize([adjustedWidth, adjustedHeight], { type: "FeatureCollection", features });
        const path = d3.geoPath().projection(projection);

        // Render the map with constituency colors
        mapGroup.selectAll("path")
            .data(features)
            .enter()
            .append("path")
            .attr("d", d => path(d))
            .attr("fill", d => {
                const constituencyName = normalizeName(d.properties.constituency);
                const predictionData = normalizedPredictions[constituencyName];
                if (!predictionData) return "#ccc";
            
                const party = predictionData.Predicted_Winning_Party;
                const unc = predictionData.Predicted_UNC_Vote_Share_2025;
                const pnm = predictionData.Predicted_PNM_Vote_Share_2025;
                if (unc != null && pnm != null && colorScales[party]) {
                    const margin = Math.abs(unc - pnm);
                    const intensity = 1 - Math.min(margin / 0.3, 1);  // margin shading
                    return colorScales[party](intensity);
                } else if (partyColors[party]) {
                    // Safe seat fallback
                    return partyColors[party];
                } else {
                    console.warn(`Missing prediction or color for ${constituencyName}`, { party, unc, pnm });
                    return "#ccc";
                }
            
                const margin = Math.abs(unc - pnm);
                const intensity = 1 - Math.min(margin / 0.3, 1);  // closer races = lighter color (max margin ~30%)
            
                return colorScales[party](intensity);
            })
            .attr("stroke", "#fff")
            .attr("stroke-width", 1)
            .on("mouseover", function(event, d) {
                const constituencyName = normalizeName(d.properties.constituency);
                const rawName = d.properties.constituency;
                const predictionData = normalizedPredictions[constituencyName];
                console.log("Prediction data:", predictionData);
                const predictedParty = predictionData?.Predicted_Winning_Party || "Unknown";
                const uncShare = predictionData?.Predicted_UNC_Vote_Share_2025;
                const pnmShare = predictionData?.Predicted_PNM_Vote_Share_2025;
                
                let tooltipHTML = `<strong>${rawName}</strong><br>`;
                tooltipHTML += `Predicted Winner: <span style="color: ${partyColors[predictedParty] || "#666"}">${predictedParty}</span><br>`;
                tooltipHTML += `UNC Vote Share: ${uncShare != null ? (uncShare * 100).toFixed(1) + "%" : "—"}<br>`;
                tooltipHTML += `PNM Vote Share: ${pnmShare != null ? (pnmShare * 100).toFixed(1) + "%" : "—"}`;

                    d3.select(this)
                    .attr("stroke", "#000")
                    .attr("stroke-width", 2);
                    
                    d3.select("#tooltip")
                        .style("display", "block")
                        .html(tooltipHTML)
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
                const predictionData = normalizedPredictions[constituencyName];
                const party = predictionData?.Predicted_Winning_Party;
                const unc = predictionData?.Predicted_UNC_Vote_Share_2025;
                const pnm = predictionData?.Predicted_PNM_Vote_Share_2025;
            
                let color;
                if (unc != null && pnm != null && colorScales[party]) {
                    const margin = Math.abs(unc - pnm);
                    const intensity = 1 - Math.min(margin / 0.3, 1);
                    color = colorScales[party](intensity);
                } else if (partyColors[party]) {
                    color = partyColors[party];
                } else {
                    color = "#ccc";
                }
            
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
        };

        features.forEach(feature => {
            const name = normalizeName(feature.properties.constituency);
            const prediction = normalizedPredictions[name];
            const party = prediction?.Predicted_Winning_Party;
            if (seatCounts.hasOwnProperty(party)) {
                seatCounts[party]++;
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


        const listContainer = document.getElementById("constituencyList");
        features.forEach(feature => {
        const name = feature.properties.constituency;
        const normName = normalizeName(name);
        const prediction = normalizedPredictions[normName];
        const predictedParty = prediction?.Predicted_Winning_Party;
        const unc = prediction?.Predicted_UNC_Vote_Share_2025;
        const pnm = prediction?.Predicted_PNM_Vote_Share_2025;
        const margin = unc != null && pnm != null ? Math.abs(unc - pnm) : null;
        const intensity = margin != null ? 1 - Math.min(margin / 0.3, 1) : 0.5;
        const color = partyColors[predictedParty] || colorScales[predictedParty]?.(intensity) || "#ccc";
        
        const card = document.createElement("div");
        card.className = "constituencyCard";
        card.style.borderLeftColor = color;
        card.innerHTML = `<strong>${name}</strong><br>Predicted Winner: ${predictedParty || "—"}`;

        listContainer.appendChild(card);

});

    }).catch(function(error) {
        console.error("Error loading GeoJSON:", error);
    });
}).catch(function(error) {
    console.error("Error loading constituency predictions:", error);
});

document.addEventListener("DOMContentLoaded", function () {
    Papa.parse("/csvs/tt_constituency_elasticity.csv", {
      download: true,
      header: true,
      complete: function (results) {
        const allData = results.data;
        const yearSelector = document.getElementById("yearSelector");
        const container = document.getElementById("constituencyTableContainer");
  
        // Get unique years
        const uniqueYears = [...new Set(allData.map(row => row.YEAR).filter(Boolean))];
        uniqueYears.sort();
  
        // Populate dropdown
        uniqueYears.forEach(year => {
          const option = document.createElement("option");
          option.value = year;
          option.textContent = year;
          yearSelector.appendChild(option);
        });
  
        // Listen for dropdown changes
        yearSelector.addEventListener("change", () => {
          const selectedYear = yearSelector.value;
          const filteredData = allData.filter(row => row.YEAR === selectedYear);
          renderTable(filteredData);
        });
  
        // Initial render for most recent year
        if (uniqueYears.length > 0) {
          const latestYear = uniqueYears[uniqueYears.length - 1];
          yearSelector.value = latestYear;
          const initialData = allData.filter(row => row.YEAR === latestYear);
          renderTable(initialData);
        }
  
        function renderTable(data) {
          container.innerHTML = ""; // Clear previous content
          if (data.length === 0) return;
  
          const table = document.createElement("table");
  
          // Table header
          const thead = document.createElement("thead");
          const headerRow = document.createElement("tr");
          Object.keys(data[0]).forEach(key => {
            if (key !== "YEAR") {
              const th = document.createElement("th");
              th.textContent = key === "SWING_PROB" ? "SWING PROBABILITY" : key;
              headerRow.appendChild(th);
            }
          });
          thead.appendChild(headerRow);
          table.appendChild(thead);
  
          // Table body
          const tbody = document.createElement("tbody");
          data.forEach(row => {
            const tr = document.createElement("tr");
            Object.entries(row).forEach(([key, value]) => {
              if (key !== "YEAR") {
                const td = document.createElement("td");
                if (key === "INCUMBENT") {
                  td.textContent = value === "1" ? "PNM" : value === "0" ? "UNC" : value;
                } else {
                  td.textContent = value;
                }
                tr.appendChild(td);
              }
            });
            tbody.appendChild(tr);
          });
  
          table.appendChild(tbody);
          container.appendChild(table);
        }
      }
    });
  });
// Resizing logic to keep the map responsive
window.addEventListener("resize", () => {
    const container = document.getElementById("svgWrapper");
    const newWidth = container.offsetWidth;
    const newHeight = container.offsetHeight || 800;

    const adjustedWidth = newWidth - padding * 2;
    const adjustedHeight = newHeight - padding * 2;

    const projection = d3.geoMercator().fitSize([adjustedWidth, adjustedHeight], { type: "FeatureCollection", features });
    const path = d3.geoPath().projection(projection);

    mapGroup.selectAll("path")
        .attr("d", d => path(d));
});