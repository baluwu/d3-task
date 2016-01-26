'use strict';

var uuid= require('node-uuid');

var p_event = {}
    , if_init = {}
    , context = {};

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
 * 注册事件上下文
 * @param ctx {Object} 事件上下文 
 * @return {String} uuid
 */
var register_context = function(ctx) {
    var uid = uuid.v1();

    context[uid] = ctx;

    return uid;
};

/**
 * 获取事件上下文
 * @param context {Object} 事件上下文 
 * @return {String} uuid
 */
var get_context = function(uuid) {
    return context[uuid] || null;
};

/**
 * 释放事件上下文 防止内存泄漏
 * @param context {Object} 事件上下文 
 * @return {String} uuid
 */
var release_context = function(uuid) {
    delete context[uuid];  
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
        handler && handler(data.call_id, data.params);
    });

    if_init[proc.pid] = 1;
};

exports.register_event = register_event;
exports.register_context = register_context;
exports.get_context = get_context;
exports.release_context = release_context;
exports.start = start;

