'use strict';

var api = require('./api');

/**
 * 错误匹配
 * @param resp {String} 接口返回数据
 * @return {String} 错误提示
 * @constructor
 */
var _parse_error = function(resp) {
    var error = '', o;

    try { o = JSON.parse(resp); }
    catch (e) { return '获取订单数据出错'; }
    
    var o = o.response && o.response.trade;

    if (!o) {
        error = '平台接口数据错误';
    }
    else {
        var s = o.status, rfs = o.refund_status;
        
        var error_desc = {
            TRADE_BUYER_SIGNED: '订单已发货',
            WAIT_BUYER_CONFIRM_GOODS: '订单已发货',
            TRADE_CLOSED_BY_USER: '订单已取消',
            TRADE_CLOSED: '订单已取消',
            TRADE_BUYER_SIGNED: '订单已发货'
        }[s];

        if(error_desc) {
            error = error_desc;    
        }
        else if ('NO_REFUND' != rfs) {
            error = '订单有退款';    
        }
        else if ('WAIT_SELLER_SEND_GOODS' != s) {
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
        method: 'kdt.trade.get',
        tid: '' + tid
    };

    api.post(p, function(err, resp) {
        cb(null, { msg: _parse_error(resp), tid: tid });
    });
};
