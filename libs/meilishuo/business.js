'use strict';

var api = require('./api');
var handle_trades = require('../../common/trade/download_trade_handler');
var decode_utf8 = require('../../common/utf8/utf8').decodeUTF8;

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
        var s = o.order_detail_get_response.info.order.status_text;
        
        var error_desc = {
            '等待付款': '订单未付款',
            '等待确认收货': '订单已发货',
            '交易成功': '订单已完成',
            '交易关闭': '订单已关闭'
        };

        if(error_desc[s]) {
            error = error_desc[s];    
        }
        else if (o.order_detail_get_response.info.goods) {
            var orders = o.order_detail_get_response.info.goods;
            orders.forEach(function(el) {
                if (el.refund_status_text != '') {
                    error = '订单有退款';
                }
            });
        }
        else {
            error = '未知错误';
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
exports.check_trade_status = function(app_type, access_token, tid, cb) {
    var p = {
        app_type: app_type,
        access_token: access_token,
        order_id: tid,
        method: 'meilishuo.order.detail.get'
    };

    api.post(p, function(err, resp) {
        var _err = err || _parse_error(resp);
        _err && tid.tid && (_err = tid.tid + _err); 
        cb(null, { msg: _err, tid: tid.ptid || tid });
    });
};

/*适配函数*/
var fn = {
    get_trades (resp) { return resp.order_list_get_response.info; },
    get_tid (trade) { return trade.order.order_id; },
    get_status (trade) { return trade.order.status_text; },
    get_platfrom_trades (app_type, seller_nick, session, v) {
        var pall = [];

        v.q_tids.forEach(function(tid) {
            let p = {
                app_type: app_type,
                access_token: session,
                method: 'meilishuo.order.detail.get',
                order_id: tid 
            };

            pall.push( new Promise((resolve, reject) => {
                api.post(p, (err, resp) => {
                    if (err || resp.indexOf('error_response') != -1) {
                        reject('get trade detail error');    
                    }
                    else {
                        if (v.add_trades[tid] === 0) v.add_trades[tid] = decode_utf8(resp);
                        if (v.edit_trades[tid] === 0) v.edit_trades[tid] = decode_utf8(resp);

                        resolve(resp);
                    }
                }); 
            }));
        });

        return Promise.all(pall);
    },
    download_trades (app_type, params) {
         var session = params.access_token;
         var p = {
            app_type: app_type,
            access_token: params.access_token,
            method: 'meilishuo.order.list.get',
            page: params.page,
            page_size: params.page_size,
            uptime_start: params.last_trans_time,
            ctime_start: params.last_trans_time,
            ctime_end: params.trans_end_time,
            uptime_end: params.trans_end_time
        };

        return new Promise((resolve, reject) => {
            api.post(p, (err, resp) => {
                if (err) return reject(err);
                else resolve(resp);
            }); 
        }).then(r => {
            var o_r = JSON.parse(r);
            
            if (!o_r.order_list_get_response ||
                !o_r.order_list_get_response.total_num) {
                throw 'No Platform Trade';    
            }

            return handle_trades({
                platform: 'meilishuo', 
                app_type: app_type, 
                session: params.access_token, 
                seller_nick: params.seller_nick, 
                fn: fn, 
                resp: r,
                o_resp: o_r,
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
    }
};

exports.download_trades = fn.download_trades;

/*
fn.download_trades(4, {
    seller_nick: '淘瑞流行馆',
    access_token: '153e319388f1c9522fede24d60bed95d',
    page: 0,
    page_size: 5,
    last_trans_time: '2015-05-02 00:00:01',
    trans_end_time: '2015-05-03 00:00:01'
});
*/


