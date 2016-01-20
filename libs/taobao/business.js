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
 
    var e = o.error_response;

    if (e && (e.msg || e.sub_msg)) {
        error = (e.msg || '平台接口数据错误') + (e.sub_msg ? (', ' + e.sub_msg) : '');
    }
    else {
        var s = o.trade ? o.trade.status : '';

        if ('WAIT_SELLER_SEND_GOODS' != s || 
            s != 'SELLER_CONSIGNED_PART') {

            if ('WAIT_BUYER_CONFIRM_GOODS' == s ||
                'TRADE_FINISHED' == s ||
                'TRADE_CLOSED' == s ||
                'TRADE_CLOSED_BY_TAOBAO' == s
            ) {
                error = '卖家已发货或交易已关闭';
            }    
            else {
                error = '订单状态不对:' + s;     
            }
        }
        else {
            var ords = o.trade && o.trade.orders ? o.trade.orders.order : '';

            ords.forEach(function(v) {
                if (!(v.refund_status == 'NO_REFUND' || 
                    v.refund_status == 'CLOSED')) {
                    
                    error = '订单商品有退款';
                }
            });
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
        session: access_token,
        method: 'taobao.trade.get',
        fields: 'status,orders',
        tid: '' + tid
    };

    api.post(p, function(err, resp) {
        cb(null, { msg: _parse_error(resp), tid: tid });
    });
};
