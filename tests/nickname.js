var ircdkit = require('../lib/index');
var net = require('net');
var split = require('split');

exports['client basic login'] = function (test) {
	test.expect(7);
	var irc = ircdkit({
		requireNickname: true
	});
	
	irc.on('error', function (err) {
		test.ok(false);
		console.error(err);
	});

	irc.listen(function () {

		var port = irc._server.address().port;
		test.ok(true, 'Listening');

		irc.on('connection', function (conn) {
			test.ok(true, 'Connected in');

			conn.on('authenticated', function () {
				test.equal(conn.nickname, 'test1', 'nickname');
				test.equal(conn.username, 'test2', 'username');
				test.equal(conn.realname, 'test3', 'realname');

				irc.close(function () {
					test.ok(true, 'Closed');
					test.done();
				});
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('NICK test1\r\n');
			socket.write('USER test2 - - test3\r\n');
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});

};

exports['client basic login, user sent first'] = function (test) {
	test.expect(7);
	var irc = ircdkit({
		requireNickname: true
	});
	
	irc.on('error', function (err) {
		test.ok(false);
		console.error(err);
	});

	irc.listen(function () {

		var port = irc._server.address().port;
		test.ok(true, 'Listening');

		irc.on('connection', function (conn) {
			test.ok(true, 'Connected in');

			conn.on('authenticated', function () {
				test.equal(conn.nickname, 'test1', 'nickname');
				test.equal(conn.username, 'test2', 'username');
				test.equal(conn.realname, 'test3', 'realname');

				irc.close(function () {
					test.ok(true, 'Closed');
					test.done();
				});
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test2 - - test3\r\n');
			socket.write('NICK test1\r\n');
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});

};

exports['client basic login, requireNickname off'] = function (test) {
	test.expect(8);
	var irc = ircdkit({
		requireNickname: false
	});
	
	irc.on('error', function (err) {
		test.ok(false);
		console.error(err);
	});

	irc.listen(function () {
		var id;
		var port = irc._server.address().port;
		test.ok(true, 'Listening');

		irc.on('connection', function (conn) {
			id = conn.id;
			test.ok(true, 'Connected in');

			conn.on('authenticated', function () {
				test.equal(conn.nickname, 'User'+id, 'nickname');
				test.equal(conn.username, 'test2', 'username');
				test.equal(conn.realname, 'test3', 'realname');

				conn.once('user:nick', function () {
					test.equal(conn.nickname, 'test1', 'nickname');
					irc.close(function () {
						test.ok(true, 'Closed');
						test.done();
					});
				})
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test2 - - test3\r\n');
			socket.write('NICK test1\r\n');
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});

};