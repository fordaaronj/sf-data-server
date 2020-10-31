import 'dotenv/config.js';

const config = {
	client: 'postgresql',
	connection: process.env.DATABASE_URL,
	migrations: {
		tableName: 'knex_migrations',
		directory: 'db/migrations'
	},
	pool: {
		min: 2,
		max: 20,
	}
}

export default config;

