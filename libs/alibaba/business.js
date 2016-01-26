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
 
    var o = o.orderModel;

    if (!o || !o.orderEntries) {
        error = '平台接口数据错误';
    }
    else {
        var s = o.status,
            rfs = o.refundStatus;
        
        var error_desc = {
            SUCCESS: '订单已完成',
            CANCEL: '订单已取消',
            WAIT_BUYER_RECEIVE: '订单已发货',
            WAIT_SELLER_AGREE: '订单有退款',
            REFUND_SUCCESS: '订单有退款',
            REFUND_CLOSED: '订单有退款',
            WAIT_BUYER_MODIFY: '订单有退款',
            WAIT_BUYER_SEND: '订单有退款',
            WAIT_SELLER_RECEIVE: '订单有退款'
        };

        if(error_desc[s]) {
            error = error_desc[s];    
        }
        else if (error_desc[rfs]) {
            error = error_desc[rfs];    
        }
        else if ('WAIT_SELLER_SEND' != s) {
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
        method: 'trade.order.detail.get',
        id: tid.tid || tid,
        needOrderEntries: false,
        needInvoiceInfo: false,
        needOrderMemoList: false,
        needLogisticsOrderList: false
    };

    api.post(p, function(err, resp) {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};
