function TrafficLink(source, destination) {
    this.source = source;
    this.destination = destination;
    this.count = 1;
}

TrafficLink.prototype.toString = function() {
    //return JSON.stringify({'source': this.source, 'destination': this.destination, 'count': this.count});
    return this.source.ip_address + " <--> " + this.destination.ip_address + " = " + this.count;
};
// export the class
module.exports = TrafficLink;