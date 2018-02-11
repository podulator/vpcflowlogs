function PacketManager(interval, onExpire) {
    this.interval = interval * 1000;
    this.packets = [];
    setInterval(this.clean.bind(this), this.interval, onExpire);
}

PacketManager.prototype.add = function(packet) {
    this.packets.push(packet);
    //console.log("Added packet, number in play :: " + this.packets.length);
}
PacketManager.prototype.clean = function(callback) {
    console.log("Cleaning " + this.packets.length + " possible packets");
    var expires = new Date().getTime();
    var temp = [];
    this.packets.forEach(function(item){
        if (item.expires < expires) {
            callback(item);
        } else {
            temp.push(item);
        }
    });
    this.packets = temp;
    //this.packets = this.packets.filter(item => item.expires > expires);
    console.log("Cleaning finished, " + this.packets.length + " packets left");
};
// export the class
module.exports = PacketManager;