import assert from 'node:assert/strict'
import test from 'node:test'
import { addGoalContribution, createGoal, deleteGoal, goalProgress, goalRemainingPaise, goalSavedPaise, loadGoals, updateGoal, validateContribution, validateGoal } from '../src/goals/goalStore.ts'

class MemoryStorage {
  private values = new Map<string, string>()
  getItem(key: string) { return this.values.get(key) ?? null }
  setItem(key: string, value: string) { this.values.set(key, value) }
}

const draft = { name: 'New Laptop', targetAmount: '80000', deadline: '2027-04-30', description: 'For college work' }

test('goal form requires a name and a positive target and rejects past or invalid deadlines', () => {
  assert.equal(validateGoal({ ...draft, name: '' }).name, 'Enter a goal name.')
  assert.equal(validateGoal({ ...draft, targetAmount: '0' }).targetAmount, 'Enter a positive amount with up to 2 decimal places.')
  assert.equal(validateGoal({ ...draft, targetAmount: '-5' }).targetAmount, 'Enter a positive amount with up to 2 decimal places.')
  assert.equal(validateGoal({ ...draft, deadline: '2026-02-30' }).deadline, 'Choose today or a future date.')
  assert.deepEqual(validateGoal(draft), {})
})

test('goals persist, begin without fake contributions, and retain contributions across edits', () => {
  const storage = new MemoryStorage()
  const created = createGoal(draft, storage)
  assert.equal(loadGoals(storage).length, 1)
  assert.equal(goalSavedPaise(created), 0)
  assert.equal(goalProgress(created), 0)
  assert.equal(goalRemainingPaise(created), 8_000_000)
  const withContribution = { ...created, contributions: [{ id: 'contribution-1', goalId: created.id, amountPaise: 2_500_000, date: '2026-10-28', note: 'Saved from allowance', createdAt: '2026-10-28T00:00:00.000Z' }] }
  storage.setItem('pocketwise.savingsGoals.v1', JSON.stringify([withContribution]))
  const updated = updateGoal(created.id, { ...draft, targetAmount: '20000', name: 'Updated Laptop' }, storage)
  assert.equal(updated.id, created.id)
  assert.equal(goalSavedPaise(updated), 2_500_000)
  assert.equal(goalProgress(updated), 100)
  assert.equal(goalRemainingPaise(updated), 0)
  assert.equal(loadGoals(storage)[0].name, 'Updated Laptop')
})

test('deleting a goal leaves unrelated finance transactions untouched', () => {
  const storage = new MemoryStorage()
  const goal = createGoal(draft, storage)
  storage.setItem('pocketwise.transactions.v1', JSON.stringify([{ id: 'finance-1', amountPaise: 50000, type: 'income' }]))
  deleteGoal(goal.id, storage)
  assert.deepEqual(loadGoals(storage), [])
  assert.equal(storage.getItem('pocketwise.transactions.v1'), JSON.stringify([{ id: 'finance-1', amountPaise: 50000, type: 'income' }]))
})

test('contributions validate, persist against the selected goal, and cap progress without discarding excess', () => {
  const storage = new MemoryStorage()
  storage.setItem('pocketwise.transactions.v1', '[{"id":"existing-finance-record"}]')
  const laptop = createGoal(draft, storage)
  const trip = createGoal({ ...draft, name: 'College Trip', targetAmount: '1000' }, storage)
  assert.equal(validateContribution({ amount: '', date: '2026-10-28', note: '' }).amount, 'Enter a contribution amount.')
  for (const amount of ['0', '-1', 'invalid', '1.001']) assert.ok(validateContribution({ amount, date: '2026-10-28', note: '' }).amount)
  assert.equal(validateContribution({ amount: '100', date: '2026-02-30', note: '' }).date, 'Choose a valid contribution date.')
  const first = addGoalContribution(laptop.id, { amount: '5000', date: '2026-10-28', note: 'From pocket money' }, storage)
  const second = addGoalContribution(laptop.id, { amount: '90000', date: '2026-10-29', note: '' }, storage)
  assert.equal(first.goalId, laptop.id)
  assert.equal(second.goalId, laptop.id)
  assert.equal(loadGoals(storage).find(goal => goal.id === trip.id)?.contributions.length, 0)
  const loaded = loadGoals(storage).find(goal => goal.id === laptop.id)!
  assert.equal(goalSavedPaise(loaded), 9_500_000)
  assert.equal(goalProgress(loaded), 100)
  assert.equal(goalRemainingPaise(loaded), 0)
  assert.equal(loaded.contributions.length, 2)
  assert.equal(storage.getItem('pocketwise.transactions.v1'), '[{"id":"existing-finance-record"}]')
})
