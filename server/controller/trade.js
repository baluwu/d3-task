
'use strict';

var url = require('url')
    , cp = require('child_process')
    , event = require('../../common/event/event')
    , ctrlTrade = {}
    , rotate_idx = 0;

var _output = function(res, data) {
    res.writeHead(200, { 'Content-Type': 'application/json' });
    res.write(JSON.stringify(data));
    res.end();
};

/**
 * get work process
 * @param bid business_id
 * @constructor
 */
var _get_worker = function(bid) {
    rotate_idx = (rotate_idx++) % process.n_woker;
    var worker = process.workers[rotate_idx];

    if (!worker) {
        worker = process.workers[idx] = cp.fork('../../task/ck_trade_status');    
    }

    return worker;
};

/**
 * dispatch task to work process
 * @param res http.response
 * @param req http.request
 * @param body post data
 * @constructor
 */
ctrlTrade.check_status = function(res, req, body) {
    
    var self = this, ci, worker
        , st = (new Date()).getTime()
        , resp = { msg: '', succ: false, data: '' };

    if (!body.bid) {
        resp.msg = 'no params: bid';
        _output(res, resp);
    }
    else if (!body.check_info) {
        resp.msg = 'no param: check_info';
        _output(res, resp);
    }
    else {
        try { ci = JSON.parse(body.check_info); }
        catch(e) { 
            resp.msg = 'Invalid param check_info';
            return _output(res, resp);
        }
        
        /* register the context of this call */
        var call_id = event.register_context(res);

        /* register CK_FIN event */
        event.register_event('CK_FIN', function(callid, data) {
            resp.data = data;
            resp.succ = !data.length;
            
            /* get context by call_id */
            var response = event.get_context(callid);
            
            _output(response, resp);

            var et = (new Date()).getTime();

            console.log('Handle check %d trades, bid: %d, call_id: %s, use: %d ms',
                ci.length, body.bid, callid, et - st
            );

            /* release context */
            event.release_context(callid);
        });

        /* get woker process */
        worker = _get_worker(body.bid);

        /* start listen event */
        event.start(worker);

        /* send message to child process */
        worker.send({ type: 'CK_TRADE_ST', call_id: call_id, params: ci });
    }
};



exports.handler = ctrlTrade;
