var kinesis = require('kinesis');
var TrafficNode = require("./TrafficNode.js");
var TrafficNodes = require("./TrafficNodes.js");
var TrafficLink = require("./TrafficLink.js");
var TrafficLinks = require("./TrafficLinks.js");
var PacketManager = require("./PacketManager.js");

const SUBNET_PREFIX = "10.";
const PACKET_LIFETIME = 30;

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
    var link = trafficLinks.remove(packet.key);
    //console.log("link count :: " + link.count);
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
    // remove from collection
    trafficNodes = trafficNodes.filter(item => item !== node);
    // remove from any links
    trafficLinks.removeNodeLinks(node);
}

var kinesisSource = kinesis.stream({ name: 'vpc-flow-logs', oldest: true })
//var trafficNodes = [];
var trafficNodes = new TrafficNodes(nodeAdded, nodeRemoved);

var trafficLinks = new TrafficLinks(linkAdded, linkRemoved, linkUpdated);
var packetManager = new PacketManager(30, packetDeleted);

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
            var sourceNode = new TrafficNode(packet.source_ip, packet.port, packet.protocol, nodeResolved);
            var destinationNode = new TrafficNode(packet.destination_ip, packet.port, packet.protocol, nodeResolved);
            /*
            if (!trafficNodes[packet.source_ip]) {
                console.log("adding traffic node :: " + packet.source_ip);
                sourceNode.resolve();
                trafficNodes[packet.source_ip] = sourceNode;
            }
            if (!trafficNodes[packet.destination_ip]) {
                console.log("adding traffic node :: " + packet.destination_ip);
                destinationNode.resolve();
                trafficNodes[packet.destination_ip] = destinationNode;
            }
            var link = new TrafficLink(trafficNodes[packet.source_ip], trafficNodes[packet.destination_ip]);
            */
            
            trafficNodes.add(sourceNode.ip_address, sourceNode);
            trafficNodes.add(destinationNode.ip_address, destinationNode);
            var link = new TrafficLink(sourceNode, destinationNode);


            trafficLinks.add(packet.key, link);
            packetManager.add(packet);
            //console.log(JSON.stringify(packet));
        }   
    });
}

var streamDataParser = function(input, callback) {
    /*
    Version INT,
    Account STRING,
    InterfaceId STRING,
    SourceAddress STRING,
    DestinationAddress STRING,
    SourcePort INT,
    DestinationPort INT,
    Protocol INT,
    Packets INT,
    Bytes INT,
    StartTime INT,
    EndTime INT,
    Action STRING,
    LogStatus STRING
    */
    var parts = input.toString().split(" ");
    var originPort = parseInt(parts[5]);
    var destPort = parseInt(parts[6]);
    var port = originPort < destPort ? originPort : destPort;
    var protocol = parts[7];
    var source_ip = parts[3];
    var destination_ip = parts[4];
    var expires = new Date(new Date().getTime() + PACKET_LIFETIME * 1000);
    //console.log("packet expires :: " + expires);
    if (!source_ip.startsWith(SUBNET_PREFIX)) {
        source_ip = "EXTERNAL";
    }
    if (!destination_ip.startsWith(SUBNET_PREFIX)) {
        destination_ip = "EXTERNAL";
    }
    switch(protocol) {
        case "1":
            protocol = "ICMP";
            break;
        case "4":
            protocol = "IPv4";
            break;
        case "6":
            protocol = "TCP";
            break;
        default:
    };
    var packet = {
        "nic": parts[2], 
        "source_ip": source_ip, 
        "destination_ip": destination_ip, 
        "port": port, 
        "protocol": protocol, 
        "expires": expires, 
        "key": "k::" + source_ip + "::" + destination_ip
    };

    callback(packet);
}