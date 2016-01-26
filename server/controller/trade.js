
'use strict';

var url = require('url')
    , cp = require('child_process')
    , event = require('../../common/event/event')
    , ctrlTrade = {};//require('./ctrl_base').base;

var _output = function(res, data) {
    res.write(JSON.stringify(data));
    res.end();
};

/**
 * get work process
 * @param bid business_id
 * @constructor
 */
var _get_worker = function(bid) {

    var idx = (+bid) % process.n_worker
        , worker = process.workers[idx];

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
        , resp = { msg: '', succ: false, data: '' };

    res.writeHead(200, { 'Content-Type': 'application/json' })

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
        event.register_event('CK_FIN', function(call_id, data) {
            resp.data = data;
            resp.succ = !data.length;
            
            /* get context by call_id */
            var response = event.get_context(call_id);

            _output(response, resp);

            /* release context */
            event.release_context(call_id);
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
