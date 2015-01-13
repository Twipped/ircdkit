var ircdkit = require('../lib/index');
var net = require('net');

exports['initialization is ok, server starts and stops'] = function (test) {
	test.expect(2);

	var irc = ircdkit();

	irc.on('error', function (err) {
		test.ok(false);
		console.error(err);
	});

	irc.listen(function () {
		test.ok(true);
		irc.close(function () {
			test.ok(irc);
			test.done();
		});
	});

};

exports['config get'] = function (test) {
	var irc = ircdkit({
		foo: 2
	});

	test.equal(irc.config('foo'), 2);
	test.done();
};

exports['config set'] = function (test) {
	var irc = ircdkit({
		foo: 2
	});

	irc.config('foo', 3);

	test.equal(irc.config('foo'), 3);
	test.done();
};

exports['server shutdown'] = function (test) {
	test.expect(5);
	var irc = ircdkit();
	
	irc.on('error', function (err) {
		test.ok(false);
		console.error(err);
	});

	irc.listen(function () {

		var port = irc._server.address().port;
		test.ok(true, 'Listening');

		irc.on('connection', function () {
			test.ok(true, 'Connected in');

			irc.close(function () {
				test.ok(true, 'Closed');
				test.done();
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.on('end', function () {
				test.ok(true, 'Disconnected');
			});
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});

};

exports['client quits'] = function (test) {
	test.expect(8);
	var irc = ircdkit();
	
	irc.on('error', function (err) {
		test.ok(false);
		console.error(err);
	});

	irc.listen(function () {

		var port = irc._server.address().port;
		test.ok(true, 'Listening');

		irc.on('connection', function (conn) {
			test.ok(true, 'Connected in');

			conn.on('user:quit', function (message) {
				test.equal(message, 'Goodbye');
			});
		});

		irc.on('connection:close', function () {
			test.ok(true, 'Connection closed');

			irc.close(function () {
				test.ok(true, 'Closed');
				test.done();
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.on('end', function () {
				test.ok(true, 'Disconnected');
			});

			socket.write('QUIT :Goodbye\r\n');
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});

};

