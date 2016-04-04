var Key = {
	_pressed: {},

	LEFT: 65,
	UP: 87,
	RIGHT: 68,
	DOWN: 83,

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

window.addEventListener('keyup', function(event) { Key.onKeyup(event); }, false);
window.addEventListener('keydown', function(event) { Key.onKeydown(event); }, false);

var $myCanvas = $('#canvas');

var allPlayers = [];
var myId;
var pos = {top: 0, left: 0};
var moveSpeed = 2;

var socket = io.connect('http://94.174.147.13');

socket.on('joined', function(data) {
	console.log(data + ' joined the game!');
});

socket.on('moved', function(data) {
	allPlayers = data;
});

socket.on('current', function(data) {
	myId = socket.id;
	console.log(myId);
	
	allPlayers = data;
	console.log(data);
});

function update() {
	socket.emit('move',{
		top: pos.top,
		left: pos.left
	});
}

function changeName() {
	var name = $('input[name=username]').val();
	socket.emit('name change', name);
}

function move() {
	if (Key.isDown(Key.UP)) moveUp();
	if (Key.isDown(Key.LEFT)) moveLeft();
	if (Key.isDown(Key.DOWN)) moveDown();
	if (Key.isDown(Key.RIGHT)) moveRight();
}

function moveUp() {
	pos.top -= moveSpeed;
}

function moveDown() {
	pos.top += moveSpeed;
}

function moveLeft() {
	pos.left -= moveSpeed;
}

function moveRight() {
	pos.left += moveSpeed;
}

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

		temp += "</tr>";
		str += temp;
	}

	str += "</tbody>";
	$('.table-edit').html(str);
}

function drawCanvas() {
	$myCanvas.clearCanvas();

	for (var i = 0; i < allPlayers.length; i++) {
		var p = allPlayers[i];
		$myCanvas.drawRect({
			fillStyle: 'steelblue',
			strokeStyle: 'blue',
			strokeWidth: 4,
			x: p[2], y: p[1],
			fromCenter: false,
			width: 20,
			height: 20
		});
		var x = p[2] + 8;
		var y = p[1] - 18;
		if (myId == p[0]) {
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
			var name = p[0];
			if (typeof p[3] === 'undefined') {} else {
				name = p[3];
			}
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

setInterval(check, 10);
setInterval(move, 10);
setInterval(update, 10);
requestAnimationFrame(drawCanvas);
