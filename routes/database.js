'use strict';

const sql = require('mssql');

module.exports = async function (fastify, opts) {
	fastify.route({
		method: 'GET',
		url: '/kb/getPrice/:sku',
		preHandler: fastify.auth([fastify.verifyJWT]),
		handler: async (request, reply) => {
			try {
				const { sku } = request.params;
				const pool = await fastify.mssql.pool.connect();
				const query = 'SELECT * FROM [x].[productsPrice] WHERE ProductSKU=@sku';
				const res = await pool.request().input('sku', fastify.mssql.sqlTypes.NVarChar(40), sku).query(query);
				return { record: res.recordset };
			} catch (err) {
				return err;
			}
		},
	});

	fastify.route({
		method: 'POST',
		url: '/kb/inputPrice',
		preHandler: fastify.auth([fastify.verifyJWT]),
		schema: {
			body: {
				type: 'object',
				properties: {
					sku: { type: 'string' },
					price: { type: 'number' },
					cost: { type: 'number' },
					pricebook: { type: 'string' },
				},
				required: ['sku', 'price', 'cost', 'pricebook'],
			},
			response: {
				200: {
					type: 'object',
					properties: {
						msg: {
							type: 'string',
						},
					},
				},
			},
		},
		handler: async function (request, reply) {
			try {
				// TODO: Validate inpute Data
				const { sku, cost, price, pricebook } = request.body;
				const pool = await fastify.mssql.pool.connect();
				const query = `INSERT INTO [x].[productsPrice] (ProductSKU,ProductCost,ProductPrice,PriceBookID) VALUES ('@sku',@cost,@price,'@pricebook')`;
				const res = await pool
					.request()
					.input('sku', fastify.mssql.sqlTypes.NVarChar(40), sku)
					.input('cost', fastify.mssql.sqlTypes.Money, cost)
					.input('price', fastify.mssql.sqlTypes.Money, price)
					.input('pricebook', fastify.mssql.sqlTypes.NVarChar(40), pricebook)
					.query(query);
				return reply.code(200).send({ msg: res.rowsAffected });
			} catch (err) {
				return err;
			}
		},
	});

	// TODO: Add Batch Insert with Transaction
	fastify.route({
		method: 'POST',
		url: '/kb/inputPrices',
		preHandler: fastify.auth([fastify.verifyJWT]),
		schema: {
			body: {
				type: 'object',
				properties: {
					rows: {
						type: 'array',
						items: {
							type: 'object',
							properties: {
								sku: { type: 'string' },
								price: { type: 'number' },
								cost: { type: 'number' },
								pricebook: { type: 'string' },
							},
							required: ['sku', 'price', 'cost', 'pricebook'],
						},
					},
					rowCount: { type: 'number' },
				},
				required: ['rows'],
			},
		},
		handler: async function (request, reply) {
			let totalrows = 0;
			let rowCount = 0;
			try {
				const pool = await fastify.mssql.pool.connect();
				// Create Table
				const table = new sql.Table('[x].[productsPrice]');
				table.create = true;
				table.columns.add('ProductSKU', sql.NVarChar(40), { nullable: false });
				table.columns.add('ProductPrice', sql.Money, { nullable: false });
				table.columns.add('ProductCost', sql.Money, { nullable: false });
				table.columns.add('ProductCurrency', sql.NVarChar(3), { nullable: false });
				table.columns.add('ProductUOM', sql.NVarChar(10), { nullable: false });
				table.columns.add('PriceBookID', sql.NVarChar(40), { nullable: false });

				// Populate Table
				let id = 110001;
				request.body.rows.forEach((row) => {
					fastify.log.info(row.sku);
					rowCount += 1;
					table.rows.add(row.sku, row.price, row.cost, 'USD', 'ea', row.pricebook);
					id += 1;
				});

				// Open Transaction
				const transaction = new sql.Transaction(pool);
				transaction.begin((err) => {
					if (err) {
						fastify.log.info(err);
						throw new Error(err);
					}

					fastify.log.info('Transaction Open');
					const req = new sql.Request(transaction);
					req.bulk(table, (err, res) => {
						if (err) {
							fastify.log.info(err);
							transaction.rollback((err) => {
								fastify.log.info(err);
								throw new Error(err);
							});
							throw new Error(err);
						}
						totalrows += res.rowsAffected;
						if (totalrows === 0 || totalrows !== rowCount) {
							transaction.rollback((err) => {
								fastify.log.info(err);
							});
							throw new Error('Not all rows was inserted');
						}
						transaction.commit((err) => {
							if (err) {
								throw new Error(err);
							} else {
								return reply.code(200).send({ msg: totalrows });
							}
						});
					});
				});
			} catch (err) {
				fastify.log.error(err);
				return reply.code(500).send(err);
			}
		},
	});
};
