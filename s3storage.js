/**
 * Copyright 2014 IBM Corp.
 *
 * Licensed under the Apache License, Version 2.0 (the "License");
 * you may not use this file except in compliance with the License.
 * You may obtain a copy of the License at
 *
 * http://www.apache.org/licenses/LICENSE-2.0
 *
 * Unless required by applicable law or agreed to in writing, software
 * distributed under the License is distributed on an "AS IS" BASIS,
 * WITHOUT WARRANTIES OR CONDITIONS OF ANY KIND, either express or implied.
 * See the License for the specific language governing permissions and
 * limitations under the License.
 **/
var AWS = require('aws-sdk');
var when = require('when');
var util = require('util');
var fs = require('fs');

var settings;
var appname;
var s3 = null;
var s3BucketName = null ;
var currentFlowRev = {};
var currentSettingsRev = null;
var currentCredRev = null;

var libraryCache = {};

function prepopulateFlows(resolve) {
    var params =  {};
    params.Bucket = s3BucketName;
    params.Key = appname+"/"+"flow.json";
    console.log("prepop flows") ;
    s3.getObject(params,function(err,doc) {
        if (err) {
            var promises = [];
            if (fs.existsSync(__dirname+"/defaults/flow.json")) {
                try {
                    var flow = fs.readFileSync(__dirname+"/defaults/flow.json","utf8");
                    var flows = JSON.parse(flow);
                    console.log(">> Adding default flow");
                    promises.push(s3storage.saveFlows(flows));
                } catch(err) {
                    console.log(">> Failed to save default flow");
                    console.log(err);
                }
            } else {
                console.log(">> No default flow found");
            }
/**             if (fs.existsSync(__dirname+"/defaults/flow_cred.json")) {
                try {
                    var cred = fs.readFileSync(__dirname+"/defaults/flow_cred.json","utf8");
                    var creds = JSON.parse(cred);
                    console.log(">> Adding default credentials");
                    promises.push(s3storage.saveCredentials(creds));
                } catch(err) {
                    console.log(">> Failed to save default credentials");
                    console.log(err);
                }
            } else {
                console.log(">> No default credentials found");
            }
            */
            when.settle(promises).then(function() {
                    resolve();
            });
        } else {
            resolve();
        }
    });
}


