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
function Packet(subnet_prefix, expiry, data) {
    var parts = data.toString().split(" ");
    var originPort = parseInt(parts[5]);
    var destPort = parseInt(parts[6]);
    var port = originPort < destPort ? originPort : destPort;
    var protocol = parts[7];
    var source_ip = parts[3];
    var destination_ip = parts[4];
    var expires = new Date(new Date().getTime() + expiry * 1000);
    //console.log("packet expires :: " + expires);
    if (!source_ip.startsWith(subnet_prefix)) {
        source_ip = "EXTERNAL";
    }
    if (!destination_ip.startsWith(subnet_prefix)) {
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
    this.nic = parts[2];
    this.source_ip = source_ip;
    this.destination_ip = destination_ip;
    this.port = port;
    this.protocol = protocol;
    this.expires = expires;
    this.key = "k::" + source_ip + "::" + destination_ip;
}

Packet.prototype.toString = function() {
    return this.source_ip + " <--> " + this.destination_ip + " :: " + this.port;
};
// export the class
module.exports = Packet;