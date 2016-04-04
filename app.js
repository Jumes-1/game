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

function findValueArray(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][0] == value) {
			return i;
		}
	}
}

function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

var currentPlayers = [];
var gold = { top: random(0, (500 - 32) ), left: random(0, (600 - 32) ) };
currentPlayers = [['golden-star', gold.top, gold.left, 'Golden Star', 'images/golden-star.png']];

// Socket Functions
var sf = [];

sf.push([
	'connection',
	function(socket) {

		// When someone joins tell everyone.
		socket.broadcast.emit('joined', 'Jumes');

		// Users id -> socket.client.conn.id
		console.log(socket.client.conn.id + ' has joined.');

		// Base setup for a new user.
		currentPlayers.push([socket.client.conn.id, 20, 20, socket.client.conn.id, 'images/mario.png', 0]);
		
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

			// Setup Golden star detection.
			var top = { min: currentPlayers[0][1], max: currentPlayers[0][1] + 32 };
			var left = { min: currentPlayers[0][2], max: currentPlayers[0][2] + 32 };

			for (var i = 1; i < currentPlayers.length; i++) {
				var posWin = currentPlayers[i];

				if (posWin[3] === null) {
					console.log('Gone Null');
				}

				// This shit is a bitch to explain.
				// Short -> Checks if any of the players are in the golden star.
				if ( ( (( posWin[1] < top.max ) && ( posWin[1] > top.min )) || (( posWin[1] + 32 < top.max) && (posWin[1] + 32 > top.min)) ) &&
				( (( posWin[2] < left.max ) && ( posWin[2] > left.min )) || (( posWin[2] + 32 < left.max ) && ( posWin[2] + 32  > left.min )) ) ) {
					
					if (typeof currentPlayers[i][5] === 'undefined') {
						currentPlayers[i][5] = 1;
					} else {
						currentPlayers[i][5]++;
					}
					var gold = { top: random(0, (500 - 32) ), left: random(0, (600 - 32) ) };
					currentPlayers[0][1] = gold.top;
					currentPlayers[0][2] = gold.left;
				}
			}

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
