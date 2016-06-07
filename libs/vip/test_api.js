
var api = require('./api');

api.post({
    service: 'vipapis.delivery.DvdDeliveryService',
    method: 'getOrderList',
    st_add_time: '2016-05-01 10:00:00',
    et_add_time: '2016-06-01 10:00:00',
    vendor_id: '550',
    page: 1,
    limit: 10
}, (e, r) => {
    console.log(r);
});
