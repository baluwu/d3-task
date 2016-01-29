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

    var r = o.order_get_response;
    var e = o.error_response;

    if ((!r || r.code !== '0') || e) {
        error = (e && e.zh_desc) || '无法获取订单数据';
    }
    else {
        var s = r.order ? r.order.orderInfo.order_state : '';

        if ('WAIT_SELLER_STOCK_OUT' == s || 'WAIT_SELLER_DELIVERY' == s) {
            error = '';
        }
        else {
            var err_desc = {
                DISTRIBUTION_CENTER_RECEIVED: '订单已发货',
                WAIT_GOODS_RECEIVE_CONFIRM: '订单已发货',
                RECEIPTS_CONFIRM: '订单已发货',
                FINISHED_L: '订单已完成',
                TRADE_CANCELED: '订单已取消',
                LOCKED: '订单有退款',
                SEND_TO_DISTRIBUTION_CENER: '订单已发货'
            }[s];

            if (err_desc)
            {
                error = err_desc;
            }    
            else { 
                error = 
                    (o.error_response && o.error_response.zh_desc) || 
                    ('订单状态不对:' + s);
            }
        }
    }

    return error;
};

/**
 * 检查订单状态是否能发货
 * @param app_type {String} 平台应用类型
 * @param access_token {String} 平台授权码
 * @param tid {String} 订单号
 * @param cb {Function} 回调函数
 * @constructor
 */
exports.check_trade_status = function(app_type, access_token, tid, cb) {
    var p = {
        app_type: app_type,
        access_token: access_token,
        method: '360buy.order.get',
        optional_fields: 'order_id,order_state',
        param_json: 
        {
            order_id: tid.tid || tid
        }
    };
    
    api.post(p, function(err, resp) {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};
