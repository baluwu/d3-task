
'use strict';

var url = require('url')
    , event = require('../../common/event/event')
    , ctrlTrade = require('./ctrl_base').base;

var _output = function(data) {
    this.echo(JSON.stringify(data));
    this.end();
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

    self.set_stream(res);
    self.http_head(200, 'json');   


    if (!body.bid) {
        resp.msg = 'no params: bid';
        _output.call(self, resp);
    }
    else if (!body.check_info) {
        resp.msg = 'no param: check_info';
        _output.call(self, resp);
    }
    else {
        try { ci = JSON.parse(body.check_info); }
        catch(e) { 
            resp.msg = 'Invalid param check_info';
            return _output.call(self, resp);
        }

        event.register_event('CK_FIN', function(data) {
            resp.data = data;
            resp.succ = !data.length;
            _output.call(self, resp);
        });

        worker = _get_worker(body.bid);

        event.start(worker);
        worker.send({ type: 'CK_TRADE_ST', params: ci });
    }
};

exports.handler = ctrlTrade;
