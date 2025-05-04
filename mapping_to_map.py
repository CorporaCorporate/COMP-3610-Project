import geopandas as gpd
import pandas as pd
import folium

# Load GeoJSON file
geo_path = "D:\UWI\Year 3\Sem 2\COMP3610-Big-Data\Project\Project Clone 2\COMP-3610-Project\Visualisation\Trinidad_and_Tobago_Constituency_Map_(2010-present).svg-geoMercator.geojson"
gdf = gpd.read_file(geo_path)

# Load Constituency file 
data = pd.read_json(r"D:\UWI\Year 3\Sem 2\COMP3610-Big-Data\Project\Project Clone 2\COMP-3610-Project\constituency_leaning_predictions.json")

gdf.columns 

merged = gdf.merge(data, left_on="Name", right_on="Constituency", how="left")

# Map party names to colors
party_colors = {"PNM": "red", "UNC": "yellow"}
merged["color"] = merged["Predicted_Winner"].map(party_colors).fillna("lightgray")  # Default color if missing

# Create interactive map
m = folium.Map(location=[10.5, -61.3], zoom_start=9)

folium.GeoJson(
    merged,
    style_function=lambda feature: {
        'fillColor': feature['properties']['color'],
        'color': 'black',
        'weight': 1,
        'fillOpacity': 0.6,
    },
    tooltip=folium.GeoJsonTooltip(fields=["Name", "Predicted_Winner"])
).add_to(m)

# Save to HTML
m.save("trinidad_predictions_map.html")
