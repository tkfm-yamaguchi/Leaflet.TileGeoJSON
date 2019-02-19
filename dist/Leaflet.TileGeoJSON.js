(function (exports, L) {
  'use strict';

  L = L && L.hasOwnProperty('default') ? L['default'] : L;

  function createTileState({layer, coords, current, loadState}) {
    return {
      layer: layer || null,
      coords: coords || null,
      current: current || false,
      loadState: loadState || null,
    };
  }

  const TileGeoJSON = L.GridLayer.extend({
    initialize: function(url, options, geojsonOptions) {
      L.Util.setOptions(this, options);

      this._url = url;
      this._geojsonLayer = L.geoJSON(null, geojsonOptions);
    },

    onAdd: function() {
      this._map.addLayer(this._geojsonLayer);
      this._tiles = {};
      this._resetView();
    },

    onRemove: function(map) {
      this._invalidateAll();

      this._map.removeLayer(this._geojsonLayer);
      delete this._geojsonLayer;
    },

    redraw: function() {
      this._invalidateAll();
      this._resetView();
    },

    setURL: function(url) {
      this._url = url;
    },

    setGeoJSONOptions: function(geojsonOptions) {
      this._geojsonLayer.options = geojsonOptions;
    },

    _invalidateAll: function() {
      this._geojsonLayer.clearLayers();
      this._tileZoom = undefined;

      delete this._tiles;
      this._tiles = {};
    },

    _setView: function (center, zoom, noPrune, noUpdate) {
      let tileZoom = this._clampZoom(Math.round(zoom));

      if ((this.options.maxZoom !== undefined && tileZoom > this.options.maxZoom) ||
        (this.options.minZoom !== undefined && tileZoom < this.options.minZoom)) {
        tileZoom = undefined;
      }

      var tileZoomChanged = this.options.updateWhenZooming && (tileZoom !== this._tileZoom);

      if (!noUpdate || tileZoomChanged) {
        this._invalidateAll();

        this._tileZoom = tileZoom;
        this._resetGrid();

        if (tileZoom !== undefined) {
          this._update(center);
        }
      }
    },

    _update: function(center) {
      const map = this._map;
      if (!map) { return; }

      const zoom = this._clampZoom(map.getZoom());

      if (center === undefined) { center = map.getCenter(); }
      if (this._tileZoom === undefined) { return; }   // if out of minzoom/maxzoom

      const pixelBounds = this._getTiledPixelBounds(center);
      const tileRange = this._pxBoundsToTileRange(pixelBounds);
      const tileCenter = tileRange.getCenter();
      const queue = [];
      const margin = this.options.keepBuffer;
      const noPruneRange = new L.Bounds(
        tileRange.getBottomLeft().subtract([margin, -margin]),
        tileRange.getTopRight().add([margin, -margin])
      );

      // Sanity check: panic if the tile range contains Infinity somewhere.
      if (!(isFinite(tileRange.min.x) &&
        isFinite(tileRange.min.y) &&
        isFinite(tileRange.max.x) &&
        isFinite(tileRange.max.y))) { throw new Error('Attempted to load an infinite number of tiles'); }

      // reset flags for tiles pruning
      for (var key in this._tiles) {
        var c = this._tiles[key].coords;

        if (!c) continue;

        if (c.z !== this._tileZoom || !noPruneRange.contains(new L.Point(c.x, c.y))) {
          this._tiles[key].current = false;
        }
      }

      // _update just loads more tiles. If the tile zoom level differs too much
      // from the map's, let _setView reset levels and prune old tiles.
      if (Math.abs(zoom - this._tileZoom) > 1) { this._setView(center, zoom); return; }

      // create a queue of coordinates to load tiles from
      for (var j = tileRange.min.y; j <= tileRange.max.y; j++) {
        for (var i = tileRange.min.x; i <= tileRange.max.x; i++) {
          var coords = new L.Point(i, j);
          coords.z = this._tileZoom;

          if (!this._isValidTile(coords)) { continue; }

          const key = this._tileCoordsToKey(coords);
          const tile = this._tiles[key];
          if (tile) {
            tile.current = true;
          } else {
            this._tiles[key] = createTileState({loadState: 'loading'});
            queue.push(coords);
          }
        }
      }

      // sort tile queue to load tiles in order of their distance to center
      queue.sort((a, b) => a.distanceTo(tileCenter) - b.distanceTo(tileCenter));

      if (queue.length !== 0) {
        // if it's the first batch of tiles to load
        if (!this._loading) {
          this._loading = true;
        }

        Promise
          .all(queue.map(item => this._addTile(item)))
          .then(() => this._pruneTiles());
      }
    },

    _addTile: async function(coords) {
      const key = this._tileCoordsToKey(coords);
      const tileURL = L.Util.template(this._url, coords);

      const response = await fetch(tileURL);
      if (!response.ok) {
        this._tiles[key] = createTileState({loadState: 'failed'});
        return;
      }

      const data = await response.json();
      const layer = L.geoJSON(data, this._geojsonLayer.options);

      if (this._tileZoom !== coords.z) {
        // cancel when the zoom level is changed while downloading the data.
        return;
      }

      this._geojsonLayer.addLayer(layer);
      this._tiles[key] = createTileState({
        layer,
        coords,
        current: true,
        loadState: 'loaded',
      });
    },

    _pruneTiles: function() {
      const keys = Object.keys(this._tiles);

      for (let i = 0; i < keys.length; i++) {
        const key = keys[i];
        const tileState = this._tiles[key];

        if (tileState && !tileState.current) {
          this._geojsonLayer.removeLayer(tileState.layer);
          delete this._tiles[key];
        }
      }
    },

    /* inherits */
    // beforeAdd
    // isLoading
    // getEvents (NOTE: '_resetView' is called from some events)
    // getTileSize
    // _resetView
    // _clampZoom
    // _resetGrid
    // _onMoveEnd
    // _getTiledPixelBounds
    // _isValidTile
    // _keyToBounds
    // _isValidTile
    // _keyToBounds
    // _tileCoordsToNwSe
    // _tileCoordsToBounds
    // _tileCoordsToKey
    // _keyToTileCoords
    // _warpCoords
    // _pxBoundsToTileRange


    /* disabled */
    bringToFront: L.Util.falseFn,
    bringToBack: L.Util.falseFn,
    getContainer: L.Util.falseFn,
    setOpacity: L.Util.falseFn,
    setZIndex: L.Util.falseFn,
    createTile: L.Util.falseFn,
    _updateZIndex:L.Util.falseFn,
    _setAutoZIndex: L.Util.falseFn,
    _updateOpacity: L.Util.falseFn,
    _onOpaqueTile: L.Util.falseFn,
    _initContainer: L.Util.falseFn,
    _updateLevels: L.Util.falseFn,
    _onUpdateLevel: L.Util.falseFn,
    _onRemoveLevel: L.Util.falseFn,
    _onCreateLevel: L.Util.falseFn,
    _retainParent: L.Util.falseFn,
    _retainChildren: L.Util.falseFn,
    _animateZoom: L.Util.falseFn,
    _initTile: L.Util.falseFn,
    _removeTile: L.Util.falseFn,
    _removeTilesAtZoom: L.Util.falseFn,
    _removeAllTiles: L.Util.falseFn,
    _setZoomTransforms: L.Util.falseFn,
    _setZoomTransform: L.Util.falseFn,
    _tileReady: L.Util.falseFn,
    _getTilePos: L.Util.falseFn,
    _noTilesToLoad: L.Util.falseFn,
  });

  const tileGeoJSON = (url, options, geojsonOptions) => {
    return new TileGeoJSON(url, options, geojsonOptions);
  };

  exports.TileGeoJSON = TileGeoJSON;
  exports.tileGeoJSON = tileGeoJSON;


  if (typeof window.L !== 'undefined') {
    Object.keys(exports).forEach(key => {
      if (exports.hasOwnProperty(key)) {
        window.L[key] = exports[key];
      }
    });
  }


}(this['leaflet-tilegeojson'] = this['leaflet-tilegeojson'] || {}, L));
//# sourceMappingURL=Leaflet.TileGeoJSON.js.map
