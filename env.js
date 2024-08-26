'use strict';

const fastifyEnv = require('@fastify/env');
const fastifyPlugin = require('fastify-plugin');

const schema = {
	type: 'object',
	required: ['DB_USER', 'DB_PASSWORD', 'DB_SERVER', 'DB_DATABASE'],
	properties: {
		DB_USER: {
			type: 'string',
			default: 'user',
		},
		DB_PASSWORD: {
			type: 'string',
			default: 'password',
		},
		DB_SERVER: {
			type: 'string',
			default: 'localhost',
		},
		DB_DATABASE: {
			type: 'string',
			default: 'database',
		},
		JWT_SECRET: {
			type: 'string',
			default: 'SuperSecretSecret',
		},
		USER: {
			type: 'string',
		},
		PASSWORD: {
			type: 'string',
		},
	},
};

module.exports = async function configPlugin(server, options, done) {
	const envOptions = {
		confKey: 'config',
		schema: schema,
		data: process.env,
		dotenv: true,
	};
	return fastifyEnv(server, envOptions, done);
};
