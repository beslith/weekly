/*
 *
 * 记录业务日志
 *
 * */
var express = require('express')
    , routes = require('./routes');
var app = module.exports = express.createServer();

// Configuration

app.configure(function () {
    app.set('views', __dirname + '/views');
    app.set('view engine', 'jade');
    app.use(express.bodyParser());
    app.use(express.cookieParser());
    app.use(express.session({ secret:"keyboard cat" }));
    app.use(express.methodOverride());
    app.use(app.router);
    app.use(express.static(__dirname + '/assets'));
});

app.configure('development', function () {
    app.use(express.errorHandler({ dumpExceptions:true, showStack:true }));
});

app.configure('production', function () {
    app.use(express.errorHandler());
});

// Routes

app.get('/', routes.index);

app.post('/save-log', routes.save_log);

app.get('/record-log', routes.record_log);

app.get('/show_log/:date', routes.show_log);

app.get('/helper/add', routes.helper);

app.post(/login(\/)?.*/, routes.login);

app.get('/log-out', routes.log_out);

app.listen(80, function () {
    console.log("Express server listening on port %d in %s mode", app.address().port, app.settings.env);
});
