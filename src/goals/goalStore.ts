import { rupeesToPaise } from '../expenses/expenseStore.ts'

const STORAGE_KEY = 'pocketwise.savingsGoals.v1'
export type GoalDraft = { name: string; targetAmount: string; deadline: string; description: string }
export type GoalContributionDraft = { amount: string; date: string; note: string }
export type GoalContribution = { id: string; goalId: string; amountPaise: number; date: string; note: string; createdAt: string }
export type SavingsGoal = { id: string; name: string; targetPaise: number; deadline: string; description: string; contributions: GoalContribution[]; createdAt: string; updatedAt: string }
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>

export function validateGoal(draft: GoalDraft): Partial<Record<keyof GoalDraft, string>> {
  const errors: Partial<Record<keyof GoalDraft, string>> = {}
  if (!draft.name.trim()) errors.name = 'Enter a goal name.'
  else if (draft.name.trim().length > 60) errors.name = 'Use 60 characters or fewer.'
  if (!draft.targetAmount.trim()) errors.targetAmount = 'Enter a target amount.'
  else if (rupeesToPaise(draft.targetAmount) === null) errors.targetAmount = 'Enter a positive amount with up to 2 decimal places.'
  if (draft.deadline && (!validDate(draft.deadline) || draft.deadline < localToday())) errors.deadline = 'Choose today or a future date.'
  if (draft.description.length > 160) errors.description = 'Use 160 characters or fewer.'
  return errors
}
export function validateContribution(draft: GoalContributionDraft): Partial<Record<keyof GoalContributionDraft, string>> {
  const errors: Partial<Record<keyof GoalContributionDraft, string>> = {}
  if (!draft.amount.trim()) errors.amount = 'Enter a contribution amount.'
  else if (rupeesToPaise(draft.amount) === null) errors.amount = 'Enter a positive amount with up to 2 decimal places.'
  if (!validDate(draft.date)) errors.date = 'Choose a valid contribution date.'
  if (draft.note.length > 100) errors.note = 'Use 100 characters or fewer.'
  return errors
}

function localToday() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` }
function validDate(value: string) { if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false; const [y,m,d] = value.split('-').map(Number); const date = new Date(y,m-1,d); return date.getFullYear()===y && date.getMonth()===m-1 && date.getDate()===d }
function validGoal(value: unknown): value is SavingsGoal {
  if (!value || typeof value !== 'object') return false
  const goal = value as SavingsGoal
  return typeof goal.id === 'string' && !!goal.id && typeof goal.name === 'string' && !!goal.name.trim() && Number.isSafeInteger(goal.targetPaise) && goal.targetPaise > 0 && (!goal.deadline || validDate(goal.deadline)) && typeof goal.description === 'string' && Array.isArray(goal.contributions) && goal.contributions.every(item => item && typeof item.id === 'string' && (!item.goalId || item.goalId === goal.id) && Number.isSafeInteger(item.amountPaise) && item.amountPaise > 0 && validDate(item.date) && typeof item.note === 'string' && typeof item.createdAt === 'string') && typeof goal.createdAt === 'string' && typeof goal.updatedAt === 'string'
}
function normalizeGoal(goal: SavingsGoal): SavingsGoal { return { ...goal, contributions: goal.contributions.map(item => ({ ...item, goalId: item.goalId || goal.id })) } }
export function loadGoals(storage: StoragePort = window.localStorage): SavingsGoal[] {
  try { const parsed: unknown = JSON.parse(storage.getItem(STORAGE_KEY) ?? '[]'); return Array.isArray(parsed) ? parsed.filter(validGoal).map(normalizeGoal) : [] } catch { return [] }
}
function readGoalsForWrite(storage: StoragePort): SavingsGoal[] {
  const raw = storage.getItem(STORAGE_KEY)
  let parsed: unknown
  try { parsed = JSON.parse(raw ?? '[]') } catch { throw new Error('Saved goals could not be read. Nothing was changed.') }
  if (!Array.isArray(parsed) || parsed.some(item => !validGoal(item))) throw new Error('Saved goals could not be read safely. Nothing was changed.')
  return parsed.map(normalizeGoal)
}
export function goalSavedPaise(goal: SavingsGoal) { return goal.contributions.reduce((sum, item) => sum + item.amountPaise, 0) }
export function goalProgress(goal: SavingsGoal) { const saved = goalSavedPaise(goal); return goal.targetPaise > 0 ? Math.min(100, Math.floor(saved / goal.targetPaise * 100)) : 0 }
export function goalRemainingPaise(goal: SavingsGoal) { return Math.max(goal.targetPaise - goalSavedPaise(goal), 0) }

function toRecord(draft: GoalDraft, prior?: SavingsGoal): SavingsGoal {
  return { id: prior?.id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, name: draft.name.trim(), targetPaise: rupeesToPaise(draft.targetAmount)!, deadline: draft.deadline, description: draft.description.trim(), contributions: prior?.contributions ?? [], createdAt: prior?.createdAt ?? new Date().toISOString(), updatedAt: new Date().toISOString() }
}
export function createGoal(draft: GoalDraft, storage: StoragePort = window.localStorage): SavingsGoal {
  if (Object.keys(validateGoal(draft)).length) throw new Error('Please correct the highlighted goal details.')
  const goal = toRecord(draft)
  storage.setItem(STORAGE_KEY, JSON.stringify([goal, ...readGoalsForWrite(storage)]))
  return goal
}
export function updateGoal(id: string, draft: GoalDraft, storage: StoragePort = window.localStorage): SavingsGoal {
  if (Object.keys(validateGoal(draft)).length) throw new Error('Please correct the highlighted goal details.')
  const goals = readGoalsForWrite(storage)
  const existing = goals.find(item => item.id === id)
  if (!existing) throw new Error('This goal could not be found. Refresh the page and try again.')
  const updated = toRecord(draft, existing)
  storage.setItem(STORAGE_KEY, JSON.stringify(goals.map(item => item.id === id ? updated : item)))
  return updated
}
export function deleteGoal(id: string, storage: StoragePort = window.localStorage): void {
  const goals = readGoalsForWrite(storage)
  const existing = goals.find(item => item.id === id)
  if (!existing) throw new Error('This goal could not be found. Refresh the page and try again.')
  storage.setItem(STORAGE_KEY, JSON.stringify(goals.filter(item => item.id !== id)))
}
export function addGoalContribution(goalId: string, draft: GoalContributionDraft, storage: StoragePort = window.localStorage): GoalContribution {
  if (Object.keys(validateContribution(draft)).length) throw new Error('Please correct the highlighted contribution details.')
  const goals = readGoalsForWrite(storage)
  const goal = goals.find(item => item.id === goalId)
  if (!goal) throw new Error('This savings goal could not be found. Refresh the page and try again.')
  const contribution: GoalContribution = { id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`, goalId, amountPaise: rupeesToPaise(draft.amount)!, date: draft.date, note: draft.note.trim(), createdAt: new Date().toISOString() }
  const updated = { ...goal, contributions: [...goal.contributions, contribution], updatedAt: new Date().toISOString() }
  storage.setItem(STORAGE_KEY, JSON.stringify(goals.map(item => item.id === goalId ? updated : item)))
  return contribution
}
