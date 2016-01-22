'use strict';

var async = require('async')
    , event = require('../common/event/event')
    , array_split = require('../common/array/array').array_split;

/**
 * 检查平台订单状态
 * @param arr {Object Array} [{plt, access_token, tid}, ...]
 * @param cb callback function
 * @return {Object Array}
 * @constructor
 */
var check = function(arr, cb) {
    
    var t = array_split(arr, 101), ret = [];

    async.eachSeries(t, function(els, a_cb) {

        async.map(els, function(el, b_cb) {
            var mod = require('../libs/' + el.plt + '/business');

            if (!mod) { 
                return b_cb(
                    null, 
                    { msg: '未知平台订单', tid: el.tid }
                );
            }
            
            mod.check_trade_status(
                el.access_token,
                el.tid, b_cb
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

/**
 * 子进程消息接收和发送
 * @param arr {Object Array} [{plt, access_token, tid}, ...]
 * @param cb callback function
 * @return {Object Array}
 * @constructor
 */
var main = function() {
    event.register_event('CK_TRADE_ST', function(data) {
        check(data, function(err, r) {
            process.send({ type: 'CK_FIN', params: r });        
        }); 
    });

    process.on('exit', function() { process.send({ type: 'CHILD_EXIT', params: process.pid }); });

    event.start(process);
};

main();


