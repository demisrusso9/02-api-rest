import fastify from 'fastify'
import { knex } from './database'
import { env } from './env'

const app = fastify()

app.get('/', async (req, res) => {
  const tables = await knex('transactions').select('*').returning('*')

  return tables
})

app.listen({ port: env.PORT }).then(() => {
  console.log('Server running')
})
