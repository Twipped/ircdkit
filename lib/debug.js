
var debug = require('debug'),
	extend = require('util')._extend;

var cache = {};

module.exports = function (name) {
	if (name) name = 'ircdkit:' + name;
	else name = 'ircdkit';

	if (!cache[name]) {
		var d = cache[name] = debug(name);
		d.error = function error (source, err) {
			if (typeof err === 'object' && err.message && err.stack) {
				err = extend({
					message: err.message,
					stack: (err.stack || '').split('\n').slice(1).map(function (v) { return '' + v + ''; })
				}, err);
				err = JSON.encode(err, null, 2);
			}
			d(source, err);
		};
	}

	return cache[name];
};

