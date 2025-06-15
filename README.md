# node-red-contrib-storage-s3

Node-Red module to support storage of node-red configuration data in AWS S3

This Node-red-contrib-storage-s3 Fork from Kieran Dolan (@kierandol) npm.js version, Change setting to use enviroments variables.
<p>
requires the following configuration:

</p>
<p>
settings.js: the following parameters can be added
<ul>
<li>awsRegion: optional region such as eu-west-1</li>
<li>awsS3Appname: optional name of application</li>
<li>awsS3Bucket: optional name of S3 bucket to use</li>
<li>storageModule: require('node-red-contrib-storage-s3'),</li>
<li>awsAccessKeyId: AWS Access Key ID</li>
<li>awsSecretAccessKey: AWS Secret Access Key</li>
</ul>
</p>

default settings for optional configuration:
<ul>
<li>awsRegion: 'eu-west-1'</li>
<li>awsS3Bucket: user display name + '-node-red'</li>
<li>awsS3Appname: aws instance name</li>
</ul>

Required Permissions
---------------------
- s3:CreateBucket
- s3:ListBucket
- s3:PutObject
- s3:GetObject

Author
-------
Kieran Dolan (@kierandol)  


Modifier
-------
sakazuki


Copyright and license
----------------------
Copyright 2014, 2016 IBM Corp. under the [Apache 2.0 license](http://www.apache.org/licenses/LICENSE-2.0).
