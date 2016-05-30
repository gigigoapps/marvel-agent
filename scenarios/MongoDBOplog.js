'use strict';

var assert = require('assert');
var MongoOplog = require('mongo-oplog');

function MongoDBOplog(opts,notify){
	var self = this;

	//Defaults
	this.address = opts.address || '127.0.0.1:27017'
	this.database = opts.database || '*'
	this.collection = opts.collection || '*'
	this.operation = opts.operation || '*';

	//Debug
	this.debug = require('debug')('marvel:scenario:MongoDBOplog:'+opts.name);
	this.debug('name',opts.name);
	this.debug('address',this.address);
	this.debug('database',JSON.stringify(this.database));
	this.debug('collection',JSON.stringify(this.collection));
	this.debug('operation',JSON.stringify(this.operation));

	//Assertions
	assert(opts.name,'mongodb_oplog name required ('+opts.name+')')

	//Constructor params
	this.opts = opts;
	this.notify = notify;
	this.name = opts.name;

	//Init regex
	this.buildRegex();

	//Connection
	this.oplog = MongoOplog('mongodb://'+this.address);

	//Tailing events
	this.oplog.tail(function() {
		if (self.debug.enabled)
		    self.debug('started');
	});
	this.oplog.on('error', function(err) {
		if (self.debug.enabled)
		    self.debug('error',err);
	});
	this.oplog.on('end', function() {
		if (self.debug.enabled)
		    self.debug('end');
	});
	this.oplog.on('op', this.op.bind(this));

}

MongoDBOplog.prototype = {
	opNames : {i:'insert',u:'update',d:'delete'},

	notifyLog : function(body){
		this.notify('oplog',body);
	},

	buildRegex : function(){
		var db = this.database;
		var col = this.collection;
		var op = this.operation;

		db = typeof db == 'string' ? [db] : db;
		col = typeof col == 'string' ? [col] : col;
		op = typeof op == 'string' ? [op] : op;

		var replacer = function(c){
			return c.replace('.','\\.').replace('*','.*')
		}

		col = col.map(replacer)
		db = db.map(replacer)
		op = op.map(function(o){
			return o[0].replace(/^[a\*]/,'.');
		})

		var nsRegex = '(?:'+db.join('|')+')\\.';
		nsRegex += '(?:'+col.join('|')+')';

		var opRegex = '(?:'+op.join('|')+')';

		this.nsRegex = new RegExp(nsRegex);
		this.opRegex = new RegExp(opRegex);

		this.debug('_nsRegex',this.nsRegex);
		this.debug('_opRegex',this.opRegex);
	},

	op : function(doc){
		if (this.nsRegex.test(doc.ns) && this.opRegex.test(doc.op)){
			var body = {
				agent_name : this.name,
				op : this.opNames[doc.op],
				ts : Date(doc.ts.high_),
				col : doc.ns,
				o : doc.o
			}
			if (doc.o2)
				body.o2 = doc.o2;
			if (doc.o3)
				body.o3 = doc.o3;
			this.notifyLog(body);
		}
	}

}


module.exports = MongoDBOplog;
