import jsonld from 'jsonld';
var RoutableTilesToGeoJSON = require('./RoutableTilesToGeoJSON');

/*
 * 🍂class VectorGrid.RoutableTiles
 * 🍂extends VectorGrid
 *
 * A `VectorGrid` for routable tiles fetched from the internet.
 * Tiles are supposed to be json-ld documents
 * containing data which complies with the
 * [Routable Tiles Specification](https://github.com/openplannerteam/website/pull/2).
 *
 * This is the format used by the [Open Planner Team](https://openplanner.team)
 *
 * 🍂example
 *
 * You must initialize a `VectorGrid.RoutableTiles` with a URL template, just like in
 * `L.TileLayer`s. The difference is that the template must point to routable tiles
 * instead of raster (`.png` or `.jpg`) tiles, and that
 * you should define the styling for all the features.
 *
 */
L.VectorGrid.RoutableTiles = L.VectorGrid.extend({

    options: {
        // 🍂section
        // As with `L.TileLayer`, the URL template might contain a reference to
        // any option (see the example above and note the `{key}` or `token` in the URL
        // template, and the corresponding option).
        //
        // 🍂option subdomains: String = 'abc'
        // Akin to the `subdomains` option for `L.TileLayer`.
        subdomains: 'abc',	// Like L.TileLayer
        //
        // 🍂option fetchOptions: Object = {}
        // options passed to `fetch`, e.g. {credentials: 'same-origin'} to send cookie for the current domain
        fetchOptions: {}
    },

    initialize: function (url, options) {
        // Inherits options from geojson-vt!
        // 		this._slicer = geojsonvt(geojson, options);
        this._url = url;
        L.VectorGrid.prototype.initialize.call(this, options);
    },

    // 🍂method setUrl(url: String, noRedraw?: Boolean): this
    // Updates the layer's URL template and redraws it (unless `noRedraw` is set to `true`).
    setUrl: function (url, noRedraw) {
        this._url = url;

        if (!noRedraw) {
            this.redraw();
        }

        return this;
    },

    _getSubdomain: L.TileLayer.prototype._getSubdomain,

    _isCurrentTile: function (coords, tileBounds) {

        if (!this._map) {
            return true;
        }

        var zoom = this._map._animatingZoom ? this._map._animateToZoom : this._map._zoom;
        var currentZoom = zoom === coords.z;

        var tileBounds = this._tileCoordsToBounds(coords);
        var currentBounds = this._map.getBounds().overlaps(tileBounds);

        return currentZoom && currentBounds;

    },

    _getVectorTilePromise: function (coords, tileBounds) {
        var data = {
            s: this._getSubdomain(coords),
            x: coords.x,
            y: coords.y,
            //			z: coords.z
            // 			z: this._getZoomForUrl()	/// TODO: Maybe replicate TileLayer's maxNativeZoom
            z: 14 //hard-coded for now
        };
        if (this._map && !this._map.options.crs.infinite) {
            var invertedY = this._globalTileRange.max.y - coords.y;
            if (this.options.tms) { // Should this option be available in Leaflet.VectorGrid?
                data['y'] = invertedY;
            }
            data['-y'] = invertedY;
        }

        if (!this._isCurrentTile(coords, tileBounds)) {
            return Promise.resolve({ layers: [] });
        }

        var tileUrl = L.Util.template(this._url, L.extend(data, this.options));
        var context = {
            "tiles": "https://w3id.org/tree/terms#",
            "hydra": "http://www.w3.org/ns/hydra/core#",
            "osm": "https://w3id.org/openstreetmap/terms#",
            "rdfs": "http://www.w3.org/2000/01/rdf-schema#",
            "geo": "http://www.w3.org/2003/01/geo/wgs84_pos#",
            "dcterms": "http://purl.org/dc/terms/",
            "dcterms:license": {
                "@type": "@id"
            },
            "hydra:variableRepresentation": {
                "@type": "@id"
            },
            "hydra:property": {
                "@type": "@id"
            }
        };
        //, this.options.fetchOptions ?
        return jsonld.promises.compact(tileUrl, context).then(function (json) {
            var feats = RoutableTilesToGeoJSON(json);
            let vtfeatures = geojsonvt(feats).getTile(14, coords.x, coords.y).features;
            let result = {
                layers: {
                    "Routable Tiles": {
                        extent: 4096,
                        features: vtfeatures,
                        name: "Routable Tiles",
					    length: feats.length
                    }
                }
            };
            return result;
        });
    }
});

// 🍂factory L.vectorGrid.routableTiles(url: String, options)
// Instantiates a new routable tiles VectorGrid with the given URL template and options
L.vectorGrid.routableTiles = function (url, options) {
    return new L.VectorGrid.RoutableTiles(url, options);
};

