/**
 * Copyright(c) 2013-2015 www.diansan.com
 *
 * @file mysql.js 
 * @author W.G 2015-08-12
 * @version 1.0
 * @description mysql database wrapper
 */

'use strict';

var mysql = require('mysql'),
    table = require('./tables').table;

var DB = {
    init: function(cfg) {
        console.log('use: ', cfg);
        DB.cfg = cfg;       
    },

    from: function(tb) {
        DB.table_name = tb;
        return DB;
    },

    field: function(fld) {
        DB.fields = fld;
        return DB;
    },

    where: function(w) {
        var where = [];

        for(var k in w) {

            var v = w[k];

            if (typeof v === 'string') {
                where.push( k + '=\'' + v + '\'' );
            }
            else if (typeof v === 'object') {
                where.push(
                    k + v.op + (v.should_quoto ? '\'' : '') + v.lv + (v.should_quoto ? '\'' : '') 
                );
            }
            else {
                where.push( k + '=' + v);
            }
        }

        DB.condition = where.join(' AND ');
        return DB;
    },

    limit: function(offset, page_size) {
        DB.limits = ' LIMIT ' + offset + ', ' + page_size;
        return DB;
    },

    orderBy: function(odb, sort) {
        DB.order_by = ' ORDER BY `' + odb + '` ' + sort;
        return DB;
    },

    groupBy: function(odb, sort) {
        DB.group_by = ' GROUP BY `' + odb + '` ' + sort;
        return DB;
    },

    exec: function(bid) {
        if (!DB.table_name) return false;
        
        var sql = [
            'SELECT ',
            DB.fields || '*',
            ' FROM {',
            DB.table_name,
            '} WHERE ',
            (DB.condition || '1=1') + ' ',
            (DB.order_by || '') + ' ',
            (DB.group_by || '') + ' ',
            DB.limits || ''
        ].join('');

        return DB.doQuery(sql);
    },

    /*这里不分库分表*/
    doQuery: function(sql, cfg) {
        var link = DB.createConnection(cfg);

        if (!link) console.log('connect database error');

        return new Promise ((resolve, reject) => {
            link.query(sql, (err, r) => {
                err && console.log('ERROR: ', err.stack, sql);

                if (err) reject(Error(err));
                else resolve(r);
            });

            link.end();
        });
    },

    createConnection: function(cfg) {
        var conn = mysql.createConnection(cfg || DB.cfg);
        conn.connect();
        return conn;
    }
}; 

module.exports = DB;
