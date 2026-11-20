import { useEffect, useRef, useState, type FormEvent, type ReactNode } from 'react'
import { ArrowUpRight, BarChart3, CalendarDays, ChartNoAxesCombined, PiggyBank, Rocket, Send, ShoppingBag, Sparkles, TrendingUp, Wallet } from 'lucide-react'
import type { TransactionRecord } from '../expenses/expenseStore'
import { calculateForecast, type ForecastSettings, type UpcomingExpense } from '../forecast/forecastStore'
import { COACH_SAMPLE_ANSWERS, COACH_SUGGESTIONS, type CoachSuggestionId } from './coachSamples'
import type { CoachMessage } from './coachContract'
import './coach.css'

const money=(paise:number)=>new Intl.NumberFormat('en-IN',{style:'currency',currency:'INR',maximumFractionDigits:paise%100?2:0}).format(paise/100)
const clock=()=>new Intl.DateTimeFormat('en-IN',{hour:'numeric',minute:'2-digit'}).format(new Date())
type DisplayMessage=CoachMessage&{sample?:boolean}
type Props={transactions:TransactionRecord[];settings:ForecastSettings|null;upcoming:UpcomingExpense[];displayName?:string}

export default function CoachPage({transactions,settings,upcoming,displayName}:Props){
 const initial:DisplayMessage[]=[
  {id:'sample-user',role:'user',content:'Where am I spending most of my money?',createdAt:clock(),sample:true},
  {id:'sample-coach',role:'assistant',content:'Sample preview only: a connected coach could summarize your expense categories using your saved records. This demo does not analyze your transactions.',createdAt:clock(),sample:true},
 ]
 const [messages,setMessages]=useState<DisplayMessage[]>(initial),[input,setInput]=useState(''),[notice,setNotice]=useState('')
 const listRef=useRef<HTMLDivElement>(null)
 const snapshot=calculateForecast({transactions,settings,upcoming})
 const balance=money(snapshot.balance)
 const average=snapshot.averageDailyPaise===null?'Not enough history':money(snapshot.averageDailyPaise)
 const allowance=settings?.nextAllowanceDate?`${snapshot.allowanceDays===0?'Today':`In ${snapshot.allowanceDays} days`}`:'Not configured'
 const allowanceDate=settings?.nextAllowanceDate?new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'}).format(new Date(`${settings.nextAllowanceDate}T12:00:00`)):''
 const predicted=snapshot.predictedBalancePaise===null?'Estimate unavailable':money(snapshot.predictedBalancePaise)
 useEffect(()=>{if(listRef.current)listRef.current.scrollTop=listRef.current.scrollHeight},[messages,notice])
 const loadSample=(id:CoachSuggestionId,label:string)=>{
   const now=clock()
   setMessages([{id:`sample-q-${Date.now()}`,role:'user',content:label,createdAt:now,sample:true},{id:`sample-a-${Date.now()}`,role:'assistant',content:COACH_SAMPLE_ANSWERS[id],createdAt:now,sample:true}])
   setNotice('Sample conversation · illustrative demo content, not a live AI response.')
 }
 const send=(event:FormEvent)=>{
   event.preventDefault();const content=input.trim();if(!content)return
   setMessages(current=>[...current,{id:`local-${Date.now()}`,role:'user',content,createdAt:clock()}])
   setInput('')
   setNotice('Demo mode is active. Your message stays in this page and was not sent to an AI provider. No AI response was generated.')
 }
 return <div className="coach-page" data-mode="demo">
   <div className="coach-page-heading"><div><p>Your personal finance assistant for smarter money decisions.</p></div><span className="coach-coming-badge">Coming Soon</span></div>
   <div className="coach-layout">
    <section className="coach-chat panel">
     <div className="coach-welcome"><div className="coach-welcome-copy"><h2>👋 Hi, I'm PocketWise AI!</h2><p>I'll help you understand your spending, plan better, save more, and make smarter money decisions.</p><span className="coach-preview-tag"><span/> Design Preview <i>•</i> Not a live AI yet</span></div><RobotIllustration/></div>
     <div className="coach-suggestions"><h3>Try asking me something like:</h3><div className="coach-suggestion-grid">{COACH_SUGGESTIONS.map(item=><button key={item.id} className="coach-suggestion" onClick={()=>loadSample(item.id,item.label)}><span className={`coach-suggestion-icon ${item.icon}`}>{item.icon==='spending'?<BarChart3 size={18}/>:item.icon==='saving'?<PiggyBank size={18}/>:item.icon==='purchase'?<CalendarDays size={18}/>:<TrendingUp size={18}/>}</span><b>{item.label}</b><ArrowUpRight size={14}/></button>)}</div></div>
     <div className="coach-sample-label"><span/> Sample conversation <small>Demo content · no AI call</small></div>
     <div className="coach-messages" ref={listRef} aria-live="polite">{messages.map(message=><div key={message.id} className={`coach-message-row ${message.role==='user'?'user':'assistant'}`}><span className={`coach-avatar ${message.role}`}>{message.role==='assistant'?<RobotFace/>:(displayName?.trim()?.[0]?.toUpperCase()||'S')}</span><div className="coach-message-wrap"><div className={`coach-bubble ${message.role}`}>{message.content}</div><time>{message.createdAt}</time></div></div>)}{notice&&<div className="coach-demo-notice"><Sparkles size={15}/><span>{notice}</span></div>}</div>
     <form className="coach-composer" onSubmit={send}><input aria-label="Ask PocketWise AI" placeholder="Ask me anything about your money…" value={input} onChange={e=>setInput(e.target.value)} maxLength={1000}/><button type="submit" aria-label="Send message" disabled={!input.trim()}><Send size={18}/></button></form>
     <div className="coach-local-note">Demo mode only · Your messages are not sent to an AI provider.</div>
    </section>
    <aside className="coach-aside">
     <section className="panel coach-snapshot"><header className="coach-section-title"><span className="coach-round-icon mint"><ChartNoAxesCombined size={20}/></span><div><h2>Your Financial Snapshot</h2><p>A quick look at your current financial position.</p></div></header><div className="coach-snapshot-grid">
       <Snapshot icon={<Wallet size={20}/>} tone="mint" label="Available Balance" value={balance} hint="Recorded balance"/>
       <Snapshot icon={<CircleCoin/>} tone="amber" label="Avg. Daily Spending" value={average} hint={snapshot.hasHistory?'Last 30 days':'Not enough spending history yet'}/>
       <Snapshot icon={<CalendarDays size={20}/>} tone="blue" label="Next Allowance" value={allowance} hint={allowanceDate||'Set in Money Forecast settings'}/>
       <Snapshot icon={<TrendingUp size={20}/>} tone="mint" label="Predicted Balance" value={predicted} hint={snapshot.endDate?`Estimate · ${new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'}).format(new Date(`${snapshot.endDate}T12:00:00`))}`:'Forecast unavailable'}/>
     </div><p className="coach-snapshot-disclaimer">Balance comes from recorded transactions and is not a verified bank balance. Estimates are not guarantees.</p></section>
     <section className="panel coach-capabilities"><header className="coach-section-title"><span className="coach-spark"><Sparkles size={20}/></span><div><h2>What I Can Help You With</h2></div></header><div className="coach-capability-list">
       <Capability icon={<BarChart3/>} tone="mint" title="Spending Analysis" text="Understand your spending patterns."/><Capability icon={<PiggyBank/>} tone="purple" title="Saving Suggestions" text="Practical ways to save more money."/><Capability icon={<ShoppingBag/>} tone="amber" title="Purchase Guidance" text="Check if a planned purchase fits your current plan."/><Capability icon={<TrendingUp/>} tone="blue" title="Forecast Explanation" text="Get a simple view of your money forecast."/>
     </div><p className="coach-capability-note">Planned capabilities · Not active in this demo</p></section>
     <section className="coach-launch-card"><div className="coach-launch-icon"><Rocket size={25}/></div><div><h2>Full AI Experience Coming Soon!</h2><p>We're working on a smarter, more personalized AI coach with real-time insights and recommendations.</p></div></section>
    </aside>
   </div>
 </div>
}