var s3storage = {
    init: function(_settings) {
        settings = _settings;
        s3BucketName = settings.awsS3Bucket ;
        appname = settings.awsS3Appname || require('os').hostname();
        AWS.config.region = settings.awsRegion || 'us-east-1';
        AWS.config.accessKeyId = settings.awsAccessKeyId;
        AWS.config.secretAccessKey = settings.awsSecretAccessKey;
        
        return when.promise(function(resolve,reject) {
            s3 = new AWS.S3();
            if (!s3BucketName) {
                s3BucketName = data.Owner.DisplayName + "-node-red"
            }

            var params =  {Bucket: s3BucketName};
            s3.listObjects(params, function(err, data) {
                if (err) {
                    console.error("s3s get bucket error " + params) ;
                    s3.createBucket(params,function(err) {
                        if (err) {
                            reject("Failed to create bucket: "+err);
                        } else {
                            prepopulateFlows(resolve);
                        }
                    });
                } else {
                    prepopulateFlows(resolve);
                    resolve();
                }
            });
        });
    },
    
    getFlows: function() {
        return this.getArrayData("flow") ;
    },
    saveFlows: function(flows) {
        return this.saveData("flow", flows) ;
    },
    getCredentials: function() {
        return this.getData("credential") ;
    },
    saveCredentials: function(creds) {
        return this.saveData("credential", creds) ;
    },
    getSettings: function() {
        return this.getData("settings") ;
    },
    saveSettings: function(creds) {
        return this.saveData("settings", creds) ;
    },
    getData: function(entryType) {
        return when.promise(function(resolve,reject) {
            var params =  {};
            params.Bucket = s3BucketName;
            params.Key = appname+"/"+ entryType + ".json";
            s3.getObject(params,function(err,doc) {
                if (err) {
                    if (err.code == 'NoSuchKey') {
                        console.warn("no entry found for key " + params.Key);
                        resolve({});
                    } else {
                        console.error(err) ;
                        reject(err.toString());
                    }
                } else {
                    var strObj = doc.Body.toString() ;
                    var dataEntry = JSON.parse(strObj);
                    resolve(dataEntry);
                }
            });
        });
    },
    getArrayData: function(entryType) {
        return when.promise(function(resolve,reject) {
            var params =  {};
            params.Bucket = s3BucketName;
            params.Key = appname+"/"+ entryType + ".json";
            s3.getObject(params,function(err,doc) {
                if (err) {
                    if (err.code == 'NoSuchKey') {
                        console.warn("no entry found for key " + params.Key);
                        resolve([]);
                    } else {
                        console.error(err) ;
                        reject(err.toString());
                    }
                } else {
                    var strObj = doc.Body.toString() ;
                    var dataEntry = JSON.parse(strObj);
                    resolve(dataEntry);
                }
            });
        });
    },
    saveData: function(entryType, dataEntry) {
        console.log("save " + entryType) ;
        return when.promise(function(resolve,reject) {
            
            var params =  {};
            params.Bucket = s3BucketName;
            params.Key = appname+"/"+ entryType + ".json";
            params.Body = JSON.stringify(dataEntry);

            s3.upload(params,function(err,doc) {
                if (err) {
                    reject(err.toString());
                } else {
                    resolve();
                }
            });
        });
    },
    saveLibraryEntry: function(type,path,meta,body) {
        console.log("save library entry: " +type + ":" +path) ;
        if (path.substr(0) != "/") {
            path = "/"+path;
        }
        var key = appname+"/lib/"+type+path;
        return when.promise(function(resolve,reject) {
             var params =  {};
            params.Bucket = s3BucketName;
            params.Key = appname+"/lib/"+type+path;;
            params.Body = JSON.stringify(body);
            if (meta) {
                var metaStr = JSON.stringify (meta) ;
                params.Metadata = { nrmeta: metaStr} ;
            }

            s3.putObject(params,function(err,data) {
                if (err) {
                    reject(err.toString());
                } else {
                    resolve();
                }
            });
        });
    },
    getLibraryEntry: function(type,path) {
        console.log("get library entry: " +type + ":" +path) ;
        return when.promise(function(resolve,reject) {

            var params =  {};
            params.Bucket = s3BucketName;
            params.Prefix = appname+"/lib/"+type+(path.substr(0)!="/"?"/":"")+path;
            params.Delimiter = "/";
            s3.listObjects(params,function(err,data) {
                if (err) {
                    if (err.code == 'NoSuchKey') {
                        console.warn("no entry found for key " + params.Key);
                        reject(err.toString());
                    } else {
                        console.error(err) ;
                        reject(err.toString());
                    }
                } else {
                    if (data.Contents.length == 1 && data.Contents[0].Key == data.Prefix) {
                        var getParams = { Bucket: s3BucketName, Key: data.Prefix };
                        s3.getObject(getParams, function(err, doc){
                            if (err) {
                                reject(err.toString());
                            }
                            else {
                                var strObj = doc.Body.toString() ;
                                var dataEntry = JSON.parse(strObj);
                                resolve(dataEntry);
                            }

                        }) ;
                    }
                    else {
                        var resultData = [] ; 
                        for (var i = 0; i < data.CommonPrefixes.length; i++) {
                            var li = data.CommonPrefixes[i];
                            resultData.push(li['Prefix'].substr(data.Prefix.length,
                                    li['Prefix'].length - (data.Prefix.length+1))) ;
                        } 
                        var prefixes = {} ;
                        for (var i = 0; i < data.Contents.length; i++) {
                            var li = data.Contents[i];
                            var getParams = { Bucket: s3BucketName, Key: li.Key };
                            s3.headObject(getParams, function(err, objData){
                                console.log(this.request.httpRequest.path);
                                var entryName = this.request.httpRequest.path.toString() ;
                                
                                entryName = entryName.substr(data.Prefix.length + 1, 
                                    entryName.length - (data.Prefix.length +1)) ;
                                var entryData = {} ;
                                if (objData.Metadata["nrmeta"]) {
                                    
                                    entryData = JSON.parse(objData.Metadata.nrmeta) ;
                                }
                                 
                                entryData.fn = entryName ;
                                resultData.push(entryData) ;
                                if (resultData.length == (data.CommonPrefixes.length + data.Contents.length)) {
                                    resolve(resultData);
                                }

                            }  );
                        }
                         
                    }
    
                }
            });
        });
    }

};

module.exports = s3storage;
