'use strict';

var p_event = {}, if_init = {};

/**
 * 注册进程事件
 * @param type {String} 类型
 * @param handler {Function} 处理函数 
 * @constructor
 */
var register_event = function(type, handler) {
    p_event[type] = handler;
};

/**
 * 开始监听进程事件
 * @param proc 需要监听的进程
 * @constructor
 */
var start = function(proc) {
    if (if_init[proc.pid]) {
        return ;
    }

    proc.on('message', function(data) {
        var handler = p_event[data.type];
        handler && handler(data.params);
    });

    if_init[proc.pid] = 1;
};

exports.register_event = register_event;
exports.start = start;

