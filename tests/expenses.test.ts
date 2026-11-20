import assert from 'node:assert/strict'
import test from 'node:test'
import {
  categoryTotals, currentMonthExpenses, currentMonthIncomes, deleteTransaction, loadExpenses, loadTransactions, recordedBalance, rupeesToPaise, saveExpense, saveIncome, updateTransaction, validateExpense, validateIncome,
  type ExpenseDraft,
} from '../src/expenses/expenseStore.ts'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const valid: ExpenseDraft = { amount: '250.50', category: 'Food & Dining', date: '2026-10-28', paymentMethod: 'UPI', note: 'Coffee with friends' }

test('valid rupee amounts become integer paise', () => {
  assert.equal(rupeesToPaise('250'), 25000)
  assert.equal(rupeesToPaise('250.5'), 25050)
  assert.equal(rupeesToPaise('250.50'), 25050)
})

test('empty, zero, negative and over-precision amounts are rejected', () => {
  for (const amount of ['', '0', '0.00', '-1', '1.001', 'abc']) assert.equal(rupeesToPaise(amount), null, amount)
  assert.equal(validateExpense({ ...valid, amount: '' }).amount, 'Enter an amount.')
})

test('category and calendar dates are validated', () => {
  assert.equal(validateExpense({ ...valid, category: '' }).category, 'Choose a category.')
  assert.equal(validateExpense({ ...valid, category: 'Coffee' }).category, 'Choose a category.')
  assert.equal(validateExpense({ ...valid, date: '2026-02-30' }).date, 'Choose a valid expense date.')
  assert.deepEqual(validateExpense(valid), {})
})

test('saved records persist through the storage source and totals separate months', () => {
  const storage = new MemoryStorage()
  const current = saveExpense(valid, storage)
  saveExpense({ ...valid, amount: '80', category: 'Travel', date: '2026-09-30', note: '' }, storage)
  const loaded = loadExpenses(storage)
  assert.equal(loaded.length, 2)
  assert.equal(loaded.find(x => x.id === current.id)?.amountPaise, 25050)
  const thisMonth = currentMonthExpenses(loaded, new Date(2026, 9, 28))
  assert.equal(thisMonth.length, 1)
  assert.deepEqual(categoryTotals(thisMonth), [{ category: 'Food & Dining', amountPaise: 25050, percent: 100 }])
})

test('income shares transaction storage, migrates existing expenses, and calculates month and balance correctly', () => {
  const storage = new MemoryStorage()
  const oldExpense = saveExpense(valid, storage)
  const oldIncome = { amount: '5000', source: 'Pocket Money', date: '2026-10-28', paymentMethod: 'Bank Transfer', note: 'Allowance' }
  assert.deepEqual(validateIncome({ ...oldIncome, source: '' }).source, 'Choose an income source.')
  assert.equal(validateIncome({ ...oldIncome, amount: '-20' }).amount, 'Enter a positive amount with up to 2 decimal places.')
  const income = saveIncome(oldIncome, storage)
  const historical = saveIncome({ ...oldIncome, amount: '1000', date: '2026-09-30' }, storage)
  const transactions = loadTransactions(storage)
  assert.equal(transactions.length, 3)
  assert.equal(loadExpenses(storage)[0].id, oldExpense.id)
  assert.equal(currentMonthIncomes(transactions.filter(x => x.type === 'income'), new Date(2026, 9, 28)).length, 1)
  assert.equal(recordedBalance(transactions), 574950)
  assert.equal(transactions.find(x => x.id === historical.id)?.date, '2026-09-30')
  assert.equal(transactions.find(x => x.id === income.id)?.paymentMethod, 'Bank Transfer')
})

test('legacy expense key remains readable and is preserved when first income is added', () => {
  const storage = new MemoryStorage()
  storage.setItem('pocketwise.expenses.v1', JSON.stringify([{ id: 'legacy', amountPaise: 12000, category: 'Travel', date: '2026-10-01', paymentMethod: 'UPI', note: '', createdAt: '2026-10-01T00:00:00.000Z' }]))
  saveIncome({ amount: '500', source: 'Gift', date: '2026-10-02', paymentMethod: '', note: '' }, storage)
  assert.equal(loadTransactions(storage).length, 2)
  assert.equal(loadExpenses(storage)[0].id, 'legacy')
})

test('editing preserves the transaction ID and deleting removes only the selected record', () => {
  const storage = new MemoryStorage()
  const income = saveIncome({ amount: '1000', source: 'Allowance', date: '2026-10-10', paymentMethod: '', note: 'Old note' }, storage)
  const expense = saveExpense(valid, storage)
  const updated = updateTransaction(income.id, { amount: '1200', source: 'Scholarship', date: '2026-10-11', paymentMethod: 'UPI', note: 'Updated note' }, storage)
  assert.equal(updated.id, income.id)
  assert.equal(updated.amountPaise, 120000)
  assert.equal(updated.type, 'income')
  assert.equal(loadTransactions(storage).length, 2)
  deleteTransaction(expense.id, storage)
  const remaining = loadTransactions(storage)
  assert.equal(remaining.length, 1)
  assert.equal(remaining[0].id, income.id)
  assert.throws(() => deleteTransaction(expense.id, storage), /could not be found/)
})
