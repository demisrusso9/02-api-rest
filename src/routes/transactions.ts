import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'

export async function transactionRoutes(app: FastifyInstance) {
  app.get('/', async (req, res) => {
    const transactions = await knex('transactions').select('*')

    return {
      total: transactions.length,
      transactions
    }
  })

  app.get('/:id', async (req, res) => {
    const transactionSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = transactionSchema.parse(req.params)

    const transaction = await knex('transactions')
      .where({
        id
      })
      .first()

    if (transaction) return transaction

    return res.status(404).send()
  })

  app.get('/summary', async (req, res) => {
    const summary = await knex('transactions').sum('amount', { as: 'amount' }).first()

    return summary
  })

  app.post('/', async (req, res) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    })

    const { title, amount, type } = createTransactionSchema.parse(req.body)

    // credit is positive value, debit is a negative value
    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1
    })

    return res.status(201).send()
  })

  app.patch('/:id', async (req, res) => {
    const transactionSchema = z.object({
      id: z.string().uuid()
    })

    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number()
    })

    const { id } = transactionSchema.parse(req.params)
    const { title, amount } = createTransactionSchema.parse(req.body)

    const transaction = await knex('transactions')
      .where({
        id
      })
      .update({
        title,
        amount
      })

    if (transaction) return transaction

    return res.status(404).send()
  })

  app.delete('/:id', async (req, res) => {
    const transactionSchema = z.object({
      id: z.string().uuid()
    })

    const { id } = transactionSchema.parse(req.params)

    const removed = await knex('transactions').where({ id }).delete()

    if (removed) return res.status(200).send()

    return res.status(404).send()
  })
}
