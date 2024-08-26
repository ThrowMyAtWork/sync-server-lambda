'use strict';

const fp = require('fastify-plugin');
const mssql = require('fastify-mssql');

module.exports = fp(async function (fastify, opts) {
	const server = fastify.config.DB_SERVER;
	const database = fastify.config.DB_DATABASE;
	const user = fastify.config.DB_USER;
	const password = fastify.config.DB_PASSWORD;

	const dbConfig = {
		server: server,
		port: 1433,
		user: user,
		password: password,
		database: database,
		authentication: {
			type: 'default',
		},
		options: {
			encrypt: true,
		},
	};
	console.log(dbConfig);

	fastify.register(mssql, dbConfig);
});
