#!/usr/bin/env node

'use strict'

//CLI initializations
var version = require('./package.json').version;

var argv = require('yargs')
	.version(version)
    .usage('Usage: marvel-agent [options]')

    .alias('h', 'help')
    .help('h')

    .alias('v', 'verbose')
    .describe('v', 'Enables verbose mode (extended log)')
    
    .alias('c', 'config')
    .string('c')
    .default('c', 'marvel-agent.conf')
    .describe('c', 'Path to config file')
    .argv;

var chalk = require('chalk');
console.log(chalk.green('Marvel Agent '+version)+'\n');
console.log(chalk.green('Use --help to see available options'+'\n'));

if (argv.verbose){
	require('debug').enable('marvel*')
}
//Overwrite info (node-tail issue)
console.info = function(){};

//Requires
var express = require('express')
var cors = require('cors')
var assert = require('assert')
var utils = require('./lib/utils')

//Config init
var config = utils.getConfig(argv.config)
assert(config.listen_port>>0,'config parameter `listen_port` not found or not number')

//Libs
var scenarioLoader = require('./lib/scenarioLoader')
var loggerInterface = require('./lib/loggerInterface')



//Http server
var app = express()
var server = require('http').Server(app)

//Load scenarios 
scenarioLoader(app)

//Enable CORS
app.use(cors())

//Init logger
loggerInterface(server)

//Start listening
server.listen(config.listen_port,'0.0.0.0',utils.dumpInfo);