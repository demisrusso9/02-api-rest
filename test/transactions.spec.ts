import { describe, test, expect, beforeAll, afterAll } from 'vitest'
import request from 'supertest'
import { app } from '../src/app'

describe('Transactions routes', () => {
  beforeAll(async () => {
    await app.ready()
  })

  afterAll(async () => {
    await app.close()
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

    const listTransactionsResponse = await request(app.server)
      .get('/transactions')
      .set('Cookie', cookies)
      .expect(200)

    expect(listTransactionsResponse.body.transactions).toEqual([
      expect.objectContaining({
        id: expect.any(String),
        title: 'Teste 1',
        amount: 5000
      })
    ])
  })
})
