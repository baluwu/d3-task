
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
    var auth = cfg.get_auth('youzan', params.app_type);
    var u = URL.parse(auth.u);

    delete params.app_type;
    
    request('POST', u.hostname, u.path, u.port, {}, querystring.stringify(params), callback);
}

exports.post = post;