function Snapshot({icon,tone,label,value,hint}:{icon:ReactNode;tone:string;label:string;value:string;hint:string}){return <article className="coach-snapshot-item"><span className={`coach-metric-icon ${tone}`}>{icon}</span><div><small>{label}</small><b>{value}</b><span>{hint}</span></div></article>}
function Capability({icon,tone,title,text}:{icon:ReactNode;tone:string;title:string;text:string}){return <article className="coach-capability"><span className={`coach-capability-icon ${tone}`}>{icon}</span><div><b>{title}</b><span>{text}</span></div></article>}
function RobotFace(){return <svg viewBox="0 0 28 28" aria-hidden="true"><rect x="4" y="6" width="20" height="16" rx="6" fill="#12213d"/><circle cx="10" cy="14" r="1.6" fill="#8ef0d1"/><circle cx="18" cy="14" r="1.6" fill="#8ef0d1"/><path d="M10 18q4 3 8 0" fill="none" stroke="#8ef0d1" strokeWidth="1.4" strokeLinecap="round"/></svg>}
function RobotIllustration(){return <div className="coach-robot" aria-hidden="true"><svg viewBox="0 0 190 170"><path d="M95 32V20" stroke="#12213d" strokeWidth="5" strokeLinecap="round"/><circle cx="95" cy="15" r="7" fill="#16a085" stroke="#12213d" strokeWidth="3"/><path d="M54 69c0-27 18-44 42-44h1c25 0 43 17 43 44v49c0 13-10 23-23 23H77c-13 0-23-10-23-23V69Z" fill="#fff" stroke="#14213d" strokeWidth="5"/><rect x="66" y="54" width="63" height="51" rx="19" fill="#10203b"/><circle cx="86" cy="77" r="5" fill="#9ef1d8"/><circle cx="109" cy="77" r="5" fill="#9ef1d8"/><path d="M84 89q13 13 27 0" fill="none" stroke="#9ef1d8" strokeWidth="4" strokeLinecap="round"/><path d="M53 71c-12 0-19 10-19 25s7 24 19 24M141 71c12 0 19 10 19 25s-7 24-19 24" fill="#75dfc5" stroke="#14213d" strokeWidth="4"/><path d="M74 140v17m43-17v17M80 157h-14m57 0h-14" stroke="#14213d" strokeWidth="5" strokeLinecap="round"/><path d="m24 45-8-11m19 6 1-14m7 37 12-6" stroke="#16a085" strokeWidth="4" strokeLinecap="round"/><path d="m163 45 8-11m-19 6-1-14m-7 37-12-6" stroke="#16a085" strokeWidth="4" strokeLinecap="round"/></svg></div>}
function CircleCoin(){return <span className="coach-coins">₹</span>}
