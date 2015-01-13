
var debug = require('../debug')('nickname'),
	proxmis = require('proxmis'),
	protocol = require('../protocol');

module.exports = function (server) {
	debug('initialized');

	server.on('connection', function (connection) {

		debug('attaching to connection');

		connection.on('NICK', function (nickname) {
			var validate = server.config('validateNickname');

			debug('received nickname', nickname, 'validating:' + (validate?'YES':'NO'));

			if (!nickname || nickname.length === 0) {
				debug('nickname missing');
				return connection.send(true, protocol.code.ERR_NONICKNAMEGIVEN, ':No nickname given');

			} else if (nickname === connection.nickname) {
				debug('nickname unchanged');
				// nothing to do here
				return;

			} else if (nickname.length > (server.config('maxNickLength') || 9) || nickname.match(protocol.validations.invalidNick)) {
				debug('nickname invalid');
				return connection.send(true, protocol.code.ERR_ERRONEOUSNICKNAME, (connection.nickname || ''), nickname, ':Erroneus nickname');

			} else if (server.getConnection('nickname', nickname)) {
				debug('nickname exists');
				return connection.send(true, protocol.code.ERR_NICKNAMEINUSE, '*', nickname, ':is already in use');
			}

			var previous = connection.nickname;

			// create a proxmis to handle the authentication calls in order
			// to ensure authentication can only be resolved or rejected once
			var nickAccepted = proxmis();
			nickAccepted.then(function () {
				//accepted
				debug('accepted', nickname);
				connection.nickname = nickname;
				connection.send(connection.mask, 'NICK', ':' + nickname);
				connection.emit('user:nick', nickname, previous);
			}, function (error) {
				//rejected
				debug('rejected', nickname);
				return connection.send(true, protocol.code.ERR_ERRONEOUSNICKNAME, (connection.nickname || ''), nickname, ':' + error);
			});

			// if no nick validation scheme has been setup, just authenticate the user now
			if (typeof validate !== 'function') {
				nickAccepted();
				return;
			}

			var accept = function () {
				nickAccepted();
			};
			var reject = function (message) {
				nickAccepted(message || 'Erroneus nickname');
			};

			validate(connection, nickname, previous, accept, reject);
		});

	});

};
