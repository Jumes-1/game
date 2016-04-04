var express = require('express');
var path = require('path');
var favicon = require('serve-favicon');
var logger = require('morgan');
var cookieParser = require('cookie-parser');
var bodyParser = require('body-parser');

var routes = require('./routes/index');
var users = require('./routes/users');

var app = express();

// view engine setup
app.set('views', path.join(__dirname, 'views'));
app.set('view engine', 'hbs');

// uncomment after placing your favicon in /public
//app.use(favicon(path.join(__dirname, 'public', 'favicon.ico')));
app.use(logger('dev'));
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: false }));
app.use(cookieParser());
app.use(express.static(path.join(__dirname, 'public')));

app.use('/', routes);
app.use('/users', users);

var currentPlayers = [];

// Socket Functions
var sf = [];

function findValueArray(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][0] == value) {
			return i;
		}
	}
}

sf.push([
	'connection',
	function(socket) {
		// When someone joins tell everyone.
		socket.broadcast.emit('joined', 'Jumes');
		// Users id -> socket.client.conn.id
		console.log(socket.client.conn.id + ' has joined.');
		currentPlayers.push([socket.client.conn.id, 0, 0]);
		socket.broadcast.emit('current', currentPlayers);
		socket.emit('current', currentPlayers);
		console.log(currentPlayers);

		// When someone moves tell everyone.
		socket.on('move', function(data) {
			var id = socket.client.conn.id;
			console.log(id + ' moved');
			var arrayID = findValueArray(id, currentPlayers);
			currentPlayers[arrayID][1] = data.top;
			currentPlayers[arrayID][2] = data.left;
			console.log(currentPlayers);
			console.log(data);
			socket.broadcast.emit('moved', currentPlayers);
			socket.emit('moved', currentPlayers);
		});

		socket.on('name change', function(data) {
			var id = socket.client.conn.id;
			var arrayID = findValueArray(id, currentPlayers);
			currentPlayers[arrayID][3] = data;
			socket.broadcast.emit('current', currentPlayers);
		});
	}
]);

// Export Socket.io Functions
app.socketFunc = sf;

// catch 404 and forward to error handler
app.use(function(req, res, next) {
	var err = new Error('Not Found');
	err.status = 404;
	next(err);
});

// error handlers

// development error handler
// will print stacktrace
if (app.get('env') === 'development') {
	app.use(function(err, req, res, next) {
		res.status(err.status || 500);
		res.render('error', {
			message: err.message,
			error: err
		});
	});
}

// production error handler
// no stacktraces leaked to user
app.use(function(err, req, res, next) {
	res.status(err.status || 500);
	res.render('error', {
		message: err.message,
		error: {}
	});
});


module.exports = app;
