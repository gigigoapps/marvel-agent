'use strict';

var proxy = require('http-proxy');
var assert = require('assert');
var shortid = require('shortid');
var qs = require('qs');

function SafeJSONParse(str){
	var obj = null;
	try{
		obj = JSON.parse(str);
	}catch(e){}
	return obj;
}
function getParamsObject(str){
	var q = str.split('?')[1];
	return !q ? '' : qs.parse(q);
}

function HttpProxy(opts,notify,app){

	//Debug
	this.debug = require('debug')('marvel:scenario:HttpProxy:'+opts.name);
	this.debug('name',opts.name);
	this.debug('protocol',opts.protocol);
	this.debug('hostname',opts.hostname);
	
	//Assertions
	assert(opts.name,    'http_proxy name required ('+opts.name+')')
	assert(opts.protocol,'http_proxy protocol required ('+opts.name+')')
	assert(opts.hostname,'http_proxy hostname required ('+opts.name+')')


	//Constructor params
	this.notify = notify;
	this.name = opts.name;
	this.app = app;
	this.hostname = opts.hostname;
	this.protocol = opts.protocol;

	this.target = opts.protocol + '://' + opts.hostname;
	this.proxy = proxy.createProxyServer();
	this.mountPath = '/'+opts.name;
	
	this.debug('_mountPath',this.mountPath);
	this.debug('_target',this.target);


	//Bind controllers
	this.app.use(this.mountPath,this.onRequest.bind(this))
	this.proxy.on('proxyRes',this.onResponse.bind(this))
	this.proxy.on('error',this.onError.bind(this))

}

HttpProxy.prototype = {

	notifyLog : function(type,body){
		this.notify(type,body);
	},

	//Build a request body log and notify it
	notifiyRequest : function(requestId,method,url,headers,body){
		this.notifyLog('request',{
			createdAt : new Date(),
			method : method,
			url : url,
			paramsObject : getParamsObject(url),
			bodyObject:SafeJSONParse(body),
			headers : headers,
			body:body,
			agent_name : this.name,
			requestId : requestId
		});
	},

	//Build a response body log and notify it
	notifyResponse : function(requestId,method,url,headers,body,statusCode){
		this.notifyLog('response',{
			createdAt : new Date(),
			method : method,
			url : url,
			statusCode : statusCode,
			paramsObject : getParamsObject(url),
			bodyObject:SafeJSONParse(body),
			headers : headers,
			body:body,
			agent_name : this.name,
			requestId : requestId
		});
	},

	//Error handler
	onError : function(err,req,res){
		if (this.debug.enabled){
			this.debug('error',err)
		}
		if (res && res.send)
			res.send(500,err)
	},

	//Proxy response controller
	onResponse : function(proxyRes,req){
		var self = this;
		proxyRes.body = '';

		proxyRes.on('data', function (data) {
			proxyRes.body += data.toString('utf8');
		});

		proxyRes.on('end', function (chunk) {
			if (self.debug.enabled){
				// self.debug('response',req.requestId,proxyRes.statusCode,req.fullUrl);
			}

			//Notify response
			self.notifyResponse(req.requestId,req.method,req.fullUrl,proxyRes.headers,proxyRes.body,proxyRes.statusCode);
		});
	},

	//App request controller
	onRequest : function(req,res){
		var self = this;

		req.requestId = shortid.generate();

		//Modify request
		req.url = req.url.replace(new RegExp('^\\/'+this.name),'');
		req.fullUrl = this.target + req.url;
		req.headers.host = this.hostname;

		//Capture body
		req.body = [];
		req.on('data', function (chunk) {
	        req.body.push(chunk)
	    });

	    //Pass to proxy
	    req.on('end',function(){ 
            req.body = Buffer.concat(req.body);

			//Notify request
			if (self.debug.enabled){
				// self.debug('request',req.requestId,req.fullUrl);
			}
			self.notifiyRequest(req.requestId,req.method,req.fullUrl,req.headers,req.body.toString());

			//Remove previous body listeners
			req.removeAllListeners('data');
			req.removeAllListeners('end');

			//Proxy the request
			self.proxy.web(req, res, { 
				target:self.target,
				enable : { xforward: true }
			},function(err){
				self.onError(err,req,res)
			});

			//Re-emit body content
			req.emit('data', req.body);
			req.emit('end');
		})
	}
}


module.exports = HttpProxy;
