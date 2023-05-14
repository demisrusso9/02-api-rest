import { knex as setupKnex, Knex } from 'knex'
import { env } from './env'

const environment =
  env.DATABASE_CLIENT === 'sqlite'
    ? {
        filename: env.DATABASE_URL
      }
    : env.DATABASE_URL

export const config: Knex.Config = {
  client: env.DATABASE_CLIENT,
  connection: environment,
  migrations: {
    extension: 'ts',
    directory: './db/migrations'
  },
  useNullAsDefault: true
}

export const knex = setupKnex(config)
