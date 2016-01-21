#! /usr/bin/node

var server = require('./server')
    , router = require('./router')
    , cp = require('child_process')
    , n_cpu = require('os').cpus().length;

/*
process.n_worker = n_cpu;
process.workers = [];

do {
    process.workers.push(
        cp.fork('../task/ck_trade_status')
    );
} while (n_cpu-- > 0);
*/

server.start(router.route);
