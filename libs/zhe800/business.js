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
    
    if (!o) {
        error = '平台接口数据错误';
    }
    else {
        var s = o.status;
        
        var error_desc = {
            3: '订单已发货',
            5: '订单已完成',
            7: '订单已关闭',
            refund_s: {
                1: '1', 2: '2', 3: '3', 5: '5', 7: '7'    
            }
        };

        if(error_desc[s]) {
            error = error_desc[s];    
        }
        else if (o.products) {
            o.products.forEach(function(el) {
                var rfs = el.refund_status;

                if (error_desc.refund_s[rfs]) {
                    error = error_desc.refund_s[rfs];    
                }
            });
        }
        else if ('2' != s) {
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
		method: 'api/erp/v2/orders/' + tid + '.json'
    };

    api.post(p, function(err, resp) {
        cb(null, { msg: err || _parse_error(resp), tid: tid });
    });
};
