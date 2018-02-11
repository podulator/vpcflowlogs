var AWS = require('aws-sdk');
var ec2 = new AWS.EC2({'region': 'eu-west-1'});

function TrafficNode(ip_address, port, protocol, resolved) {
    this.ip_address = ip_address;
    this.port = port;
    this.protocol = protocol;
    this.type = ip_address == "EXTERNAL" ? "EXTERNAL" : "UNKNOWN";
    this.name = "";
    this.id = "";
    this.dns = "";
    this.subnet = "";
    this.vpc = "";
    this.updateExpires();
    this.resolved = resolved;
}

TrafficNode.prototype.updateExpires = function() {
    this.expires = new Date(new Date().getTime() + 5 * 60000);
}
TrafficNode.prototype.resolve = function () {
    if (this.type == "EXTERNAL") {
        return;
    }
    console.log("resolving :: " + this.ip_address);
    var that = this;
    var params = {
        DryRun: false,
        Filters: [
            {
                Name: 'private-ip-address',
                Values: [
                    this.ip_address
                ]
            }
        ]
    };
    ec2.describeInstances(params, function (err, data) {
        if (err) {
            console.log(err, err.stack);
        } else {
            //console.log(data);
            if (data.Reservations && data.Reservations.length > 0) {
                if (data.Reservations[0].Instances.length > 0) {
                    console.log("resolved ip :: " + that.ip_address + " to ec2 instance");
                    var instance = data.Reservations[0].Instances[0];
                    //console.log(JSON.stringify(instance, null, 2));
                    that.type = "EC2";
                    that.id = instance.InstanceId;
                    that.name = that.id;
                    that.dns = instance.PrivateDnsName;
                    that.subnet = instance.SubnetId;
                    that.vpc = instance.VpcId;
                    var tags = instance.Tags;
                    for (var x = 0; x < tags.length; x++) {
                        var tag = tags[x];
                        //console.log("checking tag :: " + JSON.stringify(tag, null, 2));
                        if (tag.Key == "aws:autoscaling:groupName") {
                            that.name = tag.Value;
                        } else if (tag.Key == "Name" && that.name == that.id) {
                            that.name = tag.Value;
                        }
                    }
                    that.resolved(that);
                }
            }
        }
    });
};

TrafficNode.prototype.toString = function () {
    return this.ip_address + " :: " + this.name + " = " + this.type;
}

// export the class
module.exports = TrafficNode;