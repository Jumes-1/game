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

function changePic() {
	var pic = $('#character').val();
	socket.emit('picture change', pic);
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

setInterval(check, 10);

function move() {
	if (Key.isDown(Key.UP)) pos.top -= moveSpeed;
	if (Key.isDown(Key.LEFT)) pos.left -= moveSpeed;;
	if (Key.isDown(Key.DOWN)) pos.top += moveSpeed;
	if (Key.isDown(Key.RIGHT)) pos.left += moveSpeed;
}


setInterval(move, 10);

function update() {
	socket.emit('move',{
		top: pos.top,
		left: pos.left
	});
}

setInterval(update, 10);

function drawCanvas() {
	$myCanvas.clearCanvas();

	for (var i = 0; i < allPlayers.length; i++) {
		var p = allPlayers[i];

		var defaultPic = "images/mario.png";

		if (typeof p[4] === 'undefined') {} else {
			defaultPic = p[4];
		}

		$myCanvas.drawImage({
			source: defaultPic,
			x: p[2], y: p[1],
			width: 32,
			height: 32,
			fromCenter: false
		});

		// Names
		var x = p[2] + 12;
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

requestAnimationFrame(drawCanvas);
