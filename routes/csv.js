/**
 * Created with JetBrains WebStorm.
 * User: 松松
 * Date: 12-7-31
 * Time: 下午5:12
 * To change this template use File | Settings | File Templates.
 */

'use strict';

exports.download = function (req, res) {
    var DB = require('../helper/db');
    var r = {};
    var year = parseInt(req.params.year, 10),
        month = parseInt(req.params.month, 10);
    res.charset = 'utf-8';
    res.header('Content-Type', 'text/csv;charset=utf-8');
    var filename = '本部前端' + year + '年' + month + '月业务统计报表';
    //IE中文件名要encodeURL，下载时方能正确显示文件名
    filename = encodeURIComponent(filename);
    var date = new Date();
    res.header('Content-Disposition', 'attachment; filename=' + year + '-' + month + '.csv');

    var user = require('../helper/user').frontList;
    Object.keys(user).forEach(function (item) {
        r['id_' + user[item].id] = {
            name: user[item].name,
            "real-name": user[item]['real-name'],
            level1: 0,
            level2: 0,
            level3: 0,
            level4: 0
        }
    });

    var logCollection = new DB.mongodb.Collection(DB.client, 'log');
    logCollection.find({year: year, month: month, level: {'$gt': 0}}, {}).toArray(function (err, result) {

        result.forEach(function (item) {
            if (item.leave === undefined) r['id_' + item.front]['level' + item.level]++;
        });
        Object.keys(r).forEach(function (key) {
            r[key].levelCount = r[key].level1 + r[key].level2 + r[key].level3 + r[key].level4;
            r[key].oh = r[key].level1 * 20 + r[key].level2 * 30 + r[key].level3 * 50 + r[key].level4 * 100;
        });
        var list = {};
        list.arr = [];
        list.arr.push(['姓名', '花名', '简单', '一般', '常规', '复杂', '页面合计', '提成'].join(','));
        Object.keys(r).forEach(function (k) {
            var o = r[k];
            list.arr.push([o['real-name'], o.name, o.level1, o.level2, o.level3, o.level4, o.levelCount, o.oh].join(','));
        });
        var dateTime = date.getFullYear() + '年' +
            (date.getMonth() + 1) + '月' + date.getDate() + '日' + date.getHours() + '时' +
            date.getMinutes() + '分' + date.getSeconds() + '秒';
        list.arr.push(decodeURIComponent(filename));
        list.arr.push('您下载此表的时间为：' + dateTime);
        if (year === date.getFullYear() && month === date.getMonth() + 1) {
            list.arr.push('提示：由于当月还未结束，故数据可能不完整');
        }
        if (year >= date.getFullYear() && month > date.getMonth() + 1) {
            list.arr.push('错误，您要求下载' + year + '年' + month + '月份的统计数据，但该月份还未到来。')
        }
        res.end(require('iconv-lite').encode(list.arr.join('\r\n'), 'GBK'));
    });
};
