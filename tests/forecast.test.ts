import assert from 'node:assert/strict'
import test from 'node:test'
import { calculateForecast, deleteUpcomingExpense, loadForecastSettings, loadUpcomingExpenses, saveForecastSettings, saveUpcomingExpense, validateSettings, type ForecastSettings, type UpcomingExpense } from '../src/forecast/forecastStore.ts'
import type { TransactionRecord } from '../src/expenses/expenseStore.ts'
class MemoryStorage { values=new Map<string,string>(); getItem(k:string){return this.values.get(k)??null};setItem(k:string,v:string){this.values.set(k,v)} }
const tx=(id:string,type:'income'|'expense',paise:number,date:string,createdAt=`${date}T12:00:00.000Z`,category='Food & Dining'):TransactionRecord=>type==='income'?{id,type,amountPaise:paise,source:'Pocket Money',date,paymentMethod:'',note:'',createdAt}:{id,type,amountPaise:paise,category:category as 'Food & Dining',date,paymentMethod:'UPI',note:'',createdAt}
test('forecast preferences validate, save and reload without adding income transactions',()=>{
 const storage=new MemoryStorage();assert.ok(validateSettings({nextAllowanceDate:'',expectedAmount:'',period:'until-allowance'},'2026-10-31').nextAllowanceDate)
 const saved=saveForecastSettings({nextAllowanceDate:'2026-11-05',expectedAmount:'5000',period:'until-allowance'},storage,'2026-11-04')
 assert.equal(loadForecastSettings(storage)?.expectedAmountPaise,500000);assert.equal(saved.period,'until-allowance');assert.equal(storage.getItem('pocketwise.transactions.v1'),null)
})
test('forecast reconciles recorded balance, allowance, thirty-day average and upcoming costs',()=>{
 const settings:ForecastSettings={nextAllowanceDate:'2026-11-05',expectedAmountPaise:500000,period:'7'}
 const upcoming:UpcomingExpense[]=[{id:'u1',name:'Fees',amountPaise:50000,date:'2026-11-03',category:'Education',note:'',createdAt:'2026-10-25T00:00:00.000Z'},{id:'u2',name:'Recharge',amountPaise:100000,date:'2026-11-06',category:'Bills & Utilities',note:'',createdAt:'2026-10-25T00:00:00.000Z'}]
 const transactions=[tx('i','income',1000000,'2026-10-01'),tx('e1','expense',10000,'2026-10-31'),tx('e2','expense',20000,'2026-10-20'),tx('e3','expense',30000,'2026-10-10'),tx('future','expense',99000,'2026-11-02')]
 const f=calculateForecast({transactions,settings,upcoming,today:'2026-10-31'})
 assert.equal(f.balance,841000);assert.equal(f.averageDailyPaise,2000);assert.equal(f.estimatedSpendingPaise,14000);assert.equal(f.expectedIncomePaise,500000);assert.equal(f.plannedExpensesPaise,150000);assert.equal(f.predictedBalancePaise,1177000)
 assert.equal(f.points[0].balance,f.balance);assert.equal(f.points.at(-1)?.balance,f.predictedBalancePaise);assert.equal(f.points.length,8)
})
test('future expenses do not affect historical average and matching actual expenses are not counted again',()=>{
 const planned:UpcomingExpense={id:'p',name:'Fees',amountPaise:50000,date:'2026-11-03',category:'Education',note:'',createdAt:'2026-10-25T00:00:00.000Z'}
 const txs=[tx('a','income',1000000,'2026-10-01'),tx('x','expense',10000,'2026-10-31'),tx('y','expense',20000,'2026-10-20'),tx('z','expense',30000,'2026-10-10'),tx('paid','expense',50000,'2026-11-03','2026-10-30T00:00:00.000Z','Education')]
 const f=calculateForecast({transactions:txs,settings:{nextAllowanceDate:'',expectedAmountPaise:null,period:'7'},upcoming:[planned],today:'2026-10-31'})
 assert.equal(f.averageDailyPaise,2000);assert.equal(f.plannedExpensesPaise,0);assert.equal(f.predictedBalancePaise,876000)
})
test('insufficient history withholds predicted balance; upcoming expenses persist and delete independently',()=>{
 const storage=new MemoryStorage();const plan=saveUpcomingExpense({name:'Books',amount:'250',date:'2026-11-05',category:'Education',note:''},storage,undefined,'2026-11-04')
 assert.equal(loadUpcomingExpenses(storage)[0].id,plan.id)
 const edited=saveUpcomingExpense({name:'Books',amount:'300',date:'2026-11-06',category:'Education',note:'Updated'},storage,plan.id,'2026-11-04')
 assert.equal(edited.id,plan.id);assert.equal(loadUpcomingExpenses(storage).length,1)
 const f=calculateForecast({transactions:[tx('i','income',500000,'2026-10-01'),tx('e','expense',10000,'2026-10-30')],settings:{nextAllowanceDate:'',expectedAmountPaise:null,period:'7'},upcoming:[plan],today:'2026-10-31'})
 assert.equal(f.hasHistory,false);assert.equal(f.predictedBalancePaise,null);assert.equal(f.points.length,0)
 deleteUpcomingExpense(plan.id,storage);assert.equal(loadUpcomingExpenses(storage).length,0);assert.equal(storage.getItem('pocketwise.transactions.v1'),null)
})
