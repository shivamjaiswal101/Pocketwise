export const EXPENSE_CATEGORIES = [
  'Food & Dining', 'Travel', 'Shopping', 'Entertainment', 'Education', 'Health', 'Bills & Utilities', 'Other',
] as const
export const PAYMENT_METHODS = ['Cash', 'UPI', 'Card', 'Other'] as const
export const INCOME_SOURCES = ['Pocket Money', 'Allowance', 'Internship Salary', 'Part-time Job', 'Scholarship', 'Gift', 'Freelance', 'Other'] as const
export const INCOME_PAYMENT_METHODS = ['Cash', 'UPI', 'Bank Transfer', 'Card', 'Other'] as const
const STORAGE_KEY = 'pocketwise.transactions.v1'
const LEGACY_EXPENSES_KEY = 'pocketwise.expenses.v1'

export type ExpenseCategory = typeof EXPENSE_CATEGORIES[number]
export type PaymentMethod = typeof PAYMENT_METHODS[number]
export type ExpenseDraft = { amount: string; category: string; date: string; paymentMethod: string; note: string }
export type ExpenseRecord = { id: string; amountPaise: number; category: ExpenseCategory; date: string; paymentMethod: PaymentMethod; note: string; createdAt: string }
export type IncomeSource = typeof INCOME_SOURCES[number]
export type IncomePaymentMethod = typeof INCOME_PAYMENT_METHODS[number]
export type IncomeDraft = { amount: string; source: string; date: string; paymentMethod: string; note: string }
export type IncomeRecord = { id: string; type: 'income'; amountPaise: number; source: IncomeSource; date: string; paymentMethod: IncomePaymentMethod | ''; note: string; createdAt: string }
export type TransactionRecord = (ExpenseRecord & { type: 'expense' }) | IncomeRecord
export type TransactionDraft = ExpenseDraft | IncomeDraft
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>

export function todayLocal(): string {
  const d = new Date()
  return `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`
}

