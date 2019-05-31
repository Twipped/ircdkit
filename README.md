ircdkit
===

ircdkit is a toolkit for constructing special purpose IRC servers.  It is not a full implementation of [the various IRC RFC specifications](http://www.irchelp.org/irchelp/rfc/), but rather a pluggable framework for implementing your own IRC compatible servers, such as ZNC style bouncers or proxies to non-IRC chat services.

[![NPM version](https://img.shields.io/npm/v/ircdkit.svg)](http://badge.fury.io/js/ircdkit)
[![Licensed MIT](https://img.shields.io/npm/l/ircdkit.svg)](https://github.com/Twipped/ircdkit/blob/master/LICENSE.txt)
[![Nodejs 0.10+](https://img.shields.io/badge/node.js-%3E=_0.10-brightgreen.svg)](http://nodejs.org)
[![iojs 1.0.0+](https://img.shields.io/badge/io.js-%3E=_1.0.0-brightgreen.svg)](http://iojs.org)
[![Downloads](http://img.shields.io/npm/dm/ircdkit.svg)](http://npmjs.org/ircdkit)

ircdkit is *not* a fully functional IRC server.  A default configuration of ircdkit provides only the following:

- Server socket
- Connection management
- Command parsing.
- User login and authentication
- User nickname changes and collision detection
- Disconnect handling.

##Example

```js
var ircdkit = require('ircdkit');
var irc = ircdkit({
	requireNickname: true
});

irc.listen(6667, function () {
	console.log("Server is listening for connections on port 6667");
});

irc.on('connection', function (connection) {
	connection.on('authenticated', function () {
		console.log(connection.mask + " has logged in on connection " + connection.id);
	});

	connection.on('disconnected', function () {
		console.log(connection.mask + " has disconnected.");
	})
});
```

##Installation

NPM: `npm install ircdkit`

##Usage

###`ircdkit([options])`

Creates the base ircd server that will manage connections and system behavior.  Returns an ircdkit app object.

Optionally takes an object containing the default configuration options.

| Option                   | Description                                                                                                                                                                            |         Default        |
|--------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|:----------------------:|
| `name`                   | Server software name sent to clients with welcome body.                                                                                                                                |         ircdkit        |
| `version`                | Server software version sent to clients with welcome body.                                                                                                                             |          1.0.0         |
| `created`                | Date that the server was put into operation.                                                                                                                                           | Date of process launch |
| `hostname`               | The hostname used to identify the server. Is used to identify the server to IRC clients and should be a real DNS entry, but does not have to be.                                       |       unknown.tld      |
| `secure`                 | If you wish to run your server as a secure TLS connection, provide security credentials on this setting in the form of `{key: "KEY_FILE_CONTENTS", cert: "CERTIFICATE_FILE_CONTENTS"}`.|        undefined       |
| `welcomeMessage`         | Short message sent to the user after authentication.                                                                                                                                   |     Welcome to IRC     |
| `requireNickname`        | Boolean that indicates if authentication should wait for a nickname. If false, a default nickname will be assigned.                                                                    |          false         |
| `authTimeout`            | Length of time in milliseconds that the server should wait for user credentials before rejecting the connection.                                                                       |          5000          |
| `validateAuthentication` | Function to be called after connecting users send their username.  Leave undefined if no user authentication is needed. See below for function signature and usage.                    |        undefined       |
| `validateNickname`       | Function to be called after receiving a nickname change or at initial login. Allows for rejection and/or override of nickname changes. See below for function signature and usage.     |        undefined       |
| `maxNickLength`          | Maximum number of characters allowed in a nickname.                                                                                                                                    |            9           |

###`app.listen(port, [address,] [callback])`

Creates a socket server and tells it to listen on the specified port. The passed callback will be invoked once the server is successfully listening.

###`app.config(key)`

Retrieves the configuration option defined by `key`.

###`app.close([callback])`

Tells the server to stop accepting new connections and closes any open connections.  Optional callback will be invoked once all connections have closed.

###`app` Events

The `app` object is a standard Node.js Event Emitter.

- **connection** (Arguments: connection) A client has connected.
- **connection:end** (Arguments: connection, quitMessage) A client closed the connection from their side.
- **connection:close** (Arguments: connection, quitMessage) A client connection closed from the server side.
- **listening** (Arguments: port, boundAddress) Server is listening for connections.
- **error** (Arguments: error, client) An error occurred. If the error originated from a specific client, the second argument will contain the client object.

###`app.getConnection(id)`

Gets a connection by its id.

###`app.getConnection(key, value)`

Gets the first connection which contains the property (defined as `key`) matching `value`.

###`app.createConnection(nickname)`

Creates a new connection object for local use, such as creating services, and attaches to the server. This connection will not have a socket attached to it and will not be registered with plugins.

###`app.removeConnection(connection)`

Removes the passed connection object from the server. This does not trigger any events and will not remove any connection with an active socket.

###`app.handle`

If you wish to run your server on multiple ports, or with both public and secure connections, ircdkit exposes the connection handler function.  Use this in conjunction with the `net.createServer` or `tls.createServer` functions.

Note, servers created this way must be closed separately from `app.close()`, as ircdkit will not know of their existence.

###`connection.nickname`

Current nickname for the user.

###`connection.username`

Username the user logged in with.

###`connection.realname`

User's real name as provided at login.

###`connection.hostname`

Hostname for the user's connection.

###`connection.mask`

The full hostmask for the user. (eg: `nickname!username@hostname`)

###`connection.send([asServer], data, ...)`

Sends data to the client.  Multiple arguments are joined with spaces.

If the first argument is `true`, the connection will prefix the data with a colon and the server hostname, indicating it is a server message (the first argument after `true` should be an IRC reply code).

###`connection.close([callback])`

Closes the connection, disconnecting the client.  If a callback is provided, it will be invoked once the connection is closed.

###`connection` Events

The `connection` object is a standard Node.js Event Emitter.

- **authenticated** (Arguments: username, user) A client has successfully logged in. If a validateAuthentication function passes anything on the user approval, it will be on the second argument.
- **error** (Arguments: error) An error occurred.
- **end** (Arguments: connection, quitMessage) The connection closed the client's side.
- **close** (Arguments: connection, quitMessage) The connection closed from the server side.
- **user:quit** (Arguments: connection, quitMessage) The connection closed (fires for both methods).
- **user:nick** (Arguments: newNickname, oldNickname) The user has changed their nickname (or provided the nickname on first login when fired before authentication).

Additionally, any commands received from the client will be emitted as all caps, with the command parameters passed as arguments.  For example:

```js
// PRIVMSG #channel :This is my message\r\n
connection.on('PRIVMSG', function (target, message) {
	//target = '#channel'
	//message = 'This is my message'
});
```

##User Validation

By default, ircdkit will accept any user you connects to the server and sends the USER command.  If you wish to authenticate user accounts, 
you may do so by defining a `validateAuthentication` callback on the configuration options.  This callback will be invoked when the client
sends their username credentials. A password is sent as a separate command (PASS), and is optional within the protocol, so testing the user's
password must be done conditionally.  The validateAuthentication callback takes the following format:

```js
var irc = ircdkit({
	validateAuthentication: function (connection, username, accept, reject, waitForPass) {
		Users.find({username: username}, function (err, user) {
			if (err || !user) {
				reject('Unknown account');
				return;
			}

			waitForPass(function (password) {
				if (user.checkPassword(password)) {
					accept();
				} else {
					reject('Invalid login');
				}
			});
		});
	}
});
```

- **connection** (ConnectionObject) This is the connection object that needs authentication.
- **username** (String) The user's login username.
- **accept** (Function) Call this function to approve the user's login. You may pass a single argument to it to be associated with the user, such as a database model.
- **reject** (Function) Call this function to reject the user's login. You may pass a single argument containing a string explanation for the rejection.
- **waitForPass** (Function) As the password is sent separate from the username, and may not be sent at all, call this closure to indicate that the user must send a password.  Pass your own callback for when a password is available.  If no password is provided, the user's connection will timeout and your callback will be invoked without a password.

**NOTE**: If you define a validation function and do not call accept or reject, the connection will hang and eventually timeout.

##Nickname Validation

As with user accounts, nicknames may also be validated. This validation is invoked after the nickname has been checked for standard irc validations (length, valid characters, name collisions).

Accepting the nickname will change the user's nickname and trigger a nick change event on the server.  Rejecting the nickname will return an ERR_ERRONEOUSNICKNAME to the client.  Unlike with User Validation, you may call neither function if you wish to simply ignore the command.

```js
var irc = ircdkit({
	validateNickname: function (connection, nickname, previous, accept, reject) {
		Users.find({username: username}, function (err, user) {
			if (err || !user) {
				reject('Unknown account');
				return;
			}

			waitForPass(function (password) {
				if (user.checkPassword(password)) {
					accept();
				} else {
					reject('Invalid login');
				}
			});
		});
	}
});
```

- **connection** (ConnectionObject) This is the connection object that needs authentication.
- **username** (String) The user's requested nickname.
- **previous** (String) The user's previous nickname. If `requireNickname` is enabled, this value will be null at login.
- **accept** (Function) Call this function to approve the user's login. You may pass a single argument to it to be associated with the user, such as a database model.
- **reject** (Function) Call this function to reject the user's login. You may pass a single argument containing a string explanation for the rejection.
