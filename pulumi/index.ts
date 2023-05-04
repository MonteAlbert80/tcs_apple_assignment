/*
* Monte Albert's assignment for TCS-Apple DevOps Lead role
* 1.    Create EC2 where
* a.    Instance type should be configurable
* b.    Instance EBS volume size should be configurable
* c.     Mount the EBS volume
* d.    Upload a python program to the EC2 instance
* e.    Run the program at the instance creation
* f.      EC2 should be in private subnet
* g.     Add tags to the ec2 instance
*/

import * as pulumi from "@pulumi/pulumi";
import * as aws from "@pulumi/aws";
import * as fs from "fs";

//Pulling configuration items (added more config items than required)
let config = new pulumi.Config();
let ebsVolumeName = config.require("ebsVolumeName");
let ebsVolumeSize = +config.require("ebsVolumeSize");
let ec2instanceName = config.require("ec2InstanceName");
let ec2instanceType = config.require("ec2InstanceType");
let volumeAttachmentName = config.require("volumeAttachmentName");

//Pulling SSH key from file system. This will be used to connect to EC2 instance later.
const pubkey:string = fs.readFileSync("../.ssh/id_rsa.pub", 'utf-8');

//Create Key pair
const tcs_apple_kp = new aws.ec2.KeyPair("tcs_apple_kp", {
    publicKey: pubkey,
});

// Create a VPC.
const vpc = new aws.ec2.Vpc("vpc", {
    cidrBlock: "10.0.0.0/16",
});

// Create an an internet gateway.
const gateway = new aws.ec2.InternetGateway("gateway", {
    vpcId: vpc.id,
});

// Create a subnet that automatically assigns new instances a public IP address.
const subnet = new aws.ec2.Subnet("subnet", {
    vpcId: vpc.id,
    cidrBlock: "10.0.1.0/24",
    mapPublicIpOnLaunch: true,
});

// Create a route table.
const routes = new aws.ec2.RouteTable("routes", {
    vpcId: vpc.id,
    routes: [
        {
            cidrBlock: "0.0.0.0/0",
            gatewayId: gateway.id,
        },
    ],
});

// Associate the route table with the public subnet.
const routeTableAssociation = new aws.ec2.RouteTableAssociation("route-table-association", {
    subnetId: subnet.id,
    routeTableId: routes.id,
});

// Create a security group allowing inbound access over port 80 and outbound
// access to anywhere.
const securityGroup = new aws.ec2.SecurityGroup("security-group", {
    vpcId: vpc.id,
    name: "tcs-apple-sg",
    ingress: [
        {
            cidrBlocks: [ "0.0.0.0/0" ],
            protocol: "tcp",
            fromPort: 80,
            toPort: 80,
        },
        {
            cidrBlocks: [ "0.0.0.0/0" ],
            protocol: "tcp",
            fromPort: 22,
            toPort: 22,
        },
    ],
    egress: [
        {
            cidrBlocks: [ "0.0.0.0/0" ],
            fromPort: 0,
            toPort: 0,
            protocol: "-1",
        },
    ],
});

// Find the latest Amazon Linux 2 AMI.
const ami = pulumi.output(aws.ec2.getAmi({
    owners: [ "amazon" ],
    mostRecent: true,
    filters: [
        { name: "description", values: [ "Amazon Linux 2 *" ] },
    ],
}));

// Create and launch an Amazon Linux EC2 instance into the public subnet. (1.Create EC2 where)
const instance = new aws.ec2.Instance(ec2instanceName, {
    ami: ami.id,
    instanceType: ec2instanceType,
    subnetId: subnet.id,
    keyName: tcs_apple_kp.keyName,
    tags: {
        Name: "Monte_TCS_Apple",
    },
    vpcSecurityGroupIds: [
        securityGroup.id,
    ],
    userData: `
        echo 'from http.server import BaseHTTPRequestHandler, HTTPServer' >> pyserver.py
        echo 'import time' >> pyserver.py
        
        echo 'hostName = "localhost"' >> pyserver.py
        echo 'serverPort = 80' >> pyserver.py
        
        echo 'class MyServer(BaseHTTPRequestHandler):' >> pyserver.py
        echo '    def do_GET(self):' >> pyserver.py
        echo '        self.send_response(200)' >> pyserver.py
        echo '        self.send_header("Content-type", "text/html")' >> pyserver.py
        echo '        self.end_headers()' >> pyserver.py
        echo '        self.wfile.write(bytes("<html><head><title>TCS-Apple Assignment for Monte</title></head>", "utf-8"))' >> pyserver.py
        echo '        self.wfile.write(bytes("<p>Request: %s</p>" % self.path, "utf-8"))' >> pyserver.py
        echo '        self.wfile.write(bytes("<body>", "utf-8"))' >> pyserver.py
        echo '        self.wfile.write(bytes("<h1>TCS-Apple Assignment for Monte</h1>", "utf-8"))' >> pyserver.py
        echo '        self.wfile.write(bytes("<p>This is an example web server. created by Monte Albert for TCS Apple assignment</p>", "utf-8"))' >> pyserver.py
        echo '        self.wfile.write(bytes("<p>Hostname is $(hostname -f)</p>", "utf-8"))' >> pyserver.py
        echo '        self.wfile.write(bytes("</body></html>", "utf-8"))' >> pyserver.py
        
        echo 'if __name__ == "__main__":        ' >> pyserver.py
        echo '    webServer = HTTPServer((hostName, serverPort), MyServer)' >> pyserver.py
        echo '    print("Server started http://%s:%s" % (hostName, serverPort))' >> pyserver.py
        
        echo '    try:' >> pyserver.py
        echo '        webServer.serve_forever()' >> pyserver.py
        echo '    except KeyboardInterrupt:' >> pyserver.py
        echo '        pass' >> pyserver.py
        
        echo '    webServer.server_close()' >> pyserver.py
        echo '    print("Server stopped.")' >> pyserver.py
        
        python3 pyserver.py
    `,
});

const ebsVolume = new aws.ebs.Volume(ebsVolumeName, {
    availabilityZone: instance.availabilityZone,
    size: ebsVolumeSize,
});
const ebsAtt = new aws.ec2.VolumeAttachment(volumeAttachmentName, {
    deviceName: "/dev/sdh",
    volumeId: ebsVolume.id,
    instanceId: instance.id,
});


