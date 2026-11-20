import { EXPENSE_CATEGORIES, recordedBalance, rupeesToPaise, todayLocal, type ExpenseCategory, type TransactionRecord } from '../expenses/expenseStore.ts'

const SETTINGS_KEY = 'pocketwise.forecast.settings.v1'
const UPCOMING_KEY = 'pocketwise.forecast.upcoming.v1'
export type ForecastPeriod = 'until-allowance' | '7' | '15' | '30'
export type ForecastSettings = { nextAllowanceDate: string; expectedAmountPaise: number | null; period: ForecastPeriod }
export type ForecastSettingsDraft = { nextAllowanceDate: string; expectedAmount: string; period: ForecastPeriod }
export type UpcomingExpense = { id: string; name: string; amountPaise: number; date: string; category: ExpenseCategory; note: string; createdAt: string }
export type UpcomingExpenseDraft = { name: string; amount: string; date: string; category: string; note: string }
type StoragePort = Pick<Storage, 'getItem' | 'setItem'>
const isDate = (s: string) => { if (!/^\d{4}-\d{2}-\d{2}$/.test(s)) return false; const [y,m,d]=s.split('-').map(Number); const dt=new Date(y,m-1,d); return dt.getFullYear()===y&&dt.getMonth()===m-1&&dt.getDate()===d }
const validPeriod = (p: string): p is ForecastPeriod => ['until-allowance','7','15','30'].includes(p)
export function validateSettings(d: ForecastSettingsDraft, today = todayLocal()) {
  const e: Partial<Record<keyof ForecastSettingsDraft,string>> = {}
  if (d.nextAllowanceDate && (!isDate(d.nextAllowanceDate) || d.nextAllowanceDate < today)) e.nextAllowanceDate = 'Choose today or a future date.'
  if (d.expectedAmount.trim() && rupeesToPaise(d.expectedAmount) === null) e.expectedAmount = 'Enter a positive amount with up to 2 decimal places.'
  if (!validPeriod(d.period)) e.period = 'Choose a forecast period.'
  if (d.period === 'until-allowance' && !d.nextAllowanceDate) e.nextAllowanceDate = 'Choose an allowance date or select a fixed period.'
  return e
}
export function loadForecastSettings(storage: StoragePort = window.localStorage): ForecastSettings | null {
  try { const d = JSON.parse(storage.getItem(SETTINGS_KEY) ?? 'null') as ForecastSettings | null; return d && (!d.nextAllowanceDate || isDate(d.nextAllowanceDate)) && (d.expectedAmountPaise === null || (Number.isSafeInteger(d.expectedAmountPaise) && d.expectedAmountPaise > 0)) && validPeriod(d.period) ? d : null } catch { return null }
}
export function saveForecastSettings(d: ForecastSettingsDraft, storage: StoragePort = window.localStorage, today = todayLocal()): ForecastSettings {
  if (Object.keys(validateSettings(d,today)).length) throw new Error(Object.values(validateSettings(d,today))[0])
  const settings = { nextAllowanceDate: d.nextAllowanceDate, expectedAmountPaise: d.expectedAmount.trim() ? rupeesToPaise(d.expectedAmount) : null, period: d.period }
  storage.setItem(SETTINGS_KEY, JSON.stringify(settings)); return settings
}
export function loadUpcomingExpenses(storage: StoragePort = window.localStorage): UpcomingExpense[] {
  try { const v: unknown = JSON.parse(storage.getItem(UPCOMING_KEY) ?? '[]'); return Array.isArray(v) ? v.filter((x): x is UpcomingExpense => x && typeof x.id==='string' && typeof x.name==='string' && x.name.trim() && Number.isSafeInteger(x.amountPaise) && x.amountPaise>0 && isDate(x.date) && EXPENSE_CATEGORIES.includes(x.category) && typeof x.note==='string' && typeof x.createdAt==='string') : [] } catch { return [] }
}
export function validateUpcoming(d: UpcomingExpenseDraft, today = todayLocal()) {
  const e: Partial<Record<keyof UpcomingExpenseDraft,string>> = {}
  if (!d.name.trim()) e.name = 'Enter an expense name.'
  else if (d.name.trim().length > 80) e.name = 'Keep the name to 80 characters or fewer.'
  if (!d.amount.trim()) e.amount = 'Enter an expected amount.'
  else if (rupeesToPaise(d.amount) === null) e.amount = 'Enter a positive amount with up to 2 decimal places.'
  if (!isDate(d.date) || d.date < today) e.date = 'Choose today or a future date.'
  if (!EXPENSE_CATEGORIES.includes(d.category as ExpenseCategory)) e.category = 'Choose a category.'
  if (d.note.length > 100) e.note = 'Keep the note to 100 characters or fewer.'
  return e
}
export function saveUpcomingExpense(d: UpcomingExpenseDraft, storage: StoragePort = window.localStorage, id?: string, today = todayLocal()) {
  if (Object.keys(validateUpcoming(d,today)).length) throw new Error(Object.values(validateUpcoming(d,today))[0])
  const items = loadUpcomingExpenses(storage)
  if (id && !items.some(i => i.id === id)) throw new Error('This planned expense could not be found.')
  const record: UpcomingExpense = { id: id ?? globalThis.crypto?.randomUUID?.() ?? `${Date.now()}`, name:d.name.trim(), amountPaise:rupeesToPaise(d.amount)!, date:d.date, category:d.category as ExpenseCategory, note:d.note.trim(), createdAt:items.find(i=>i.id===id)?.createdAt ?? new Date().toISOString() }
  storage.setItem(UPCOMING_KEY, JSON.stringify([record,...items.filter(i=>i.id!==id)])); return record
}
export function deleteUpcomingExpense(id: string, storage: StoragePort = window.localStorage) { storage.setItem(UPCOMING_KEY, JSON.stringify(loadUpcomingExpenses(storage).filter(i=>i.id!==id))) }
export const addDateDays = (s: string, n: number) => { const [y,m,d]=s.split('-').map(Number); const dt=new Date(y,m-1,d+n); return `${dt.getFullYear()}-${String(dt.getMonth()+1).padStart(2,'0')}-${String(dt.getDate()).padStart(2,'0')}` }
export const daysBetween = (a: string,b: string) => Math.round((Date.parse(`${b}T12:00:00`)-Date.parse(`${a}T12:00:00`))/86400000)
export type ForecastInput = { transactions: TransactionRecord[]; settings: ForecastSettings | null; upcoming: UpcomingExpense[]; today?: string }
export function hasRecordedMatch(u: UpcomingExpense, transactions: TransactionRecord[]) {
  return transactions.some(t => t.type==='expense' && t.category===u.category && t.amountPaise===u.amountPaise && t.date>=addDateDays(u.date,-2) && t.date<=addDateDays(u.date,7) && t.createdAt>=u.createdAt)
}
export function calculateForecast({transactions,settings,upcoming,today=todayLocal()}: ForecastInput) {
  const balance = recordedBalance(transactions)
  const historyStart = addDateDays(today,-29)
  const history = transactions.filter((t): t is Extract<TransactionRecord,{type:'expense'}> => t.type==='expense' && t.date>=historyStart && t.date<=today)
  const spending = history.reduce((n,e)=>n+e.amountPaise,0), spendingDays = new Set(history.map(e=>e.date)).size
  const averageDailyPaise = spendingDays >= 3 ? Math.round(spending/30) : null // 30 calendar days, including zero-spend days
  const allowanceDays = settings?.nextAllowanceDate ? Math.max(0,daysBetween(today,settings.nextAllowanceDate)) : null
  const days = settings ? settings.period==='until-allowance' ? allowanceDays : Number(settings.period) : null
  const endDate = days === null ? null : addDateDays(today,days)
  const allowance = settings?.nextAllowanceDate && endDate && settings.nextAllowanceDate>today && settings.nextAllowanceDate<=endDate ? settings.expectedAmountPaise ?? 0 : 0
  const planned = endDate ? upcoming.filter(u=>u.date>today&&u.date<=endDate) : []
  // Match a plan only to a recorded expense with the same category and amount near its expected date.
  const unmatchedPlans = planned.filter(u=>!hasRecordedMatch(u,transactions))
  const plannedTotal = unmatchedPlans.reduce((n,u)=>n+u.amountPaise,0)
  const estimatedSpending = averageDailyPaise !== null && days !== null ? averageDailyPaise*days : null
  const predictedBalance = estimatedSpending !== null ? balance+allowance-estimatedSpending-plannedTotal : null
  const points = predictedBalance === null || days === null ? [] : Array.from({length:days+1},(_,i)=>{
    const date=addDateDays(today,i)
    const income=i>0&&settings?.nextAllowanceDate===date ? settings.expectedAmountPaise ?? 0 : 0
    const dayPlans=unmatchedPlans.filter(p=>p.date===date).reduce((n,p)=>n+p.amountPaise,0)
    return {date, balance:balance+(averageDailyPaise??0)*-i+unmatchedPlans.filter(p=>p.date<=date).reduce((n,p)=>n-p.amountPaise,0)+(settings?.nextAllowanceDate&&settings.nextAllowanceDate>today&&settings.nextAllowanceDate<=date?settings.expectedAmountPaise??0:0), isCurrent:i===0, income, expenses:dayPlans}
  })
  return {balance,historyStart,historyDays:30,spendingDays,averageDailyPaise,allowanceDays,days,endDate,expectedIncomePaise:allowance,plannedExpenses:unmatchedPlans,plannedExpensesPaise:plannedTotal,estimatedSpendingPaise:estimatedSpending,predictedBalancePaise:predictedBalance,points,hasHistory:averageDailyPaise!==null}
}
