const awsLambdaFastify = require('aws-lambda-fastify');
const fastify = require('fastify');
const app = require('./app');

const server = fastify({
	logger: true,
});
server.register(app);

const proxy = awsLambdaFastify(server);

exports.handler = proxy;
