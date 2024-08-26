'use strict';

const fp = require('fastify-plugin');
const fastifyAuth = require('@fastify/auth');
const fastifyJwt = require('@fastify/jwt');
const { Promise } = require('mssql');

module.exports = fp(async function (fastify, opts) {
	fastify.register(fastifyAuth);
	fastify.register(fastifyJwt, { secret: fastify.config.JWT_SECRET });

	fastify.decorate('verifyJWT', verifyJWT);
	fastify.decorate('verifyUsernameAndPassword', verifyUsernameAndPassword);

	function verifyJWT(request, reply) {
		if (request.body && request.failureWithReply) {
			reply.code(401).send({ error: 'Unauthorized' });
			return Promise.reject(new Error());
		}

		if (!request.raw.headers.auth) {
			return Promise.reject(new Error('Missing token header'));
		}

		return new Promise(function (resolve, reject) {
			fastify.jwt
				.verify(request.raw.headers.auth, function (err, decoded) {
					if (err) {
						return reject(err);
					}
					resolve(decoded);
				})
				.then(function (decoded) {
					if (decoded.password !== fastify.config.PASSWORD) {
						throw new Error('Token not Valid');
					}
					return;
				})
				.catch(function (err) {
					throw new Error('Token not Valid');
				});
		});
	}

	function verifyUsernameAndPassword(request, reply, done) {
		if (!request.body.username && request.body.username !== fastify.config.USER) {
			return done(new Error('Password not valid'));
		}

		if (!request.body.password && request.body.password !== fastify.config.PASSWORD) {
			return done(new Error('Password not valid'));
		}

		done();
	}
});
