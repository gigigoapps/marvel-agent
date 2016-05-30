'use strict';

var debug = require('debug')('marvel:loggerInterface');
var io;
var chalk = require('chalk');

var self = function(server){
	io = require('socket.io')(server)
	debug('init')

	if (debug.enabled){
		io.on('connection',function(socket){
			var ip = chalk.bold(socket.handshake.address);
			debug('client connected',socket.id,ip)
			socket.on('disconnect',function(){
				debug('client disconnected',socket.id,ip)
				
			})
		})
	}
}
self.notify = function(type,body){
	if (debug.enabled){
		var s = Object.keys(io.sockets.connected).length;
		var b = JSON.stringify(body).slice(0,80)+'...';
		debug('notify','clients:'+chalk.yellow.bold(s)+' type:'+chalk.yellow.bold(type)+' body_sample:'+chalk.yellow.bold(b));
	}
	io.sockets.emit('log',{
		type: type,
		body: body
	});
}


module.exports = self;