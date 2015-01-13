var ircdkit = require('../lib/index');
var net = require('net');
var split = require('split');

exports['client basic login'] = function (test) {
	test.expect(6);
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

			conn.on('authenticated', function () {
				test.equal(conn.username, 'test1', 'username');
				test.equal(conn.realname, 'test2', 'realname');

				irc.close(function () {
					test.ok(true, 'Closed');
					test.done();
				});
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test1 - - test2\r\n');
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});

};

exports['client custom login accepts'] = function (test) {
	test.expect(11);
	var irc = ircdkit({
		validateAuthentication: function (connection, username, accept, reject, waitForPass) {
			test.equal(username, 'test1');
			accept();
		},
		created: '2015-12-01'
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
				test.equal(conn.username, 'test1', 'username');
				test.equal(conn.realname, 'test2', 'realname');
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test1 - - test2\r\n');
			socket.write('PASS test3\r\n');
		});

		var receiver = socket.pipe(split('\r\n'));
		receiver.once('data', function (line) {
			test.equal(line, ':unknown.tld 001 User' + id + ' Welcome to IRC :User' + id + '!test1@127.0.0.1');
			receiver.once('data', function (line) {
				test.equal(line, ':unknown.tld 002 User' + id + ' Your host is unknown.tld');
				receiver.once('data', function (line) {
					test.equal(line, ':unknown.tld 003 User' + id + ' This server was created on 2015-12-01');
					receiver.once('data', function (line) {
						test.equal(line, ':unknown.tld 004 User' + id + ' ircdkit 1.0.0');

						irc.close(function () {
							test.ok(true, 'Closed');
							test.done();
						});
					});
				});
			});
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});
	});
};

exports['client custom login rejects'] = function (test) {
	test.expect(7);
	var irc = ircdkit({
		validateAuthentication: function (connection, username, accept, reject, waitForPass) {
			test.equal(username, 'test1');
			reject();
		}
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
				test.equal(conn.username, 'test1', 'username');
				test.equal(conn.realname, 'test2', 'realname');

				
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test1 - - test2\r\n');
			socket.write('PASS test3\r\n');

		});

		var receiver = socket.pipe(split('\r\n'));
		receiver.once('data', function (line) {
			test.equal(line, ':unknown.tld 464 test1 :Password incorrect');
		});
		

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});

		socket.on('end', function () {
			test.ok(true, 'Disconnected');

			irc.close(function () {
				test.ok(true, 'Closed');
				test.done();
			});
		});
	});
};

exports['client custom login waits for password and then accepts'] = function (test) {
	test.expect(13);
	var irc = ircdkit({
		validateAuthentication: function (connection, username, accept, reject, waitForPass) {
			test.equal(username, 'test1');
			waitForPass(function (password) {
				test.equal(password, 'test3');
				accept();
			});
		},
		created: '2015-12-01'
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
				test.equal(conn.username, 'test1', 'username');
				test.equal(conn.realname, 'test2', 'realname');
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test1 - - test2\r\n');
			socket.write('PASS test3\r\n');

		});

		var receiver = socket.pipe(split('\r\n'));
		receiver.once('data', function (line) {
			test.equal(line, ':unknown.tld 001 User' + id + ' Welcome to IRC :User' + id + '!test1@127.0.0.1');
			receiver.once('data', function (line) {
				test.equal(line, ':unknown.tld 002 User' + id + ' Your host is unknown.tld');
				receiver.once('data', function (line) {
					test.equal(line, ':unknown.tld 003 User' + id + ' This server was created on 2015-12-01');
					receiver.once('data', function (line) {
						test.equal(line, ':unknown.tld 004 User' + id + ' ircdkit 1.0.0');

						irc.close(function () {
							test.ok(true, 'Closed');
							test.done();
						});
					});
				});
			});
		});

		socket.on('end', function () {
			test.ok(true, 'Disconnected');
		});

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});

	});
};

exports['client custom login waits for password and then rejects'] = function (test) {
	test.expect(8);
	var irc = ircdkit({
		validateAuthentication: function (connection, username, accept, reject, waitForPass) {
			test.equal(username, 'test1', 'validate username');
			waitForPass(function (password) {
				test.equal(password, 'test3', 'validate password');
				reject();
			});
		}
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
				test.equal(conn.username, 'test1', 'username');
				test.equal(conn.realname, 'test2', 'realname');
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test1 - - test2\r\n');
			socket.write('PASS test3\r\n');

		});

		var receiver = socket.pipe(split('\r\n'));
		receiver.once('data', function (line) {
			test.equal(line, ':unknown.tld 464 test1 :Password incorrect', 'received rejection');
		});
		

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});

		socket.on('end', function () {
			test.ok(true, 'Disconnected');

			irc.close(function () {
				test.ok(true, 'Closed');
				test.done();
			});
		});
	});
};

exports['client custom login waits for password but times out'] = function (test) {
	test.expect(8);
	var irc = ircdkit({
		validateAuthentication: function (connection, username, accept, reject, waitForPass) {
			test.equal(username, 'test1', 'validate username');
			waitForPass(function (password) {
				test.equal(password, undefined, 'validate password');
				reject();
			});
		},
		authTimeout: 500
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
				test.equal(conn.username, 'test1', 'username');
				test.equal(conn.realname, 'test2', 'realname');
			});
		});

		var socket = net.connect({port: port, host: '127.0.0.1'}, function () {
			test.ok(true, 'Connected out');

			socket.write('USER test1 - - test2\r\n');

		});

		var receiver = socket.pipe(split('\r\n'));
		receiver.once('data', function (line) {
			test.equal(line, ':unknown.tld 464 test1 :Password incorrect', 'received rejection');
		});
		

		socket.on('error', function (err) {
			test.ok(false);
			console.error(err);
		});

		socket.on('end', function () {
			test.ok(true, 'Disconnected');

			irc.close(function () {
				test.ok(true, 'Closed');
				test.done();
			});
		});
	});
};