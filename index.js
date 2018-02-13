
var TrafficNodes = require("./TrafficNodes.js");
var TrafficLinks = require("./TrafficLinks.js");
var PacketManager = require("./PacketManager.js");
var KinesisReader = require("./KinesisReader.js");
const SUBNET_PREFIX = "10.";
const CLEANING_FREQUENCY = 30;
var kinesisParams = { name: 'vpc-flow-logs', oldest: true, initialRetryMs: 250, region: "eu-west-1" };

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

var trafficNodes = new TrafficNodes(CLEANING_FREQUENCY, nodeAdded, nodeRemoved, nodeResolved);
var trafficLinks = new TrafficLinks(linkAdded, linkRemoved, linkUpdated);
var packetManager = new PacketManager(CLEANING_FREQUENCY, packetDeleted);
var reader = new KinesisReader(SUBNET_PREFIX, kinesisParams, trafficNodes, trafficLinks, packetManager);

reader.on('error', function() {
    console.log('kinesis stream reader error');
    reader.destroy();
    reader.run();
  });
reader.run();
