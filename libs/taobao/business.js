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
    o = o && o.trade_get_response;

    if ((e && (e.msg || e.sub_msg)) || !o) {
        error = (e.msg || '平台接口数据错误') + (e.sub_msg ? (', ' + e.sub_msg) : '');
    }
    else {
        var s = o.trade ? o.trade.status : '';

        var error_desc = {
            WAIT_BUYER_CONFIRM_GOODS: '订单已发货',
            TRADE_FINISHED: '订单已完成',
            TRADE_CLOSED_BY_TAOBAO: '订单已关闭',
            TRADE_CLOSED: '订单已关闭'
        }[s];

        if (error_desc) {
            error = error_desc;    
        }
        else if (
            'WAIT_SELLER_SEND_GOODS' != s &&
            'SELLER_CONSIGNED_PART' != s
        ) {
            error = '订单状态不对:' + s;     
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
        access_token: access_token,
        method: 'taobao.trade.get',
        fields: 'status,orders',
        tid: tid.tid || tid
    };

    api.post(p, function(err, resp) {
        cb(null, { msg: err || _parse_error(resp), tid: tid.ptid || tid });
    });
};
