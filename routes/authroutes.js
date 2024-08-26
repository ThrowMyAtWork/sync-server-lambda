'use strict';

module.exports = async function (fastify, opts) {
	fastify.route({
		method: 'POST',
		url: '/auth',
		schema: {
			body: {
				type: 'object',
				properties: {
					username: { type: 'string' },
					password: { type: 'string' },
				},
				required: ['username', 'password'],
			},
			response: {
				200: {
					type: 'object',
					properties: {
						token: { type: 'string' },
					},
				},
			},
		},
		handler: async function (request, reply) {
			if (!request.body.username && request.body.username !== fastify.config.USER) {
				return reply.code(401).send(new Error('Password not valid'));
			}

			if (!request.body.password && request.body.password !== fastify.config.PASSWORD) {
				return reply.code(401).send(new Error('Password not valid'));
			}

			fastify.jwt.sign(request.body, (err, token) => {
				if (err) return reply.send(err);
				request.log.info('User Auth');
				reply.send({ token: token });
			});
		},
	});
};
