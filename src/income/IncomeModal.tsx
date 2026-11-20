import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CalendarDays, Check, ChevronDown, CreditCard, FileText, Gift, X } from 'lucide-react'
import { INCOME_PAYMENT_METHODS, INCOME_SOURCES, todayLocal, validateIncome, type IncomeDraft } from '../expenses/expenseStore'
import '../expenses/expense.css'

type Props = { onClose: () => void; onSave: (draft: IncomeDraft) => void }

export default function IncomeModal({ onClose, onSave }: Props) {
  const [amount, setAmount] = useState('')
  const [source, setSource] = useState('')
  const [date, setDate] = useState(todayLocal)
  const [paymentMethod, setPaymentMethod] = useState('')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof IncomeDraft, string>>>({})
  const [saveError, setSaveError] = useState('')
  const [saving, setSaving] = useState(false)
  const submitted = useRef(false)

  useEffect(() => {
    const closeOnEscape = (event: KeyboardEvent) => { if (event.key === 'Escape' && !saving) onClose() }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [onClose, saving])

  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (submitted.current) return
    const draft = { amount, source, date, paymentMethod, note }
    const validation = validateIncome(draft)
    setErrors(validation)
    setSaveError('')
    if (Object.keys(validation).length) return
    submitted.current = true
    setSaving(true)
    try { onSave(draft) }
    catch (error) { setSaveError(error instanceof Error ? error.message : 'Could not save this income.'); submitted.current = false }
    finally { setSaving(false) }
  }

  return <div className="expense-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <section className="expense-dialog" role="dialog" aria-modal="true" aria-labelledby="income-title">
      <header className="expense-dialog-head"><div><h2 id="income-title">Add Income</h2><p>Record your income to keep track of your money.</p></div><button type="button" className="expense-close" onClick={onClose} aria-label="Close income form"><X size={19} /></button></header>
      <form className="expense-form" onSubmit={submit} noValidate>
        <div className="expense-field"><label htmlFor="income-amount">Amount <b>*</b></label><div className={`expense-input amount-input ${errors.amount ? 'has-error' : ''}`}><span className="rupee-symbol">₹</span><input id="income-amount" type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'income-amount-error' : undefined} /></div>{errors.amount && <small className="expense-error" id="income-amount-error">{errors.amount}</small>}</div>
        <div className="expense-field"><label htmlFor="income-source">Income Source <b>*</b></label><div className={`select-wrap ${errors.source ? 'has-error' : ''}`}><span className="select-icon"><Gift size={16} /></span><select id="income-source" value={source} onChange={e => setSource(e.target.value)} aria-invalid={!!errors.source} aria-describedby={errors.source ? 'income-source-error' : undefined}><option value="">Choose a source</option>{INCOME_SOURCES.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div>{errors.source && <small className="expense-error" id="income-source-error">{errors.source}</small>}</div>
        <div className="expense-field"><label htmlFor="income-date">Date <b>*</b></label><div className={`expense-input ${errors.date ? 'has-error' : ''}`}><CalendarDays size={16} className="input-leading" /><input id="income-date" type="date" value={date} onChange={e => setDate(e.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'income-date-error' : undefined} /></div>{errors.date && <small className="expense-error" id="income-date-error">{errors.date}</small>}</div>
        <div className="expense-field"><label htmlFor="income-payment">Payment Method <span>(Optional)</span></label><div className="select-wrap"><span className="select-icon payment-icon"><CreditCard size={16} /></span><select id="income-payment" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}><option value="">Not specified</option>{INCOME_PAYMENT_METHODS.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div></div>
        <div className="expense-field"><label htmlFor="income-note">Note <span>(Optional)</span></label><div className="expense-input note-input"><FileText size={16} className="input-leading" /><input id="income-note" type="text" maxLength={100} placeholder="e.g. Monthly allowance from parents" value={note} onChange={e => setNote(e.target.value)} /><small className="note-count">{note.length}/100</small></div></div>
        {saveError && <div className="expense-save-error" role="alert">{saveError}</div>}
        <footer className="expense-actions"><button type="button" className="expense-cancel" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="expense-save" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} />Save Income</>}</button></footer>
      </form>
    </section>
  </div>
}
