'use strict';

var post = require('../libs/jos/api').post;

/* 京东订单发货 */
var p1 = {
    'access_token': '', //授权码
    'method': '360buy.overseas.order.sop.delivery',
    'param_json': 
    {
        'logistics_id': '', //物流公司id
        'order_id': '', //订单id
        'waybill': '' //物流id
    }
};

post(p1, function(err, r) {
    console.dir(err);    
});

