'use strict';

var assert = require('assert');

var HttpProxy = require('../scenarios/HttpProxy')
var MongoDBOplog = require('../scenarios/MongoDBOplog')
var FileTailing = require('../scenarios/FileTailing')

var _ = require('lodash');
var notify = require('./loggerInterface').notify;

var config = require('./utils').getConfig();

var scenarios = [];
module.exports = function(app){


	assert(config.http_proxy ? _.isArray(config.http_proxy) : true,
		'parameter `http_proxy` has to be an array')
	assert(config.mongodb_oplog ? _.isArray(config.mongodb_oplog) : true,
		'parameter `mongodb_oplog` has to be an array')
	assert(config.file_tailing ? _.isArray(config.file_tailing) : true,
		'parameter `file_tailing` has to be an array')

	_.each(config.http_proxy,function(opts){
		scenarios.push({
			type : 'http_proxy',
			instance : new HttpProxy(opts,notify,app)
		})
	})
	
	_.each(config.mongodb_oplog,function(opts){
		scenarios.push({
			type : 'mongodb_oplog',
			instance : new MongoDBOplog(opts,notify)
		})
	})

	_.each(config.file_tailing,function(opts){
		scenarios.push({
			type : 'file_tailing',
			instance : new FileTailing(opts,notify)
		})
	})

}

module.exports.getScenarios = function(){
	return scenarios;
}