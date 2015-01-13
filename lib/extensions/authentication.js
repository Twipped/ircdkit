
var debug = require('../debug')('authentication'),
	proxmis = require('proxmis'),
	protocol = require('../protocol');

module.exports = function (server) {
	debug('initialized');

	server.on('connection', function (connection) {
		var passwordPending = proxmis();

		connection.isAuthed = false;

		debug('attaching to connection');

		connection.on('USER', function (username, hostname, servername, realname) {
			connection.username = username;
			connection.realname = realname;

			var validate = server.config('validateAuthentication');

			debug('received username', username, 'validating:' + (validate?'YES':'NO'));

			// create a proxmis to handle the authentication calls in order
			// to ensure authentication can only be resolved or rejected once
			var loginAccepted = proxmis();
			loginAccepted.then(function (user) {
				//accepted
				debug('accepted', username);
				connection.user = user;

				if (connection.nickname) {
					connection.isAuthed = true;
					connection.emit('authenticated', username, user);
					debug('done');
				} else {
					debug('waiting for nickname');
					connection.once('user:nick', function () {
						debug('done');
						connection.isAuthed = true;
						connection.emit('authenticated', username, user);
					});
				}
			}, function (error) {
				//rejected
				debug('rejected', username);
				connection.send(true, protocol.code.ERR_PASSWDMISMATCH, username || 'user', ':' + error);
				connection.close();
			});

			if (typeof validate !== 'function') {
				loginAccepted();
				return;
			}

			var accept = function (user) {
				loginAccepted(null, user);
			};
			var reject = function (message) {
				loginAccepted(message || 'Password incorrect');
			};

			var waitForPass = function (fn) {
				debug('waiting for password');

				var timeout;
				passwordPending.then(function (password) {
					clearTimeout(timeout);
					fn(password);
				}, function () {
					clearTimeout(timeout);
					fn();
				});

				//wait no more than five seconds for password.
				timeout = setTimeout(function () {
					//reject the proxmis with a timeout
					passwordPending('timeout');
				}, server.config('authTimeout') || 5000);
			};

			validate(connection, username, accept, reject, waitForPass);
		});

		connection.on('PASS', function (password) {
			debug('received password');

			// received a password, resolve the proxmis and clear
			if (!passwordPending) return;
			passwordPending(null, password);
			passwordPending = null;
		});
	});

};
