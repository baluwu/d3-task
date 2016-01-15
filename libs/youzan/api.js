
'use strict';

var _ = require('underscore')
    , URL = require('url')
    , querystring = require('querystring')
    , request = require('../../common/http/http').request
    , cfg = require('../../config/open'); 

/**
 * request method
 * @param params api param
 * @constructor
 */
var post = function (params, callback) {
    var u = URL.parse(cfg.YOUZAN_URL);
    console.dir(params);
    request(u.hostname, u.path, u.port, {}, querystring.stringify(params), callback);
}

exports.post = post;