export function monthKey(date: Date): string {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}`
}

export function rupeesToPaise(value: string): number | null {
  const raw = value.trim()
  if (!/^\d+(?:\.\d{1,2})?$/.test(raw)) return null
  const [whole, fraction = ''] = raw.split('.')
  const paise = Number(whole) * 100 + Number(fraction.padEnd(2, '0'))
  return Number.isSafeInteger(paise) && paise > 0 ? paise : null
}

export function validateExpense(draft: ExpenseDraft): Partial<Record<keyof ExpenseDraft, string>> {
  const errors: Partial<Record<keyof ExpenseDraft, string>> = {}
  if (!draft.amount.trim()) errors.amount = 'Enter an amount.'
  else if (rupeesToPaise(draft.amount) === null) errors.amount = 'Enter a positive amount with up to 2 decimal places.'
  if (!EXPENSE_CATEGORIES.includes(draft.category as ExpenseCategory)) errors.category = 'Choose a category.'
  if (!isValidDate(draft.date)) errors.date = 'Choose a valid expense date.'
  if (!PAYMENT_METHODS.includes(draft.paymentMethod as PaymentMethod)) errors.paymentMethod = 'Choose a payment method.'
  if (draft.note.length > 100) errors.note = 'Keep the note to 100 characters or fewer.'
  return errors
}

export function validateIncome(draft: IncomeDraft): Partial<Record<keyof IncomeDraft, string>> {
  const errors: Partial<Record<keyof IncomeDraft, string>> = {}
  if (!draft.amount.trim()) errors.amount = 'Enter an amount.'
  else if (rupeesToPaise(draft.amount) === null) errors.amount = 'Enter a positive amount with up to 2 decimal places.'
  if (!INCOME_SOURCES.includes(draft.source as IncomeSource)) errors.source = 'Choose an income source.'
  if (!isValidDate(draft.date)) errors.date = 'Choose a valid income date.'
  if (draft.paymentMethod && !INCOME_PAYMENT_METHODS.includes(draft.paymentMethod as IncomePaymentMethod)) errors.paymentMethod = 'Choose a valid payment method.'
  if (draft.note.length > 100) errors.note = 'Keep the note to 100 characters or fewer.'
  return errors
}

function isValidDate(value: string): boolean {
  if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) return false
  const [year, month, day] = value.split('-').map(Number)
  const date = new Date(year, month - 1, day)
  return date.getFullYear() === year && date.getMonth() === month - 1 && date.getDate() === day
}

function parseExpenses(raw: string | null): ExpenseRecord[] {
  try {
    const parsed: unknown = JSON.parse(raw ?? '[]')
    if (!Array.isArray(parsed)) return []
    return parsed.filter((item): item is ExpenseRecord => item && typeof item.id === 'string' && Number.isSafeInteger(item.amountPaise) && item.amountPaise > 0 && EXPENSE_CATEGORIES.includes(item.category) && isValidDate(item.date) && PAYMENT_METHODS.includes(item.paymentMethod) && typeof item.createdAt === 'string' && typeof item.note === 'string')
  } catch { return [] }
}

export function loadTransactions(storage: StoragePort = window.localStorage): TransactionRecord[] {
  try {
    const current = storage.getItem(STORAGE_KEY)
    const expenses: TransactionRecord[] = parseExpenses(current === null ? storage.getItem(LEGACY_EXPENSES_KEY) : current).map(item => ({ ...item, type: 'expense' as const }))
    const parsed: unknown = JSON.parse(current ?? '[]')
    if (!Array.isArray(parsed)) return expenses
    const incomes = parsed.filter((item): item is IncomeRecord => item && item.type === 'income' && typeof item.id === 'string' && Number.isSafeInteger(item.amountPaise) && item.amountPaise > 0 && INCOME_SOURCES.includes(item.source) && isValidDate(item.date) && (item.paymentMethod === '' || INCOME_PAYMENT_METHODS.includes(item.paymentMethod)) && typeof item.createdAt === 'string' && typeof item.note === 'string')
    return [...expenses, ...incomes]
  } catch { return [] }
}

export function loadExpenses(storage: StoragePort = window.localStorage): ExpenseRecord[] {
  return loadTransactions(storage).filter((item): item is ExpenseRecord & { type: 'expense' } => item.type === 'expense')
}

export function saveExpense(draft: ExpenseDraft, storage: StoragePort = window.localStorage): ExpenseRecord {
  const errors = validateExpense(draft)
  if (Object.keys(errors).length) throw new Error('Please correct the highlighted expense details.')
  const record: ExpenseRecord = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    amountPaise: rupeesToPaise(draft.amount)!,
    category: draft.category as ExpenseCategory,
    date: draft.date,
    paymentMethod: draft.paymentMethod as PaymentMethod,
    note: draft.note.trim(),
    createdAt: new Date().toISOString(),
  }
  storage.setItem(STORAGE_KEY, JSON.stringify([{ ...record, type: 'expense' as const }, ...loadTransactions(storage)]))
  return record
}

export function saveIncome(draft: IncomeDraft, storage: StoragePort = window.localStorage): IncomeRecord {
  const errors = validateIncome(draft)
  if (Object.keys(errors).length) throw new Error('Please correct the highlighted income details.')
  const record: IncomeRecord = {
    id: globalThis.crypto?.randomUUID?.() ?? `${Date.now()}-${Math.random().toString(36).slice(2)}`,
    type: 'income', amountPaise: rupeesToPaise(draft.amount)!, source: draft.source as IncomeSource,
    date: draft.date, paymentMethod: draft.paymentMethod as IncomePaymentMethod | '', note: draft.note.trim(), createdAt: new Date().toISOString(),
  }
  storage.setItem(STORAGE_KEY, JSON.stringify([record, ...loadTransactions(storage)]))
  return record
}

export function updateTransaction(id: string, draft: TransactionDraft, storage: StoragePort = window.localStorage): TransactionRecord {
  const transactions = loadTransactions(storage)
  const existing = transactions.find(item => item.id === id)
  if (!existing) throw new Error('This transaction could not be found. Refresh the page and try again.')
  let updated: TransactionRecord
  if (existing.type === 'expense') {
    const value = draft as ExpenseDraft
    if (Object.keys(validateExpense(value)).length) throw new Error('Please correct the highlighted transaction details.')
    updated = { ...existing, amountPaise: rupeesToPaise(value.amount)!, category: value.category as ExpenseCategory, date: value.date, paymentMethod: value.paymentMethod as PaymentMethod, note: value.note.trim() }
  } else {
    const value = draft as IncomeDraft
    if (Object.keys(validateIncome(value)).length) throw new Error('Please correct the highlighted transaction details.')
    updated = { ...existing, amountPaise: rupeesToPaise(value.amount)!, source: value.source as IncomeSource, date: value.date, paymentMethod: value.paymentMethod as IncomePaymentMethod | '', note: value.note.trim() }
  }
  storage.setItem(STORAGE_KEY, JSON.stringify(transactions.map(item => item.id === id ? updated : item)))
  return updated
}

export function deleteTransaction(id: string, storage: StoragePort = window.localStorage): void {
  const transactions = loadTransactions(storage)
  if (!transactions.some(item => item.id === id)) throw new Error('This transaction could not be found. Refresh the page and try again.')
  storage.setItem(STORAGE_KEY, JSON.stringify(transactions.filter(item => item.id !== id)))
}

export function currentMonthIncomes(records: IncomeRecord[], now = new Date()): IncomeRecord[] {
  const key = monthKey(now)
  return records.filter(record => record.date.slice(0, 7) === key)
}

export function recordedBalance(transactions: TransactionRecord[]): number {
  return transactions.reduce((balance, item) => balance + (item.type === 'income' ? item.amountPaise : -item.amountPaise), 0)
}

export function currentMonthExpenses(expenses: ExpenseRecord[], now = new Date()): ExpenseRecord[] {
  const key = monthKey(now)
  return expenses.filter(expense => expense.date.slice(0, 7) === key)
}

export function categoryTotals(expenses: ExpenseRecord[]) {
  const totals = new Map<ExpenseCategory, number>()
  for (const expense of expenses) totals.set(expense.category, (totals.get(expense.category) ?? 0) + expense.amountPaise)
  const sum = [...totals.values()].reduce((total, amount) => total + amount, 0)
  return [...totals.entries()].map(([category, amountPaise]) => ({ category, amountPaise, percent: sum ? Math.round(amountPaise / sum * 100) : 0 })).sort((a, b) => b.amountPaise - a.amountPaise)
}
