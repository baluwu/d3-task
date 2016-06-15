'use strict';

var async = require('async')
    , event = require('../common/event/event')
    , db = require('../common/database/mysql')
    , each_serial = require('../common/to-promise').each_serial
    , cn_date = require('../common/date/date').cn_date
    , array_split = require('../common/array/array').array_split;

/**
 * 检查平台订单状态
 * @param arr {Object Array} [{plt, access_token, tid}, ...]
 * @param cb callback function
 * @return {Object Array}
 * @constructor
 */
var check = function(app_type, arr, cb) {
    var t = array_split(arr, 101), ret = [];

    async.eachSeries(t, function(els, a_cb) {

        async.map(els, function(el, b_cb) {
            var mod;
            try {
                mod = require('../libs/' + el.plt + '/business');
            }
            catch (e) { 
                console.log(e.message); 
                return b_cb( null, {msg: '未知平台订单', tid: el.tid });
            }

            mod.check_trade_status(
                app_type,
                el.access_token,
                el.ptid ? {ptid: el.ptid, tid: el.tid} : el.tid, 
                b_cb
            );

        }, function(err, r) { 
            
            if (r.length > 0) {
                /* remove the orders which status is availble to send */
                r.forEach(function(el) {
                    if (el.msg !== '') {
                        ret.push(el);    
                    } 
                });    
            }
            
            a_cb(err, r);
        });

    }, function(err) {
        cb(null, ret);
    });
};

var autoload_trade = function(platform) {
    var ENV = require('../config/server')['ENV'];
    var DBCFG = require('../config/db')[ENV]['SYSTEM'];

    db.init(DBCFG);

    return db.doQuery(
        `SELECT open_type, business_id, store_id, user_nick, session_key FROM e_business_store where open_type='${platform}'`,
        0
    ).then(r => {
        var to_download = function(el) {
            return db.doQuery(
                `SELECT is_buyout FROM e_business WHERE business_id='${el.business_id}'`, 0
            ).then(rs => {
                var now = new Date();
                var mod;
                try {
                    mod = require('../libs/' + platform + '/business');
                }
                catch(err) {
                    console.log(err.stack);    
                }

                var param = {
                    platform: platform,
                    access_token: el.session_key,
                    bid: el.business_id,
                    app_type: rs[0].is_buyout,
                    seller_nick: el.user_nick,
                    last_trans_time: cn_date((new Date()).setTime(now.getTime() - 86400 * 7 * 1000)),
                    trans_end_time: cn_date(),
                    store_id: el.store_id,
                    page: platform == 'meilishuo' ? 0 : 1,
                    page_size: 2,
                    load_all: true
                };

                return mod.download_trades(param.app_type, param);
            });
        }; 
        
        if (!r.length) return 0;

        return each_serial(r, to_download).then(() => {
            return Promise.resolve(1);
        }).catch(err => { console.log(err, err.stack); });
    });
};

/**
 * 子进程消息接收和发送
 * @param arr {Object Array} [{plt, access_token, tid}, ...]
 * @param cb {Function} callback function
 * @return null
 */
var main = function() {
    event.register_event('CK_TRADE_ST', function(call_id, app_type, data) {
        check(app_type, data, function(err, r) {
            process.send({ type: 'CK_FIN', call_id: call_id, params: r });        
        }); 
    });

    event.register_event('AUTOLOAD_TRADE', function(call_id, app_type, platform) {
        autoload_trade(platform).then( (r) => {
            process.send({ type: 'AUTOLOAD_TRADE_FIN', call_id: call_id, params: r });        
        }); 
    });

    process.on('exit', function() { process.send({ type: 'CHILD_EXIT', params: process.pid }); });

    event.start(process);
};

main();


