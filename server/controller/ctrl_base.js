/**
 * Copyright(c) 2013-2015 www.diansan.com
 *
 * @file ctrl_base.js 
 * @author W.G 2015-08-12
 * @version 1.0
 * @description controller's base class
 */

'use strict';

var url = require('url');
var qrystr = require('querystring');

var ctrlBase = {

    set_stream: function(res) {
        this.res = res;
    },

    http_head: function(error_code, type) {

        var content_type = {
            html: { 'Content-Type': 'text/html' },
            text: { 'Content-Type': 'text/plain' },
            json: { 'Content-Type': 'application/json' }
        };

        this.res.writeHead(error_code || 200, content_type[(type || 'text')]);
    },

    end: function() {
        this.res.end();
    },

    echo: function(error) {
        this.res.write(error);
    },
};

exports.base = ctrlBase;
