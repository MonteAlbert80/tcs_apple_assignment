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

//Pulling User data from file system. This will be inserted into ec2 userdata section
const ec2UserData:string = fs.readFileSync("../Python/ec2initUserData.sh", 'utf-8');

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
    userData: ec2UserData
});

// Creating new Elastic Block Store (EBS) Volume
const ebsVolume = new aws.ebs.Volume(ebsVolumeName, {
    availabilityZone: instance.availabilityZone,
    size: ebsVolumeSize,
});

// Attaching EVS volume to ec2 instance
const ebsAtt = new aws.ec2.VolumeAttachment(volumeAttachmentName, {
    deviceName: "/dev/sdh",
    volumeId: ebsVolume.id,
    instanceId: instance.id,
});


// Following part is for question 3 of the assignment.
const current = aws.getCallerIdentity({});
export const accountId = current.then(current => current.accountId);

const s3bucket = new aws.s3.BucketV2("tcs-apple-s3", {});
const allowAccessFromAnotherAccountPolicyDocument = aws.iam.getPolicyDocumentOutput({
    statements: [{
        principals: [{
            type: "AWS",
            identifiers: ["123456789012"],
        }],
        actions: [
            "s3:ListBucket",
        ],
        resources: [
            s3bucket.arn,
            pulumi.interpolate`${s3bucket.arn}/*`,
        ],
    }],
});
const allowAccessFromEc2 = new aws.s3.BucketPolicy("tcs-apple-s3-bucket-policy", {
    bucket: s3bucket.bucket,
    policy: s3bucket.bucket.apply(s3ReadPolicyForBucket)
    
});

function s3ReadPolicyForBucket(bucketName: string) {
    return JSON.stringify({
        Version: "2012-10-17",
        Statement: [{
            Effect: "Allow",
            Principal: {
                Service: "ec2.amazonaws.com"
            },
            Action: [
                "s3:List*"
            ],
            Resource: [
                `arn:aws:s3:::${bucketName}/*` // policy refers to bucket name explicitly
            ],
        }]
    });
}
