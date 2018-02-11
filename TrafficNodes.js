function TrafficNodes(interval, nodeAddedCB, nodeRemovedCB) {
    this.interval = interval * 1000;
    this.objects = [];
    this.keys = [];
    this.added = nodeAddedCB;
    this.removed = nodeRemovedCB;
    setInterval(this.clean.bind(this), this.interval, this.removed);
}

TrafficNodes.prototype.clean = function(callback) {
    console.log("traffic node cleaning " + this.objects.length + " possible traffic nodes");
    var expires = new Date().getTime();
    var tempObjs = [];
    var tempKeys = [];
    this.objects.forEach(function(item){
        if (item.node.expires < expires) {
            callback(item.node);
        } else {
            tempObjs.push(item);
            tempKeys.push(item.node.ip_address);
        }
    });
    this.objects = tempObjs;
    this.keys = tempKeys;
    //this.packets = this.packets.filter(item => item.expires > expires);
    console.log("traffic node cleaning finished, " + this.objects.length + " traffic nodes left");
}

TrafficNodes.prototype.add = function(key, trafficNode) {
    var obj = this.objects.find(item => item.key == key);
    if (!obj) {
        this.keys.push(key);
        this.objects.push({ 'key': key, 'node': trafficNode });
        trafficNode.resolve();
        this.added(trafficNode);
    } else {
        obj.node.updateExpires();
    }
    //console.log("number of nodes post push :: " + this.objects.length);
};

TrafficNodes.prototype.remove = function(key) {
    var obj = this.objects.find(item => item.key == key);
    if (!obj) {
        console.log("couldn't find node for key :: " + key);
        return;
    }
    this.objects = this.objects.filter(item => item !== obj);
    this.keys = this.keys.filter(item => item !== key);
    this.removed(obj);

    //console.log("number of nodes post remove :: " + this.objects.length);
    //console.log("remove :: " + obj.toString());
};

// export the class
module.exports = TrafficNodes;