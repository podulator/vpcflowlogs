var kinesis = require('kinesis');
var TrafficNode = require("./TrafficNode.js");
var TrafficNodes = require("./TrafficNodes.js");
var TrafficLink = require("./TrafficLink.js");
var TrafficLinks = require("./TrafficLinks.js");
var Packet = require("./Packet.js");
var PacketManager = require("./PacketManager.js");

const SUBNET_PREFIX = "10.";
const PACKET_LIFETIME = 30;
const CLEANING_FREQUENCY = 30;

/* GUI EVENTS START HERE */

var linkAdded = function(trafficLink) {
    // called when a new link has been established for the graph
    // and needs to be added to the presentation layer
    console.log("link added :: " + trafficLink);
}
var linkUpdated = function(trafficLink) {
    // called when a link strength has been changed
    // and needs to be added to the presentation layer
    //console.log("link updated :: " + trafficLink);
}
var linkRemoved = function(trafficLink) {
    // called when a link is removed
    // and can be taken away from the presentation layer
    console.log("link removed :: " + trafficLink);
}
var packetDeleted = function(packet) {
    // called when a packet has expired after PACKET_LIFETIME seconds
    //console.log("Deleted packet :: " + JSON.stringify(packet));
    trafficLinks.remove(packet.key);
}
var nodeAdded = function(node) {
    // called when a new traffic node has been discovered
    // and needs to be added to the network graph
    console.log("traffic node added :: " + node.ip_address);
}
var nodeResolved = function(node) {
    // called when an ip address has been resolved into an ec2 instance etc
    // and presentation can be updated
    console.log("traffic node resolved :: " + node);
}
var nodeRemoved = function(node) {
    // called when a traffic node has expired
    // and needs to be removed from presentation
    console.log("traffic node removed :: " + node);
    // remove from any links
    trafficLinks.removeNodeLinks(node);
}

/* GUI EVENTS END HERE */

var kinesisSource = kinesis.stream({ name: 'vpc-flow-logs', oldest: true, initialRetryMs: 250, region: "eu-west-1" })
var trafficNodes = new TrafficNodes(CLEANING_FREQUENCY, nodeAdded, nodeRemoved);
var trafficLinks = new TrafficLinks(linkAdded, linkRemoved, linkUpdated);
var packetManager = new PacketManager(CLEANING_FREQUENCY, packetDeleted);

kinesisSource.on('error', (err) => {
    console.log("eating an error :: " + err.message.substring(0, 200));
});
kinesisSource.on('end', () => {
    console.log('there will be no more data.');
});
kinesisSource.on('readable', () => {
    console.log("stuff has arrived");
});
kinesisSource.on('data', (chunk) => {
    parseData(chunk);
});

function parseData(chunk) {
    /*
    { 
        ApproximateArrivalTimestamp: 1518283665.471,
        Data: <... >,
        PartitionKey: 'vpc-flow-logs',
        SequenceNumber: '49581598545800625660742029190841367484113314148050272258',
        ShardId: 'shardId-000000000000' 
    }
    */
    //console.log("received :: " + chunk.Data);
    streamDataParser(chunk.Data, function(packet) {
        if (packet) {
            try {
                var sourceNode = new TrafficNode(packet.source_ip, packet.port, packet.protocol, nodeResolved);
                var destinationNode = new TrafficNode(packet.destination_ip, packet.port, packet.protocol, nodeResolved);

                trafficNodes.add(sourceNode.ip_address, sourceNode);
                trafficNodes.add(destinationNode.ip_address, destinationNode);
                var link = new TrafficLink(sourceNode, destinationNode);

                trafficLinks.add(packet.key, link);
                packetManager.add(packet);
                //console.log(JSON.stringify(packet));
            } catch(err) {
                console.log(err);
            }
        }   
    });
}

var streamDataParser = function(input, callback) {
    var packet = new Packet(SUBNET_PREFIX, PACKET_LIFETIME, input);
    callback(packet);
}