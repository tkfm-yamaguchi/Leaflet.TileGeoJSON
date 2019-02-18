# Leaflet.TileGeoJSON

[Leaflet](https://leafletjs.com) plugin for the layers of tiled GeoJSON. This is just like as [leaflet-tilelayer-gejson](https://github.com/glenrobertson/leaflet-tilelayer-geojson/) (but `clipTiles` and `unique` options are missing in this plugin), and works with Leaflet v1.4 (or above).

[Demo page](https://zeroyonichihachi.github.io/Leaflet.TileGeoJSON)


## Installation

```
$ npm install leaflet leaflet-tilegeojson
```
(NOTE: package name is all lower case and hyphen separated for the limitation of npm)

Or download the [compiled file](https://github.com/zeroyonichihachi/Leaflet.TileGeoJSON/tree/v0.1.0/dist).


## Example

See [index.html](index.html) for the usage of this plugin with the vanilla JavaScript.

Example for using as a package:
```javascript
import React, { Component } from 'react'
import L, { tileLayer } from 'leaflet';
import { tileGeoJSON } from 'leaflet-tilegeojson';


const TILE_URL_TEMPLATE =
  'http://example.com/{z}/{x}/{y}.geojson';
// see
// "Options" in https://leafletjs.com/reference-1.4.0.html#gridlayer
const TILE_GRID_OPTS = {
  minZoom: 3,
  maxNativeZoom: 18,
};
// see
// "Options" in https://leafletjs.com/reference-1.4.0.html#geojson
const TILE_GEOJSON_OPTS = {
  style: (feature, layer) => ({ weight: 2, color: '#0000FF', fillColor: '#0000FF', fill: true, fillOpacity: 0.5, clickable: true }),
  onEachFeature: (feature, layer) => layer.bindPopup(feature.properties.id)
};


export default class extends Component {
  constructor(props) {
    super(props);

    this.mapRef = React.createRef();
  }

  componentDidMount() {
    const elem = this.mapRef.current;

    const map = L.map(elem, {
      center: [35.301279, 139.481001],
      zoom: 9,
    });

    tileLayer('https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png', {
        attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors'
    }).addTo(map);

    // Add tileGeoJSON instance to map as layer
    tileGeoJSON(
      TILE_URL_TEMPLATE,
      TILE_GRID_OPTS,
      TILE_GEOJSON_OPTS
    ).addTo(map);
  })

  render() {
    return (
      <div ref={this.mapRef}></div>
    )
  }
}
```


## License

Released under BSD 2-Clause license (same as Leaflet).
