
'use strict';

var url = require('url')
    , ctrlTrade = require('./ctrl_base').base
    , fn_check_status = require('../../task/check_trade_status').check;

var _output = function(data) {
    console.dir(data);
    this.echo(JSON.stringify(data));
    this.end();
};

ctrlTrade.check_status = function(res, req, body) {
    
    var self = this;

    self.set_stream(res);
    self.http_head(200, 'json');   

    var resp = {
        msg: '',
        succ: false,
        data: ''
    };

    if (!body.check_info) {
        resp.msg = 'no param: check_info';
        return _output.call(self, resp);
    }
    else {
        var ci;

        try { ci = JSON.parse(body.check_info); }
        catch(e) { 
            resp.msg = 'Invalid param check_info';
            return _output.call(self, resp);
        }
        
        fn_check_status(ci, function(err, r) {
            return _output.call(self, r);
        });   
    }
};

exports.handler = ctrlTrade;
