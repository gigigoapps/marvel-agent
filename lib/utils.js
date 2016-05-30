'use strict';

var yaml = require('js-yaml');
var assert = require('assert');
var fs = require('fs');
var path = require('path');
var chalk = require('chalk');

exports.getInterfaceAdresses = function() {
    var ifaces = require('os').networkInterfaces();
    var addreses = [];
    Object.keys(ifaces).forEach(function(dev) {
        ifaces[dev].forEach(function(details) {
            if (details.family === 'IPv4') {
            	addreses.push(details.address);
            }
        });
    });
    return addreses;
}

var config;
exports.getConfig = function(filename){
    if (!config){
        assert(filename,'--config option required')

        var configFile = path.resolve(process.cwd(),filename);

        console.log(chalk.green('Config file:'),chalk.yellow(filename))
        console.log(chalk.green('Config path:'),chalk.yellow(configFile)+'\n')

        try{
            var stats = fs.statSync(configFile);
        }catch(e){
            console.log(chalk.red('Config file not found'));
            process.exit(1);
        }


        //Loads and parse YML config
        config = yaml.safeLoad(fs.readFileSync(configFile, 'utf8'));
    }
    return config;
}


exports.dumpInfo = function(){
    var scenarios = require('./scenarioLoader').getScenarios();
    var addresses = exports.getInterfaceAdresses()

    //Scenario log
    for(var i in scenarios){
        var sc = scenarios[i].instance;
        if (scenarios[i].type=='http_proxy'){
            console.log(
                chalk.blue('['+sc.name+']'),
                chalk.blue.bold('HTTP Proxy'),
                chalk.blue('mount on'),
                chalk.cyan(sc.mountPath),
                chalk.blue('that forwards to'),
                chalk.cyan(sc.target)
            )
        }
        if (scenarios[i].type=='mongodb_oplog'){
            console.log(
                chalk.blue('['+sc.name+']'),
                chalk.blue.bold('MongoDB Oplog'),
                chalk.blue('tailing on'),
                chalk.cyan(sc.address),
                chalk.blue('for db:'),
                chalk.cyan(sc.database),
                chalk.blue('col:'),
                chalk.cyan(sc.collection),
                chalk.blue('op:'),
                chalk.cyan(sc.operation)
            )
        }
        if (scenarios[i].type=='file_tailing'){
            console.log(
                chalk.blue('['+sc.name+']'),
                chalk.blue.bold('File Tailing'),
                chalk.blue('of'),
                chalk.cyan(sc.opts.path)
            )
        }
    }
    console.log('');
    //Adresses listening
    addresses.unshift('0.0.0.0');
    for(var i in addresses){
        var agentUrl = 'http://'+addresses[i]+':'+config.listen_port;
        console.log(chalk.green('Listening on:'),chalk.yellow(agentUrl))
    }
}