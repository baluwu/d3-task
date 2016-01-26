'use strict';

var api = require('../taobao/api');

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

    o = o.fenxiao_orders_get_response;
    o = o && o.purchase_orders;
    o = o && o.purchase_order;

    o = o && o[0];

    if ((e && (e.msg || e.sub_msg)) || !o) {
        error = (e.msg || '平台接口数据错误') + (e.sub_msg ? (', ' + e.sub_msg) : '');
    }
    else {
        var s = o.status;
        var error_desc = {
            WAIT_BUYER_CONFIRM_GOODS: '订单已发货',
            TRADE_FINISHED: '订单已完成',
            TRADE_CLOSED: '订单已关闭',
            WAIT_BUYER_CONFIRM_GOODS_ACOUNTED: '订单已发货',
            PAY_ACOUNTED_GOODS_CONFIRM: '订单已发货',
            PAY_WAIT_ACOUNT_GOODS_CONFIRM: '订单已发货',
            
            TRADE_REFUNDED: '订单有退款',
            TRADE_REFUNDING: '订单有退款'
        };

        if (error_desc[s]) {
            error = error_desc[s];    
        }
        else if ('WAIT_SELLER_SEND_GOODS' == s) {
            o = o.sub_purchase_orders.sub_purchase_order;
            
            o && o.forEach(function(el) {
                if (error_desc[el.status]) {
                    error = error_desc[el.status];    
                } 
            });
        }
        else {
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
        method: 'taobao.fenxiao.orders.get',
        //fields: 'status',
        purchase_order_id: tid.tid || tid
    };

    api.post(p, function(err, resp) {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};
