#! /usr/bin/node

var server = require('./server')
    , router = require('./router')
    , cp = require('child_process')
    , n_cpu = require('os').cpus().length
    , event = require('../common/event/event');

process.n_worker = n_cpu;
process.workers = [];

/* create work process */
do {
    var proc = cp.fork('../task/ck_trade_status');
    process.workers.push(proc);

    /* handle messages send by child process */
    event.start(proc);
} while (--n_cpu > 0);

/* make sure the worker exist all the time */
event.register_event('CHILD_EXIT', function(pid) {
    var n = process.n_workers
        , wk = process.workers;

    for (var x = 0; x < n; x++) {
        if (wk[n] && wk[n].pid == pid) {
            wk[n] = cp.fork('../task/ck_trade_status');
        }
    }
});

server.start(router.route);

