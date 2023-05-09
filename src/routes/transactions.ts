import { randomUUID } from 'crypto'
import { FastifyInstance } from 'fastify'
import { z } from 'zod'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'

export async function transactionRoutes(app: FastifyInstance) {
  app.get(
    '/',
    {
      preHandler: checkSessionIdExists
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const transactions = await knex('transactions').select('*').where({ session_id: sessionId })

      return {
        total: transactions.length,
        transactions
      }
    }
  )

  app.get(
    '/:id',
    {
      preHandler: checkSessionIdExists
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const transactionSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = transactionSchema.parse(req.params)

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id
        })
        .first()

      if (transaction) return transaction

      return res.status(404).send()
    }
  )

  app.get(
    '/summary',
    {
      preHandler: checkSessionIdExists
    },
    async (req, res) => {
      const { sessionId } = req.cookies

      const summary = await knex('transactions')
        .where({
          session_id: sessionId
        })
        .sum('amount', { as: 'amount' })
        .first()

      return summary
    }
  )

  app.post('/', async (req, res) => {
    const createTransactionSchema = z.object({
      title: z.string(),
      amount: z.number(),
      type: z.enum(['credit', 'debit'])
    })

    const { title, amount, type } = createTransactionSchema.parse(req.body)

    // creates a sessionId
    let { sessionId } = req.cookies

    if (!sessionId) {
      sessionId = randomUUID()

      res.cookie('sessionId', sessionId, {
        path: '/',
        maxAge: 1000 * 60 * 60 * 24 * 7 // 7 days
      })
    }

    // credit is positive value, debit is a negative value
    await knex('transactions').insert({
      id: randomUUID(),
      title,
      amount: type === 'credit' ? amount : amount * -1,
      session_id: sessionId
    })

    return res.status(201).send()
  })

  app.patch(
    '/:id',
    {
      preHandler: checkSessionIdExists
    },
    async (req, res) => {
      const { sessionId } = req.cookies
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
          id,
          session_id: sessionId
        })
        .update({
          title,
          amount
        })

      if (transaction) return transaction

      return res.status(404).send()
    }
  )

  app.delete(
    '/:id',
    {
      preHandler: checkSessionIdExists
    },
    async (req, res) => {
      const { sessionId } = req.cookies
      
      const transactionSchema = z.object({
        id: z.string().uuid()
      })

      const { id } = transactionSchema.parse(req.params)

      const removed = await knex('transactions').where({ id, session_id: sessionId }).delete()

      if (removed) return res.status(200).send()

      return res.status(404).send()
    }
  )

  app.delete(
    '/',
    {
      preHandler: checkSessionIdExists
    },
    async (req, res) => {
      await knex('transactions').delete()

      return res.status(200).send()
    }
  )
}
