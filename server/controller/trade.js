
'use strict';

var url = require('url')
    , moment = require('moment')
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
    rotate_idx = (++rotate_idx) % process.n_worker;

    var worker = process.workers[rotate_idx];

    if (!worker) {
        worker = process.workers[rotate_idx] = cp.fork('../../task/ck_trade_status');    
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

    if (!body) {
        resp.msg = 'service only surpport POST method';
        _output(res, resp);
    }
    else if (!body.bid) {
        resp.msg = 'no params: bid';
        _output(res, resp);
    }
    else if (!body.app_type) {
        resp.msg = 'no params: app_type';
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
        event.register_event('CK_FIN', function(callid, app_type, data) {
            resp.data = data;
            resp.succ = !data.length;
            
            /* get context by call_id */
            var response = event.get_context(callid);
            
            _output(response, resp);

            var et = (new Date()).getTime();

            console.log('%s: check %d trades, bid: %d, call_id: %s, use: %d ms',
                moment(new Date()).format('YYYY-MM-DD HH:mm:ss').toString(),
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
        worker.send({ type: 'CK_TRADE_ST', call_id: call_id, app_type: body.app_type, params: ci });
    }
};



exports.handler = ctrlTrade;
