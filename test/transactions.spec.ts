import { app } from '../src/app';
import request from 'supertest';
import { expect, it, beforeAll, afterAll, describe, beforeEach } from 'vitest';
import { execSync } from 'node:child_process';

describe('Transactions routes', () => {
	beforeAll(async () => {
		await app.ready();
	});

	afterAll(async () => {
		await app.close();
	});

	beforeEach(() => {
		execSync('npm run knex migrate:rollback --all');
		execSync('npm run knex migrate:latest');
	});

	it('should user be able to create a new transaction', async () => {
		const response = await request(app.server).post('/transactions').send({
			title: 'New Transaction',
			amount: 5000,
			type: 'credit',
		});

		// console.log(response.get('Set-Cookie'));
		expect(response.statusCode).toEqual(201);
	});

	it('should be able to list all transactions', async () => {
		const createTransactionsResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New Transaction',
				amount: 5000,
				type: 'credit',
			});

		const cookies = createTransactionsResponse.get('Set-Cookie');

		if (!cookies) {
			return;
		}

		const listTransactionsResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
			.expect(200);

		expect(listTransactionsResponse.body.transactions).toEqual([
			expect.objectContaining({
				title: 'New Transaction',
				amount: 5000,
			}),
		]);
	});

	it('should be able to get a specific transaction', async () => {
		const createTransactionsResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'New Transaction',
				amount: 5000,
				type: 'credit',
			});

		const cookies = createTransactionsResponse.get('Set-Cookie');

		if (!cookies) return;

		const listTransactionsResponse = await request(app.server)
			.get('/transactions')
			.set('Cookie', cookies)
			.expect(200);

		const transactionId = listTransactionsResponse.body.transactions[0].id;

		const getTransactionResponse = await request(app.server)
			.get(`/transactions/${transactionId}`)
			.set('Cookie', cookies)
			.expect(200);

		console.log(getTransactionResponse.body);

		expect(getTransactionResponse.body.transaction).toEqual(
			expect.objectContaining({
				title: 'New Transaction',
				amount: 5000,
			})
		);
	});

	it('should be able to get the summary', async () => {
		const createTransactionsResponse = await request(app.server)
			.post('/transactions')
			.send({
				title: 'Credit Transaction',
				amount: 5000,
				type: 'credit',
			});

		const cookies = createTransactionsResponse.get('Set-Cookie');

		if (!cookies) {
			return;
		}

		await request(app.server)
			.post('/transactions')
			.set('Cookie', cookies)
			.send({
				title: 'Debit Transaction',
				amount: 2000,
				type: 'debit',
			});

		const summaryResponse = await request(app.server)
			.get('/transactions/summary')
			.set('Cookie', cookies)
			.expect(200);

		expect(summaryResponse.body.summary).toEqual({
			amount: 3000,
		});
	});
});
