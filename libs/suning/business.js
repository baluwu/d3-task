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

    var r = o.sn_responseContent && 
        o.sn_responseContent.sn_body;

    if(r && r.orderGet && r.orderGet.orderDetail) {
        var s = r.orderGet.orderTotalStatus;

        var err_desc = {
            20: '订单已发货',
            21: '订单已部分发货',
            30: '订单已完成',
            40: '订单已关闭'
        }[s];

        if (err_desc) {
            error = err_desc;    
        }
        else {
            var r = r.orderGet.orderDetail;
            r.forEach(function(el) {
                if (el.returnOrderFlag == 1) {
                    error = '订单有退款';    
                } 
            });
        }
    }
    else {
        error = '无法获取订单信息';    
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
exports.check_trade_status = function(app_type, access_token, tid, cb) {
    var p = {
        app_type: app_type,
        access_token: access_token,
        method: 'suning.custom.order.get',
        param_json: JSON.stringify(
            {
                sn_request: { sn_body: { orderGet: { orderCode: tid.tid || tid } } }
            }
        )
    };
    
    api.post(p, function(err, resp) {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};
