# tcs_apple_assignment
A repo to deliver TCS Apple Assignment
## Prerequisites
1.  AWS CLI is installed on your system and you are connected to your account with your shell (BASH, Powershell etc)
2.  Nodejs is installed
3.  Pulumi is installed

## Assumptions
Currently default region is set to us-east-2. If you want to change it, make sure you edit pulumi config.

## How to Run
1.  Clone the git repository in your local
2.  In your shell, go to the the directory Pulumi in your local repo folder where you cloned the repository.
3.  Run pulumi up

To connect to the instance, the public key to ssh is already in .ssh folder, but github did not allow me to store private key. I can send it if it is needed. Sample command for how I am connected to my last working ec2 instance:
PS D:\dev\aws\tcs_apple_assignment\\.ssh> ssh -i "id_rsa" ec2-user@3.138.111.100

## Current state of assignment
### First Question
For first question, all the steps are configured. You can check the comments and code in pulumi/index.ts
It does create following stack

     Type                              Name                       Status
 +   pulumi:pulumi:Stack               pulum-monte-tcs-apple-dev  created (1s)
 +   ├─ aws:ec2:Vpc                    vpc                        created (1s)
 +   ├─ aws:ec2:KeyPair                tcs_apple_kp               created (0.77s)
 +   ├─ aws:ec2:Subnet                 subnet                     created (10s)
 +   ├─ aws:ec2:InternetGateway        gateway                    created (0.81s)
 +   ├─ aws:ec2:SecurityGroup          security-group             created (2s)
 +   ├─ aws:ec2:RouteTable             routes                     created (1s)
 +   ├─ aws:ec2:RouteTableAssociation  route-table-association    created (0.50s)
 +   ├─ aws:ec2:Instance               tcs-apple-ec2              created (22s)
 +   ├─ aws:ebs:Volume                 tcs-apple-ebs              created (10s)
 +   └─ aws:ec2:VolumeAttachment       tcs-apple-ebs-attach       created (20s)

The content for userdata comes from Python/ec2InitUserData.sh. Since the requirement for question was to set any Python file at the instance launch, I tried to create a python file with userdata. And then executing the python file.
That part is working correct. However in the python file, I created a http webserver on port 80. It is working from within the instance by doing curl 'http://127.0.0.1' but not outside. Regardless that wasn't the ask of assignment anyways.


### Second question
Second question is independent of Pulumi. Hence you can directly look and execute it from Python/numbers.py. My sample execution
C:/Users/Monte/AppData/Local/Microsoft/WindowsApps/python3.10.exe d:/Dev/AWS/tcs_apple_assignment/Python/numbers.py
Note that it will create numbers.txt inside the directory where you executed the python command from.

### Third question
Third question is part of index.ts again. So you won't need to seperately execute that one from Pulumi. Following updates happened on the stack after programming this.
     Type                    Name                        Status              Info
     pulumi:pulumi:Stack     pulum-monte-tcs-apple-dev
 +   ├─ aws:s3:BucketV2      tcs-apple-s3                created (1s)
 ~   ├─ aws:ec2:Instance     tcs-apple-ec2               updated (51s)       [diff: ~userData]
 +   └─ aws:s3:BucketPolicy  tcs-apple-s3-bucket-policy  created (0.39s)
I spent several hours to limit the access to S3 bucket for only the ec2 instance I provisioned, but couldn't find it's arn to be able add PrincipalArn equals in the conditions. For now, the bucket can be accessed by any ec2 instance.