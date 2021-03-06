/**
 * Created with JetBrains WebStorm.
 * User: 松松
 * Date: 12-8-22
 * Time: 上午9:25
 * 负责记录日志和更新日志
 */

'use strict';

var DB = require('../helper/db');

exports.save_log = function (req, res) {
    var errorMSG = Object.create(null);
    errorMSG.errorList = [];

    var data = Object.create(null), body = req.body;
    data['page-name'] = body['page-name'];
    data['level'] = parseInt(body['level'], 10);
    data['design'] = body['design'];
    data['customer'] = body['customer'];
    data['online-url'] = body['online-url'];
    data['tms-url'] = body['tms-url'];
    data['note'] = body['note'];
    data['year'] = parseInt(body['year'], 10);
    data['month'] = parseInt(body['month'], 10);
    data['date'] = parseInt(body['date'], 10);
    data['front'] = req.session.userid;

    var isEdit = body['type'] === 'edit';

    if (!require('./login').isLogin(req)) {
        errorMSG.errorList.push({msg: '登陆过期，请刷新页面重新登陆'});
    }

    if (data['page-name'] == undefined || data['page-name'].length < 1) {
        errorMSG.errorList.push({name: 'page-name', msg: '页面名称不能为空'});
    }

    if (isNaN(data['level'])) {
        errorMSG.errorList.push({name: 'level', msg: '需要页面对应的等级'});
    }

    if (isNaN(data['year']) || isNaN(data['month']) || isNaN(data['date'])) {
        isNaN(data['year']) ? errorMSG.errorList.push({name: 'year', msg: '年份填写错误'}) : undefined;
        isNaN(data['month']) ? errorMSG.errorList.push({name: 'month', msg: '月份填写错误'}) : undefined;
        isNaN(data['date']) ? errorMSG.errorList.push({name: 'date', msg: '日期填写错误'}) : undefined;
    } else {
        if (data['year'] < 1949 || data['year'] > 2100) {
            errorMSG.errorList.push({name: 'year', msg: '年份越界'});
        }

        if (data['month'] < 1 || data['month'] > 12) {
            errorMSG.errorList.push({name: 'month', msg: '月份越界'});
        }

        if (data['month'] == 2) {
            if (data['year'] % 4 == 0) {
                if (data['date'] > 29 || data['date'] < 1) {
                    errorMSG.errorList.push({name: 'date', msg: '闰年2月日期无效'});
                }
            } else {
                if (data['date'] > 28 || data['date'] < 1) {
                    errorMSG.errorList.push({name: 'date', msg: '2月日期无效'});
                }
            }
        } else {
            if ([1, 3, 5, 7, 8, 10, 12].indexOf(data['month']) >= 0) {
                if (data['date'] < 1 || data['date'] > 31) {
                    errorMSG.errorList.push({name: 'date', msg: '日期无效'});
                }
            } else if ([4, 6, 9, 11].indexOf(data['month']) >= 0) {
                if (data['date'] < 1 || data['date'] > 30) {
                    errorMSG.errorList.push({name: 'date', msg: '日期无效'});
                }
            }
        }
    }

    if (isEdit && !body['object_id']) errorMSG.errorList.push('无法获取即将更新文档的必要信息');

    if (errorMSG.errorList.length > 0) {
        res.end(JSON.stringify(errorMSG), undefined, '\t');
        return;
    }

    var collection = new DB.mongodb.Collection(DB.client, 'log');

    if (isEdit) {
        collection.update({
            _id: DB.mongodb.ObjectID(body['object_id']),
            front: req.session.userid
        }, data, {}, function () {
            res.end(JSON.stringify({'status': true}, undefined, '    '));
        });
    } else {
        collection.insert(data, {safe: true},
            function () {
                //如果当前用户是第一次添加日志，则立即更新用户列表的缓存
                if (require('../helper/user').frontList['id_' + req.session.userid] === undefined) {
                    require('../helper/user').updateFrontList({
                        callback: function () {
                            res.end(JSON.stringify({'status': true}, undefined, '    '));
                        }
                    });
                } else {
                    res.end(JSON.stringify({'status': true}, undefined, '    '));
                }
                //When adding a log, automatic backup of the database
                require('../helper/dump').dump(req);
            });
    }
};


