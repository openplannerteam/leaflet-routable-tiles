
var extractWays = function (json, nodes) {
    return json['@graph'].filter((item) => {
        return item["@type"] === 'osm:Way';
    }).map((item) => {
        //Transform osm:nodes to a linestring style thing
        item["osm:nodes"] = item["osm:nodes"].map((node) => {
            return nodes[node];
        });
        return {
            id: item["@id"],
            type: "Feature",
            properties: {
                
            },
            geometry: {
               type: "LineString",
                coordinates: item["osm:nodes"]
            }
        };
    });
}


module.exports = function (json) {

    // Normalize feature getters into actual instanced features
    var feats = [];
    var nodes = {};
    for (var i = 0; i < json['@graph'].length; i++) {
        let o = json['@graph'][i];
        if (o['geo:lat'] && o['geo:long']) {
            nodes[o['@id']] = [o['geo:long'],o['geo:lat']]
            let feature = {
                id: o['@id'],
                type: "Feature",
                geometry: {
                    type: 'Point', 
                    coordinates: [o['geo:long'], o['geo:lat']]
                }
            };
            feats.push(feature);
        }
    }
    let ways = extractWays(json, nodes);
    return {
        "type": "FeatureCollection",
        "features": ways
    };
    
}