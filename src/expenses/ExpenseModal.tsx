import { useEffect, useRef, useState, type FormEvent } from 'react'
import { CalendarDays, Check, ChevronDown, CircleDollarSign, CreditCard, FileText, Utensils, X } from 'lucide-react'
import { EXPENSE_CATEGORIES, PAYMENT_METHODS, todayLocal, validateExpense, type ExpenseDraft } from './expenseStore'
import './expense.css'

type Props = { onClose: () => void; onSave: (draft: ExpenseDraft) => void }

export default function ExpenseModal({ onClose, onSave }: Props) {
  const [amount, setAmount] = useState('')
  const [category, setCategory] = useState('')
  const [date, setDate] = useState(todayLocal)
  const [paymentMethod, setPaymentMethod] = useState('UPI')
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof ExpenseDraft, string>>>({})
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
    const draft = { amount, category, date, paymentMethod, note }
    const validation = validateExpense(draft)
    setErrors(validation)
    setSaveError('')
    if (Object.keys(validation).length) return
    submitted.current = true
    setSaving(true)
    try { onSave(draft) }
    catch (error) { setSaveError(error instanceof Error ? error.message : 'Could not save this expense.'); submitted.current = false }
    finally { setSaving(false) }
  }

  return <div className="expense-backdrop" role="presentation" onMouseDown={event => { if (event.target === event.currentTarget && !saving) onClose() }}>
    <section className="expense-dialog" role="dialog" aria-modal="true" aria-labelledby="expense-title">
      <header className="expense-dialog-head"><div><h2 id="expense-title">Add Expense</h2><p>Record your expense to keep track of your spending.</p></div><button type="button" className="expense-close" onClick={onClose} aria-label="Close expense form"><X size={19} /></button></header>
      <form className="expense-form" onSubmit={submit} noValidate>
        <div className="expense-field"><label htmlFor="expense-amount">Amount <b>*</b></label><div className={`expense-input amount-input ${errors.amount ? 'has-error' : ''}`}><span className="input-leading"><CircleDollarSign size={16} /></span><span className="rupee-symbol">₹</span><input id="expense-amount" type="text" inputMode="decimal" autoComplete="off" placeholder="0.00" value={amount} onChange={e => setAmount(e.target.value)} aria-invalid={!!errors.amount} aria-describedby={errors.amount ? 'expense-amount-error' : undefined} /></div>{errors.amount && <small className="expense-error" id="expense-amount-error">{errors.amount}</small>}</div>
        <div className="expense-field"><label htmlFor="expense-category">Category <b>*</b></label><div className={`select-wrap ${errors.category ? 'has-error' : ''}`}><span className="select-icon"><Utensils size={16} /></span><select id="expense-category" value={category} onChange={e => setCategory(e.target.value)} aria-invalid={!!errors.category} aria-describedby={errors.category ? 'expense-category-error' : undefined}><option value="">Choose a category</option>{EXPENSE_CATEGORIES.map(item => <option key={item} value={item}>{item}</option>)}</select><ChevronDown size={15} /></div>{errors.category && <small className="expense-error" id="expense-category-error">{errors.category}</small>}</div>
        <div className="expense-field"><label htmlFor="expense-date">Expense Date <b>*</b></label><div className={`expense-input ${errors.date ? 'has-error' : ''}`}><CalendarDays size={16} className="input-leading" /><input id="expense-date" type="date" value={date} onChange={e => setDate(e.target.value)} aria-invalid={!!errors.date} aria-describedby={errors.date ? 'expense-date-error' : undefined} /></div>{errors.date && <small className="expense-error" id="expense-date-error">{errors.date}</small>}</div>
        <div className="expense-field"><label htmlFor="expense-payment">Payment Method</label><div className="select-wrap"><span className="select-icon payment-icon"><CreditCard size={16} /></span><select id="expense-payment" value={paymentMethod} onChange={e => setPaymentMethod(e.target.value)}>{PAYMENT_METHODS.map(item => <option key={item}>{item}</option>)}</select><ChevronDown size={15} /></div></div>
        <div className="expense-field"><label htmlFor="expense-note">Note <span>(Optional)</span></label><div className={`expense-input note-input ${errors.note ? 'has-error' : ''}`}><FileText size={16} className="input-leading" /><input id="expense-note" type="text" maxLength={100} placeholder="What was this expense for?" value={note} onChange={e => setNote(e.target.value)} aria-invalid={!!errors.note} aria-describedby={errors.note ? 'expense-note-error' : undefined} /><small className="note-count">{note.length}/100</small></div>{errors.note && <small className="expense-error" id="expense-note-error">{errors.note}</small>}</div>
        {saveError && <div className="expense-save-error" role="alert">{saveError}</div>}
        <footer className="expense-actions"><button type="button" className="expense-cancel" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="expense-save" disabled={saving}>{saving ? 'Saving…' : <><Check size={16} />Save Expense</>}</button></footer>
      </form>
    </section>
  </div>
}
