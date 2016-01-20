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

    var r = o.data && o.data.order_get_response && o.data.order_get_response;

    if (!r || r.code !== '0') {
        error = '无法获取订单数据';
    }
    else {
        var s = r.order ? r.order.orderInfo.order_state : '';

        if ('WAIT_SELLER_STOCK_OUT' != s || 
            'WAIT_SELLER_DELIVERY' != s) {

            if ('DISTRIBUTION_CENTER_RECEIVED' == s ||
                'WAIT_GOODS_RECEIVE_CONFIRM' == s ||
                'RECEIPTS_CONFIRM' == s ||
                'FINISHED_L' == s || 
                'TRADE_CANCELED' == s || 
                'LOCKED' == s || 
                'SEND_TO_DISTRIBUTION_CENER' == s
            ) {
                error = '订单发货失败， 原因: (1)订单已关闭 (2)被锁定 (3)已发货 (4)已取消';
            }    
            else {
                error = '订单状态不对:' + s;     
            }
        }
        else { error = (o.data && o.data.error_response && o.data.error_response.zh_desc) || ''; }
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
        method: '360buy.order.get',
        param_json: 
        {
            order_id: tid
        }
    };

    api.post(p, function(resp) {
        cb(_parse_error(resp), null);
    });
};
