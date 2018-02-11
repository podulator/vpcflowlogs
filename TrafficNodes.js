function TrafficNodes(nodeAddedCB, nodeRemovedCB) {
    this.objects = [];
    this.keys = [];
    this.added = nodeAddedCB;
    this.removed = nodeRemovedCB;
}

TrafficNodes.prototype.add = function(key, trafficNode) {
    if (this.keys.indexOf(key) < 0) {
        this.keys.push(key);
        this.objects.push({ 'key': key, 'node': trafficNode });
        trafficNode.resolve();
        this.added(trafficNode);
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
    return obj;
};

// export the class
module.exports = TrafficNodes;