'use strict';

var api = require('./api')
    , xml2js = require('xml2js');

/**
 * 错误匹配
 * @param resp {String} 接口返回数据
 * @return {String} 错误提示
 * @constructor
 */
var _parse_error = function(o) {
    var error = '';
    
    var o = o.response;

    if (!o) {
        error = '平台接口数据错误';
    }
    else {
        var s = o.orderState;
        
        var error_desc = {
            300: '订单已发货',
            400: '订单已发货',
            1000: '订单已完成',
            1100: '订单已关闭',
            '-100': '订单已取消'
        }[s];

        if(error_desc) {
            error = error_desc;    
        }
        else if ('101' != s) {
            error = '订单状态错误:' + s;
        }
    }

    return error;
};

/**
 * 检查订单状态是否能发货
 * @param access_token {String} 平台授权码
 * @param tid {String} 订单号
 * @param cb {Function} 回调函数
 * @constructor
 */
exports.check_trade_status = function(access_token, tid, cb) {
    var p = {
        access_token: access_token,
        method: 'dangdang.order.details.get',
        o: tid.tid || tid
    };

    api.post(p, '', function(err, resp) {

        var parser = new xml2js.Parser();
        parser.parseString(resp, function(err1, r) {
            cb(null, { msg: err || err1 || _parse_error(r), tid: tid.ptid || tid });
        });
    });
};
