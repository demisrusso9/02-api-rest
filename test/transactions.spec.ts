import { describe, test, expect, beforeAll, afterAll, beforeEach } from 'vitest'
import { execSync } from 'node:child_process' // run terminal commands
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
  })

  beforeEach(() => {
    execSync('npm run knex migrate:rollback --all')
    execSync('npm run knex migrate:latest')
  })

  test('user can create a new transaction', async () => {
    await request(app.server)
      .post('/transactions')
      .send({
        title: 'Teste 1',
        amount: 5000,
        type: 'credit'
      })
      .expect(201)
  })

  test('user can list all transactions', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'Teste 1',
      amount: 5000,
      type: 'credit'
    })

    // get cookies
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        title: 'Teste 1',
        amount: 5000
      })
    ])
  })

  test('user can list a specific transaction', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'Specific',
      amount: 1000,
      type: 'credit'
    })

    // get cookies
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    const getTransactionResponse = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(getTransactionResponse.body).toEqual(
      expect.objectContaining({
        title: 'Specific',
        amount: 1000
      })
    )
  })

  test('user can get the summary', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'Transaction 1',
      amount: 5000,
      type: 'credit'
    })

    // get cookies
    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server).post('/transactions').set('Cookie', cookies).send({
      title: 'Transaction 2',
      amount: 2000,
      type: 'debit'
    })

    const getTransactionsSummary = await request(app.server)
      .get('/transactions/summary')
      .set('Cookie', cookies)

    expect(getTransactionsSummary.body).toEqual(
      expect.objectContaining({
        amount: 3000
      })
    )
  })

  test('user can update a transaction', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'Transaction 1',
      amount: 5000,
      type: 'credit'
    })

    // get cookies
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    await request(app.server).patch(`/transactions/${transactionId}`).set('Cookie', cookies).send({
      title: 'Transaction 1 Updated',
      amount: 1000,
      type: 'debit'
    })

    const updatedTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(updatedTransaction.body).toEqual(
      expect.objectContaining({
        title: 'Transaction 1 Updated',
        amount: 1000
      })
    )
  })

  test('user can delete a transaction', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'Transaction 1',
      amount: 5000,
      type: 'credit'
    })

    // get cookies
    const cookies = createTransactionResponse.get('Set-Cookie')

    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies)

    const transactionId = listTransactionsResponse.body.transactions[0].id

    await request(app.server).delete(`/transactions/${transactionId}`).set('Cookie', cookies)

    const deletedTransaction = await request(app.server)
      .get(`/transactions/${transactionId}`)
      .set('Cookie', cookies)

    expect(deletedTransaction.statusCode).toBe(404)
  })

  test('user can delete all transactions', async () => {
    const createTransactionResponse = await request(app.server).post('/transactions').send({
      title: 'Transaction 1',
      amount: 5000,
      type: 'credit'
    })

    // get cookies
    const cookies = createTransactionResponse.get('Set-Cookie')

    await request(app.server).post('/transactions').set('Cookie', cookies).send({
      title: 'Transaction 2',
      amount: 1000,
      type: 'credit'
    })

    await request(app.server).post('/transactions').set('Cookie', cookies).send({
      title: 'Transaction 3',
      amount: 2000,
      type: 'credit'
    })

    await request(app.server).delete('/transactions').set('Cookie', cookies)
    const listTransactionsResponse = await request(app.server).get('/transactions').set('Cookie', cookies)

    expect(listTransactionsResponse.body.transactions).toEqual([])
  })
})
