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
 
    var e = o.result
        , o = o.response && 
          o.response.orderInfo && 
          o.response.orderInfo.orderDetail;

    if ((e && e === 'false') || !o) {
        error = '平台接口数据错误';
    }
    else {
        var s = o.orderStatus;
        
        var error_desc = {
            ORDER_OUT_OF_WH: '订单已发货',
            ORDER_RECEIVED: '订单已发货',
            ORDER_FINISH: '订单已完成',
            ORDER_CANCEL: '订单已取消'
        }[s];

        if(error_desc) {
            error = error_desc;    
        }
        else if ('ORDER_TRUNED_TO_DO' != s) {
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
        sessionKey: access_token,
        method: 'yhd.order.detail.get',
        orderCode: '' + tid
    };

    api.post(p, function(err, resp) {
        cb(null, { msg: _parse_error(resp), tid: tid });
    });
};
