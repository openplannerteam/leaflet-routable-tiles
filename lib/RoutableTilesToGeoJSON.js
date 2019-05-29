
var extractWays = function (json, nodes) {
    return json['@graph'].filter((item) => {
        return item["@type"] === 'osm:Way';
    }).map((item) => {
        //Transform osm:hasNodes to a linestring style thing
        if (!item['osm:hasNodes']) {
            item["osm:hasNodes"] = [];
        } else if(typeof item['osm:hasNodes'] === 'string') {
            item["osm:hasNodes"] = [item["osm:hasNodes"]];
        }
        item["osm:hasNodes"] = item["osm:hasNodes"].map((node) => {
            return nodes[node];
        });
        let geometry = {
            type: "LineString",
            coordinates: item["osm:hasNodes"]
        };
        
        return {
            id: item["@id"],
            //layer: item['osm:highway'],
            type: "Feature",
            properties: {
                highway: item['osm:highway'],
                name: item['rdfs:label']?item['rdfs:label']:''
            },
            geometry: geometry
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
