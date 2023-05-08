import { FastifyInstance } from 'fastify'
import { knex } from '../database'

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', async (req, res) => {
    const tables = await knex('transactions').select('*').returning('*')

    return tables
  })
}
