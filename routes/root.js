'use strict';

module.exports = async function (fastify, opts) {
	fastify.get('/', async function (request, reply) {
		const server = fastify.config.DB_SERVER;
		return { root: server };
	});
};
