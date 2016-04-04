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

		// Base setup for a new user.
		currentPlayers.push([socket.client.conn.id, 20, 20]);
		
		// Tell everyone where everyone is.
		socket.broadcast.emit('current', currentPlayers);
		socket.emit('current', currentPlayers);

		// Wait for a user to move.
		socket.on('move', function(data) {
			// Get the id of the user that moved
			var id = socket.client.conn.id;
			
			// Find the user in the array
			var arrayID = findValueArray(id, currentPlayers);

			// Set the position of the user on the board.
			currentPlayers[arrayID][1] = data.top;
			currentPlayers[arrayID][2] = data.left;

			// Tell everyone that a player has moved.
			socket.broadcast.emit('moved', currentPlayers);
			socket.emit('moved', currentPlayers);
		});

		// Wait for a user to submit a name change.
		socket.on('name change', function(data) {
			// Get the id of the user that wanted a name change.
			var id = socket.client.conn.id;

			// Find the user in the array
			var arrayID = findValueArray(id, currentPlayers);

			// Get the name they wanted, add it to their array.
			currentPlayers[arrayID][3] = data;

			// Tell everyone that user updated their username.
			socket.broadcast.emit('current', currentPlayers);
		});

		socket.on('picture change', function(data) {
			// Get the id of the user that wanted a name change.
			var id = socket.client.conn.id;

			// Find the user in the array
			var arrayID = findValueArray(id, currentPlayers);

			// Get the picture they wanted, add it to their array. 
			currentPlayers[arrayID][4] = data;

			// Tell everyone that user updated their picture.
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
