'use strict';

var api = require('./api');
var handle_trades = require('../../common/trade/download_trade_handler');
var db = require('../../common/database/mysql');

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
        var s = o.result[0].order_status;
        
        var error_desc = {
            'STATUS_60': '已完成',
            'STATUS_22': '已发货',
            'STATUS_53': '退货未审核',
            'STATUS_117': '退货审核中',
            'STATUS_54': '退货已审核',
            'STATUS_55': '拒收回访',
            'STATUS_58':  '退货已返仓',
            'STATUS_70':  '已拒收',
            'STATUS_45':  '退款处理中',
            'STATUS_49':  '已退款',
            'STATUS_25':  '已签收',
            'STATUS_97':  '已取消',
            'STATUS_118': '订单申请断货',
            'STATUS_119': '断货申请通过'
        };

        if(error_desc[s]) {
            error = error_desc[s];    
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
exports.check_trade_status = function(app_type, access_token, tid, user_nick, cb) {
    var p = {
        app_type: app_type,
        service: 'vipapis.delivery.DvdDeliveryService',
        method: 'getOrderStatusById',
        access_token: access_token,
	vendor_id: user_nick,
        order_id: tid
    };

    api.post(p, (err, resp) => {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};

/*适配函数*/
var fn = {
    get_trades (resp) { return resp.result.dvd_order_list; },
    get_tid (trade) { return trade.order_id; },
    get_status (trade) { return trade.order_status; },
    get_platfrom_trades (app_type, vendor_id, session, v) {
        
        var pall = [];

        v.q_tids.forEach((tid) => {
            let p = {
                app_type: app_type,
                service: 'vipapis.delivery.DvdDeliveryService',
                method: 'getOrderDetail',
                order_id: tid,
                vendor_id: vendor_id,
                access_token: session
            };

            pall.push( new Promise((resolve, reject) => {
                api.post(p, (err, resp) => {
                    if (err || resp.indexOf('"returnCode":"0"') == -1) {
                        reject('get trade detail error');    
                    }
                    else {
                        if (v.add_trades[tid] === 0) v.add_trades[tid] = resp;
                        if (v.edit_trades[tid] === 0) v.edit_trades[tid] = resp;

                        resolve(resp);
                    }
                }); 
            }));
        });

        return Promise.all(pall);
    },

    get_order_form_detail (o_resp) {
        return o_resp.result.orderDetails;
    },

    /**
     * 拼接完整trade_response
     * @param list_trade {Object}
     * @param detail_trade {String}
     * @return {String}
     */
    get_trade_resp (list_trade, detail_trade, add_goods) {
        var o_d;

        try {
            o_d = JSON.parse(detail_trade);
            o_d = fn.get_order_form_detail(o_d);

            o_d.forEach((el) => {
                if (add_goods && el.barcode && !add_goods[el.barcode]) {
                    add_goods[el.barcode] = el;    
                }
            });
        }
        catch (e) {
            throw(new Error(e.toString()));    
        }

        list_trade.orders = o_d;

        return JSON.stringify(list_trade);
    }, 

    /*下载订单*/
    download_trades (app_type, params) {
        var session = params.access_token;
        var p = {
            app_type: app_type,
            service: 'vipapis.delivery.DvdDeliveryService',
            method: 'getOrderList',
            access_token: params.access_token,
            vendor_id: params.seller_nick || params.vendor_id,
            page: params.page,
            limit: params.page_size || params.limit,
            st_add_time: params.last_trans_time || params.st_add_time,
            et_add_time: params.trans_end_time || params.et_add_time
        };

        return new Promise((resolve, reject) => {
            api.post(p, (err, resp) => {
                if (err) {
                    return reject(err.toString());    
                }
                
                var o;
                try {
                    o = JSON.parse(resp);
                }
                catch (err) {
                    return reject('返回结果非JSON格式');    
                }

                if (o.returnCode !== '0') return reject(o.returnMessage || '接口出错了');
                else if (o.result && o.result.total && o.result.dvd_order_list) {
                    resolve({ resp: resp, o_resp: o});
                }
                else reject('没有订单');
            }); 
        }).then(r => {
            return handle_trades({
                platform: 'vip', 
                app_type: app_type, 
                session: params.access_token,
                seller_nick: params.seller_nick || params.vendor_id, 
                fn: fn, 
                resp: r.resp,
                o_resp: r.o_resp,
                bid: params.bid,
                store_id: params.store_id
            });
        }).then((r) => {
            if (params.load_all) {
                p.page++;
                p.access_token = session;
                p.store_id = params.store_id;
                p.bid = params.bid;
                p.load_all = params.load_all;

                return fn.download_trades(app_type, p);  
            }
            
            return r;
        })
        .catch(err => {
            console.log(err.stack || err);    
        });
    },
    
    /*VIP从订单中添加商品*/
    add_goods (store_id, bid, arr) {
        var barcodes = [];

        for (var barcode in arr) {
            barcodes.push(barcode);    
        }

        return Promise.resolve(1).then(() => {
            if (!barcodes.length) return 0;

            var ENV = require('../../config/server')['ENV'];
            var DBCFG = require('../../config/db')[ENV]['otherdb' + (bid % 10)];

            var tb_1, tb_2;

            if(bid >= 2300) {        
                tb_1 = 'e_goods_platform_' + (Math.floor(bid / 10) % 1000);
                tb_2 = 'e_goods_skus_' + (Math.floor(bid / 10) % 1000);
            } else {
                tb_1 = 'e_goods_platform_' + (Math.floor(bid / 10) % 100);
                tb_2 = 'e_goods_skus_' + (Math.floor(bid / 10) % 100);
            }

            return db.doQuery(
                'SELECT barcode FROM ' + tb_1 + ' WHERE business_id=' + bid + ' AND op_sku_iid IN(\'' + barcodes.join('\',\'') + '\')',
                DBCFG
            ).then(r => {
                r.forEach(el => {
                    var bc = el.barcode;
                    if (arr[bc]) delete arr[bc];
                });
            }).then(() => {
                var now = Math.floor((new Date()).getTime() / 1000);
                var i_plt_sql = 
                    'INSERT INTO ' + tb_1 + '(`store_id`, `business_id`, `outer_id`, `op_num_iid`, `op_goods_name`,' + 
                    '`op_sku_iid`, `barcode`, `attribute_name`, `attribute_value`, `goods_status`, `sale_price`) ' +
                    'VALUES ';

                var i_sku_sql = 
                    'INSERT INTO ' + tb_2 + '(`business_id`, `outer_sku_id`, `barcode`, `num_iid`, ' + 
                    '`standards`, `created`, `status`, `simplename`, `op_sku_iid`) VALUES ';

                var len = 0;
                for (var barcode in arr) {
                    len++;

                    var el = arr[barcode];
                    
                    i_plt_sql += `(${store_id}, ${bid}, '${el.barcode}', '${el.art_no}', '${el.product_name}', '${el.barcode}', '${el.barcode}', 'size', '${el.size}', '1', ${el.sell_price}),`;
                    i_sku_sql += `(${bid}, '${el.barcode}', '${el.barcode}', '${el.art_no}', '${el.size}', ${now}, '1', '${el.product_name}', '${el.barcode}'),`;
                }

                if (len) {
                    i_plt_sql = i_plt_sql.substr(0, i_plt_sql.length - 1);
                    i_sku_sql = i_sku_sql.substr(0, i_sku_sql.length - 1);

                    var u_sql = 
                        `UPDATE ${tb_1} a JOIN ${tb_2} b 
                        ON a.business_id=b.business_id AND a.barcode=b.barcode
                        SET a.sku_id=b.sku_id WHERE a.business_id=${bid} AND a.store_id=${store_id}`;

                    return Promise.all([db.doQuery(i_plt_sql, DBCFG), db.doQuery(i_sku_sql, DBCFG), db.doQuery(u_sql, DBCFG)]);
                }

                return 0;
            });

        })
    }
};

exports.download_trades = fn.download_trades;
