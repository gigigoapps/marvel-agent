'use strict';

var assert = require('assert');
var Tail = require('tail').Tail;

function FileTailing(opts,notify){
	var self = this;

	this.debug = require('debug')('marvel:scenario:FileTailing:'+opts.name);
	this.debug('name',opts.name);
	this.debug('path',opts.path);
	this.debug('regex',opts.regex);
	this.debug('regexReference',JSON.stringify(opts.regexReference));
	
	assert(opts.name,'file_tailing name required ('+opts.name+')')
	assert(opts.path,'file_tailing path required ('+opts.name+')')

	this.notify = notify;
	this.opts = opts;
	this.name = opts.name;

	this.regex = new RegExp(this.opts.regex);

	this.tail = new Tail(opts.path);

	this.tail.on('line', this.onLine.bind(this));

	this.tail.on('error', function(err) {
		if (self.debug.enabled)
			self.debug('error',err)
	});


}

FileTailing.prototype = {
	notifyLog : function(body){
		this.notify('file',body);
	},
	onLine : function(line){
		this.notifyLog({
			agent_name : this.opts.name,
			path : this.opts.path,
			lineObject : this.parseLine(line),
			line : line
		})
	},
	parseLine : function(line){
		var ref = this.opts.regexReference;
		var match = line.match(this.regex);
		
		if (!match)
			return null;
		match.splice(0,1);

		//Replace matches for named keys
		var obj = {}
		for(var i = 0;i < match.length;i++){
			var key = ref && ref[i] || 'match_'+i;
			obj[key] = match[i];
		}

		return obj;

	}
}


module.exports = FileTailing;
