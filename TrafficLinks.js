function TrafficLinks(linkAddedCB, linkRemovedCB, linkUpdatedCB) {
    this.keys = [];
    this.objects = [];
    this.added = linkAddedCB;
    this.removed = linkRemovedCB;
    this.updated = linkUpdatedCB;
}

TrafficLinks.prototype.add = function(key, link) {
    if (this.keys.indexOf(key) < 0) {
        this.keys.push(key);
        this.objects.push({ 'key': key, 'link': link });
        this.added(link);
    } else {
        var obj = this.objects.find(item => item.key == key);
        obj.link.count++;
        this.updated(link);
    }
    
    //console.log("number of links post push (" + key + ") :: " + this.objects.length + ", " + this.keys.length);
    //console.log("add :: " + link.toString());
};

TrafficLinks.prototype.removeNodeLinks = function(trafficNode) {
    var links = this.keys.filter(item => item.indexOf(trafficNode.ip_address) > 0);
    console.log("removing " + links.length + " links for node :: " + trafficNode.ip_address);
    links.forEach(function(key) {
        this.remove(key);
    });
}

TrafficLinks.prototype.remove = function(key, force = false) {
    var obj = this.objects.find(item => item.key == key);
    if (!obj) {
        console.log("couldn't find link for key :: " + key);
        return;
    }
    var link = obj.link;
    link.count--;
    if (link.count <= 0 || force) {
        this.objects = this.objects.filter(item => item.link !== link);
        this.keys = this.keys.filter(item => item !== key);
        this.removed(link);
    } else {
        this.updated(link);
    }
    //console.log("number of links post remove (" + key + ") :: " + this.objects.length + ", " + this.keys.length);
    //console.log("remove :: " + link.toString());
    return link;
};

// export the class
module.exports = TrafficLinks;