
var debug = require('./debug')('connection'),
	split = require('split'),
	Emitter = require('events').EventEmitter,
	protocol = require('./protocol.js');

var connectionIncrementer = 1;


module.exports = function (config, server, socket) {
	var id = connectionIncrementer++;

	debug('created', id, socket.remoteAddress);

	var connection = new Emitter();
	connection._socket = socket;
	connection.id = id;
	connection.nickname = config.requireNickname ? null : 'User' + id;
	connection.username = 'unknown';
	connection.realname = null;
	connection.hostname = socket && socket.remoteAddress || 'unknown';
	connection.quitMessage = 'Connection lost.';

	connection.__defineGetter__('mask', function() {
		return ':' + connection.nickname + '!' + connection.username + '@' + connection.hostname;
	});

	connection.on('authenticated', function () {
		connection.send(true, protocol.code.RPL_WELCOME, connection.nickname, config.welcomeMessage, connection.mask);
		connection.send(true, protocol.code.RPL_YOURHOST, connection.nickname, 'Your host is ' + config.hostname);
		connection.send(true, protocol.code.RPL_CREATED, connection.nickname, 'This server was created on ' + config.created);
		connection.send(true, protocol.code.RPL_MYINFO, connection.nickname, config.name, config.version);
	});


	function processCommand (data) {
		// emit command event name with data params as arguments
		var handled = connection.emit.apply(connection, Array.prototype.concat([data.command], data.params));
		if (!handled) {
			connection.send(true, protocol.code.ERR_UNKNOWNCOMMAND, ':Unknown command (' + data.command + ')');
		}
	}

	var queuedCommands = [];
	connection.on('authenticated', function () {
		queuedCommands.forEach(processCommand);
		queuedCommands = [];
	});


	if (socket) {
		socket.pipe(split('\r\n')).on('data', function (line) {
			if (line) {
				debug('received', line);
			} else {
				debug('received empty packet');
			}

			connection.emit('data', line);

			var data = parse(line);

			if (data.command) {
				connection.emit('command', data);
				debug(data.command, data.params);
				if (connection.isAuthed || data.command === 'USER' || data.command === 'PASS' || data.command === 'NICK' || data.command === 'QUIT') {
					processCommand(data);
				} else {
					queuedCommands.push(data);
				}
			}
		});

		socket.on('end', function () {
			debug('socket ended', id);
			connection.emit('user:quit', connection.quitMessage);
			connection.emit('end', connection.quitMessage);
		});

		socket.on('error', function (err) {
			debug.error(err);
			connection.emit('error', err);
		});

		socket.on('close', function () {
			debug('socket closed', id);
			connection.emit('user:quit', connection.quitMessage);
			connection.emit('close', connection.quitMessage);
		});
	}

	connection.on('QUIT', function (message) {
		connection.quitMessage = message;
		connection.close();
	});

	connection.send = function send () {
		if (!socket) return;

		var args = Array.prototype.slice.call(arguments);
		if (args[0] === true) {
			args[0] = server.host;
		}

		var data = args.join(' ');

		debug('send', id, data);

		socket.write(data + '\r\n');
	};

	connection.close = function (fn) {
		if (!socket) return;
		debug('closing', id);
		connection.emit('closing');

		socket.end(fn);
		socket = connection._socket = null;
	};

	return connection;
};


function parse (line) {
	var prefix, message, params, command, i;

	if (line[0] === ':') {
		i = line.indexOf(' ');
		prefix = (i === -1) ? line.slice(1) : line.slice(1, i);
		line = line.slice(i + 1);
	}

	i = line.indexOf(' :');
	if (i > -1) {
		message = line.slice(i + 2);
		line = line.slice(0, i);
	}

	params = line.split(/ +/g);
	if (message) params.push(message);

	command = params.shift().toUpperCase();

	return {
		command: command,
		params : params,
		message: message,
		prefix : prefix
	};
}