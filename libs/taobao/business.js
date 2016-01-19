'use strict';

var api = require('./api');

var _parse_error = function(resp) {
    var error = '';

    try {
        var o = JSON.parse(resp);

        if (o.msg || o.sub_msg) {
            error = (o.msg || 'unknown error') + ':' + (o.sub_msg || 'unknown error');    
        }
        else {
            var s = o.trade ? o.trade.status : '';

            if ('WAIT_SELLER_SEND_GOODS' != s || 
                s != 'SELLER_CONSIGNED_PART') {

                if ('WAIT_BUYER_CONFIRM_GOODS' == s ||
                    'TRADE_FINISHED' == s ||
                    'TRADE_CLOSED' == s ||
                    'TRADE_CLOSED_BY_TAOBAO' == s) {
                    
                    error = '卖家已发货或交易已关闭';
                }    
                else {
                    error = '订单状态不对:' + s;     
                }
            }
            else {
                var ords = o.trade && o.trade.orders ? o.trade.orders.order : '';

                _.each(ords, function(v, k) {
                    if (!(v.refund_status == 'NO_REFUND' || 
                        v.refund_status == 'CLOSED')) {
                        
                        error = '订单商品有退款';
                    }
                });

            }
        }
    }
    catch (e) {
        error = 'parse error';   
    }

    return error;
};

exports.check_trade_status = function(access_token, tid, cb) {
    var p = {
        access_token: access_token,
        method: '360buy.overseas.order.sop.delivery',
        param_json: 
        {
            order_id: tid
        }
    };

    api.post(p, function(resp) {
        cb(_parse_error(resp), null);
    });
};
