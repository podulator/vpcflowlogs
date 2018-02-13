var events = require('events');
var kinesis = require('kinesis');
var Packet = require("./Packet.js");
var TrafficNode = require("./TrafficNode.js");
var TrafficLink = require("./TrafficLink.js");

const PACKET_LIFETIME = 30;

function KinesisReader(subnetPrefix, params,  trafficNodes, trafficLinks, packetManager) {
    this.subnetPrefix = subnetPrefix;
    this.params = params;
    this.kinesisSource = null;
    this.trafficNodes = trafficNodes;
    this.trafficLinks = trafficLinks;
    this.packetManager = packetManager;
    events.EventEmitter.call(this);

    this.error = function() {
        this.emit('error');
    }
}

KinesisReader.prototype.__proto__ = events.EventEmitter.prototype;

KinesisReader.prototype.initialise = function() {
    console.log("setting up the stream reader");
    this.kinesisSource = kinesis.stream(this.params);
    this.kinesisSource.on('error', (err) => {
        console.log("eating an error :: " + err.message.substring(0, 200));
    });
    this.kinesisSource.on('end', () => {
        console.log('there will be no more data.');
    });
    this.kinesisSource.on('readable', () => {
        console.log("stuff has arrived");
    });
    this.kinesisSource.on('data', (chunk) => {
        this.parseData(chunk);
    });
}

KinesisReader.prototype.run = function() {
    console.log("starting up");
    this.destroy();
    this.initialise();
    console.log("running");
}

KinesisReader.prototype.destroy = function() {
    if (this.kinesisSource) {
        try {
            console.log("tearing down");
            this.kinesisSource.pause();
            this.kinesisSource.end();
        } catch (err) {
            console.log("destroy :: " + err);
        }
        this.kinesisSource = null;
    }
}

KinesisReader.prototype.parseData = function(chunk) {
    var that = this;
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
    this.streamDataParser(chunk.Data, function(packet) {
        if (packet) {
            try {
                var sourceNode = new TrafficNode(packet.source_ip, packet.port, packet.protocol);
                var destinationNode = new TrafficNode(packet.destination_ip, packet.port, packet.protocol);

                that.trafficNodes.add(sourceNode.ip_address, sourceNode);
                that.trafficNodes.add(destinationNode.ip_address, destinationNode);
                var link = new TrafficLink(sourceNode, destinationNode);

                that.trafficLinks.add(packet.key, link);
                that.packetManager.add(packet);
                //console.log(JSON.stringify(packet));
            } catch(err) {
                console.log(err);
            }
        }   
    });
}

KinesisReader.prototype.streamDataParser = function(input, callback) {
    //console.log("streamDataParser");
    var packet = new Packet(this.subnetPrefix, PACKET_LIFETIME, input);
    callback(packet);
}
// export the class
module.exports = KinesisReader;