import { GridLayer, GridLayerOptions, GeoJSON, GeoJSONOptions } from 'leaflet';

declare class TileGeoJSON extends GridLayer {
  public redraw: () => this;
  public setURL: (url: string) => void;
  public setGeoJSONOptions: (geojsonOptions: GeoJSONOptions) => void;
}

declare function tileGeoJSON(
  url: string,
  options?: GridLayerOptions,
  geojsonOptions?: GeoJSONOptions,
): TileGeoJSON;
