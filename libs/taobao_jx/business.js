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

    o = o.fenxiao_dealer_requisitionorder_query_response;
    o = o && o.dealer_orders;
    o = o && o.dealer_order;

    o = o && o[0];

    if ((e && (e.msg || e.sub_msg)) || !o) {
        error = (e.msg || '平台接口数据错误') + (e.sub_msg ? (', ' + e.sub_msg) : '');
    }
    else {
        var s = o.order_status;
        var error_desc = {
            WAIT_FOR_APPLIER_STORAGE: '订单已发货',
            TRADE_FINISHED: '订单已完成',
            TRADE_CLOSED: '订单已关闭'
        };

        if (error_desc[s]) {
            error = error_desc[s];    
        }
        else if ('WAIT_FOR_SUPPLIER_DELIVER' != s) {
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
        method: 'taobao.fenxiao.dealer.requisitionorder.query',
        fields: 'order_status',
        dealer_order_ids: tid.tid || tid
    };

    api.post(p, function(err, resp) {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};
