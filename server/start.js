#! /usr/local/bin/node

var server = require('./server')
    , router = require('./router')
    , cp = require('child_process')
    , n_cpu = require('os').cpus().length
    , event = require('../common/event/event');

process.n_worker = n_cpu;
process.workers = [];

var _create_process = function() {
    var proc = cp.fork('../task/ck_trade_status');

    /* handle messages send by child process */
    event.start(proc);

    return proc;
};

/* create work process */
do { process.workers.push(_create_process()); } while (--n_cpu > 0);

/* make sure the worker exist all the time */
event.register_event('CHILD_EXIT', function(pid) {
    var n = process.n_worker, wk = process.workers;
    
    for (var x = 0; x < n; x++) {
        if (wk[x] && wk[x].pid == pid) {
            wk[x] = _create_process();
        }
    }
});

server.start(router.route);

