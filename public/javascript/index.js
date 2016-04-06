var Key = {
	_pressed: {},

	A: 65,
	W: 87,
	D: 68,
	S: 83,

	isDown: function(keyCode) {
		return this._pressed[keyCode];
	},

	onKeydown: function(event) {
		this._pressed[event.keyCode] = true;
	},

	onKeyup: function(event) {
		delete this._pressed[event.keyCode];
	}
};

function findValueArray(value, array) {
	for (var i = 0; i < array.length; i++) {
		if (array[i][0] == value) {
			return i;
		}
	}
}

// Wait for key presses.
window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var $myCanvas = $('#canvas');

var allPlayers = [];
var chat = [];
var myId;
var lastLength = 0;

// Connect to the server.
var socket = io.connect('http://94.174.147.13');

$('.chat-input').on('keydown', function(event) {
	if (event.which === 13) {
		socket.emit('message', $('.chat-input').val() );
		$('.chat-input').val('');
		event.preventDefault();
	}
});

socket.on('joined', function(data) {
	console.log(data + ' joined the game!');
});

socket.on('moved', function(data) {
	// When someone moves update our cache.
	allPlayers = data;
});

socket.on('current', function(data) {
	// Get our socket id.
	myId = socket.id;
	console.log(myId);
	
	allPlayers = data;
	console.log(data);

});

socket.on('new message', function(data) {
	chat = data;
});

function changeName() {
	// Get the nickname from the input.
	var name = $('input[name=username]').val();

	// Send new nickname to the server.
	socket.emit('name change', name);
}

function changePic() {
	// Get picture from the select
	var pic = $('#character').val();

	// Send it to the server.
	socket.emit('picture change', pic);
}

function manageMessages() {
	if (lastLength !== chat.length) {
		var str = "";
		for (var i = 0; i < chat.length; i++) {
			var shortChat = chat[i];

			str += "<div class='chat-area'>";
			if (shortChat[2] === 0) {
				str += "<div class='chat-username'>" + shortChat[0] + "</div>";
				str += "<div class='chat-spacer'>:</div>";
				str += "<div class='chat-message'>" + shortChat[1] + "</div>";
				str += "<div class='chat-time'>" + shortChat[3] + "</div>";
			} else {
				str += "<div class='chat-admin'>" + shortChat[1] + "</div>";
				str += "<div class='chat-time'>" + shortChat[3] + "</div>";
			}
			str += "</div>";
		}
		$('.chat-hold').html(str);
		$('.chat-hold').scrollTop(9999);
		$('.player-total').html(allPlayers.length - 1);
	}
}

setInterval(manageMessages, 20);

// TEST FEATURE //
function check() {
	var str = "<tbody><tr><th>User</th><th>Top</th><th>Left</th></tr>";

	for (var i = 0; i < allPlayers.length; i++) {
		var p = allPlayers[i];
		var temp = "<tr>";

		temp += "<td>" + p[0] + "</td>";
		temp += "<td>" + p[1] + "</td>";
		temp += "<td>" + p[2] + "</td>";
		if (typeof p[3] === 'undefined') {} else {
			temp += "<td>" + p[3] + "</td>";
		}
		if (typeof p[5] === 'undefined') {} else {
			temp += "<td>" + p[5] + "</td>";
		}

		temp += "</tr>";
		str += temp;
	}

	str += "</tbody>";
	$('.table-edit').html(str);
}

setInterval(check, 10);

// END TEST FEATURE //

function move() {
	// Detect when the W key is being pressed.
	if (Key.isDown(Key.W)) {
		socket.emit('move','W');
	}

	// Detect when the A key is being pressed.
	if (Key.isDown(Key.A)) {
		socket.emit('move','A');
	}

	// Detect when the S key is being pressed.
	if (Key.isDown(Key.S)) {
		socket.emit('move','S');
	}

	// Detect when the D key is being pressed.
	if (Key.isDown(Key.D)) {
		socket.emit('move','D');
	}
}

setInterval(move, 10);

function drawCanvas() {
	// Clear the canvas
	$myCanvas.clearCanvas();

	for (var i = 0; i < allPlayers.length; i++) {
		var p = allPlayers[i];

		// Set a default picture for all players
		var defaultPic = "images/mario.png";

		// Check if the player has a custom picture
		if (typeof p[4] === 'undefined') {} else {
			// Use it.
			defaultPic = p[4];
		}

		// Draw the image on the canvas
		$myCanvas.drawImage({
			source: defaultPic,
			x: p[2], y: p[1],
			width: 32,
			height: 32,
			fromCenter: false
		});

		// Add the players name above the characters
		var x = p[2] + 12;
		var y = p[1] - 18;
		if (myId == p[0]) {
			// Check if the character is ours then put 'You' instead of the other.
			$myCanvas.drawText({
				text: 'You',
				fontFamily: 'sans-serif',
				fontSize: 24,
				x: x, y: y,
				fillStyle: 'black',
				strokeStyle: 'black',
				strokeWidth: 1
			});
		} else {
			// Check if the player has a custom name. 
			var name = p[0];
			if (typeof p[3] === 'undefined') {} else {
				// If so set it here.
				name = p[3];
			}
			// Draw name above character.
			$myCanvas.drawText({
				text: name,
				fontFamily: 'sans-serif',
				fontSize: 10,
				x: x, y: y,
				fillStyle: 'black',
				strokeStyle: 'black',
				strokeWidth: 1
			});
		}
	}
	requestAnimationFrame(drawCanvas);
}

// Run it as fast as possible.
requestAnimationFrame(drawCanvas);
