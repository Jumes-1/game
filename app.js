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

// Find a value in an array
function findValueArray(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][0] == value) {
			return i;
		}
	}
}

// Create a random number
function random(min, max) {
	return Math.floor(Math.random() * (max - min + 1) + min);
}

// Gets the current time in HH:MM
function timeNow() {
	var d = new Date(),
		h = (d.getHours()<10?'0':'') + d.getHours(),
		m = (d.getMinutes()<10?'0':'') + d.getMinutes();
	return (h + ':' + m);
}

// Movement speed
var moveSpeed = 4;

// Size of a character in px
var size = 32;

// Size of the board.
var width = 600;
var height = 500;

// Hold all the current players
var currentPlayers = [];

// Hold all current messages
var currentMessages = [];

// Random list of names
var randomNames = ['Dave', 'Steve', 'Alan', 'John', 'Paul', 'Donald', 'Kevin', 'Gary', 'Larry', 'Peter', 'Carl', 'Joe' ];

// Generate random coordinates for the gold star.
var gold = { top: random(0, (500 - 32) ), left: random(0, (600 - 32) ) };
// Add gold star to map.
currentPlayers.push(['golden-star', gold.top, gold.left, 'Golden Star', 'images/golden-star.png']);

// Socket Functions
var sf = [];

sf.push([
	'connection',
	function(socket) {

		// When someone joins tell everyone.
		socket.broadcast.emit('joined', 'Jumes');

		// Users id -> socket.client.conn.id
		console.log(socket.client.conn.id + ' has joined.');
		var ClientID = socket.client.conn.id;

		// random spawns for players
		var player = { top: random(0, (500 - 32) ), left: random(0, (600 - 32) ) };

		// Create a random name for the user.
		var randomName = randomNames[random(0, randomNames.length - 1)];

		// Base setup for a new user.
		currentPlayers.push([socket.client.conn.id, random(0, (500 - 32) ), random(0, (600 - 32) ), randomName, 'images/mario.png', 0]);

		// Tell everyone where everyone is.
		socket.broadcast.emit('current', currentPlayers);
		socket.emit('current', currentPlayers);

		// create the message
		var message = randomName + " has joined!";

		// Add the message to the array.
		currentMessages.push(['admin', message, 1, timeNow()]);

		// Tell everyone that a user has changed their name
		socket.broadcast.emit('new message', currentMessages);
		socket.emit('new message', currentMessages);

		// Wait for a user to move.
		socket.on('move', function(data) {
			// Get the id of the user that moved
			var id = socket.client.conn.id;
			
			// Find the user in the array
			var arrayID = findValueArray(id, currentPlayers);

			// Shorten the x and y coords for the player
			var tempTop = currentPlayers[arrayID][1];
			var tempLeft = currentPlayers[arrayID][2];
			
			// Check which way they want to move.
			// 
			// If they press W they move upwards
			if (data == 'W') {
				if (tempTop <= 0) {
					tempTop = 0;
				} else {
					tempTop -= moveSpeed;
				}
			}

			// If they press A they move left
			if (data == 'A') {
				if (tempLeft <= 0) {
					tempLeft = 0;
				} else {
					tempLeft -= moveSpeed;
				}
			}

			// If they press S they move downwards.
			if (data == 'S') {
				if ( (tempTop + size) >= height ) {
					tempTop = height - size;
				} else {
					tempTop += moveSpeed;
				}
			}

			// If they press D they move right
			if (data == 'D') {
				if ( (tempLeft + size) >= width ) {
					tempLeft = width - size;
				} else {
					tempLeft += moveSpeed;
				}
			}

			// Then set the modified variable back to the main array.
			currentPlayers[arrayID][1] = tempTop;
			currentPlayers[arrayID][2] = tempLeft;

			// Setup Golden star detection.
			var top = { min: currentPlayers[0][1], max: currentPlayers[0][1] + 32 };
			var left = { min: currentPlayers[0][2], max: currentPlayers[0][2] + 32 };

			for (var i = 1; i < currentPlayers.length; i++) {
				var posWin = currentPlayers[i];

				// This hard to explain.
				// Short -> Checks if any of the players are in the golden star.
				if ( ( (( posWin[1] < top.max ) && ( posWin[1] > top.min )) || (( posWin[1] + 32 < top.max) && (posWin[1] + 32 > top.min)) ) &&
				( (( posWin[2] < left.max ) && ( posWin[2] > left.min )) || (( posWin[2] + 32 < left.max ) && ( posWin[2] + 32  > left.min )) ) ) {
					
					// Add more golden stars.
					currentPlayers[i][5]++;

					// Generate new position for the new golden star.
					var gold = { top: random(0, (500 - 32) ), left: random(0, (600 - 32) ) };

					// Set the new positions.
					currentPlayers[0][1] = gold.top;
					currentPlayers[0][2] = gold.left;

					// create the message
					var message = posWin[3] + " has collected a star!";

					// Add the message to the array.
					currentMessages.push(['admin', message, 1, timeNow()]);

					// Tell everyone that a user has changed their name
					socket.broadcast.emit('new message', currentMessages);
					socket.emit('new message', currentMessages);
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

			// Make the message
			var message = currentPlayers[arrayID][3] + " has changed their name to " + data;

			// Get the name they wanted, add it to their array.
			currentPlayers[arrayID][3] = data;

			// Add the message to the array.
			currentMessages.push(['admin', message, 1, timeNow()]);

			// Tell everyone that a user has changed their name
			socket.broadcast.emit('new message', currentMessages);
			socket.emit('new message', currentMessages);

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

		socket.on('message', function(data) {
			// Get the id of the user who sent the message
			var id = socket.client.conn.id;

			// find the user in the array.
			var arrayID = findValueArray(id, currentPlayers);

			// Get the players nickname
			var nickname = currentPlayers[arrayID][3];

			// Add the users message and the users name to the message array
			currentMessages.push([nickname, data, 0, timeNow()]);

			// Add a admin message
			//currentMessages.push(['admin', messageHere, 1]);
			
			// Check if there is more than 50 messages.
			if (currentMessages.length > 50) {
				// Delete the oldest message.
				currentMessages.splice(0, 1);
			}

			// Tell everyone there is a new message.
			socket.broadcast.emit('new message', currentMessages);
			socket.emit('new message', currentMessages);

			console.log('Added a message');

		});

		socket.on('disconnect', function() {
			// Get the id of the user that has disconnected.
			var id = socket.client.conn.id;

			// Find the user that disconnected in the array.
			var arrayID = findValueArray(id, currentPlayers);

			var nickname = currentPlayers[arrayID][3];

			// create the message
			var message = nickname + " has left the game.";

			// Add the message to the array.
			currentMessages.push(['admin', message, 1, timeNow()]);

			// Tell everyone that a user has changed their name
			socket.broadcast.emit('new message', currentMessages);
			socket.emit('new message', currentMessages);

			// Delete that user from the array.
			currentPlayers.splice(arrayID, 1);

			console.log('A user has disconnected.');
			console.log(socket.client.conn.id);
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
