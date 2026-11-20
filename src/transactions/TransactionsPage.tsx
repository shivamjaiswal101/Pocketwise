import { useMemo, useState, type FormEvent } from 'react'
import { ArrowDownLeft, ArrowUpRight, CalendarDays, Check, ChevronDown, Eye, FileText, Pencil, Plus, Search, ShieldCheck, Trash2, Wallet, X } from 'lucide-react'
import { EXPENSE_CATEGORIES, INCOME_PAYMENT_METHODS, INCOME_SOURCES, PAYMENT_METHODS, type ExpenseDraft, type IncomeDraft, type TransactionDraft, type TransactionRecord, validateExpense, validateIncome } from '../expenses/expenseStore'
import type { ReactNode } from 'react'
import './transactions.css'

type Props = { transactions: TransactionRecord[]; onAdd: (type: 'income' | 'expense') => void; onUpdate: (id: string, draft: TransactionDraft) => void; onDelete: (id: string) => void }
type Range = 'this-month' | 'last-month' | 'all-time' | 'custom'

export default function TransactionsPage({ transactions, onAdd, onUpdate, onDelete }: Props) {
  const [search, setSearch] = useState('')
  const [type, setType] = useState('all')
  const [category, setCategory] = useState('all')
  const [payment, setPayment] = useState('all')
  const [range, setRange] = useState<Range>('this-month')
  const [startDate, setStartDate] = useState('')
  const [endDate, setEndDate] = useState('')
  const [selected, setSelected] = useState<TransactionRecord | null>(null)
  const [editing, setEditing] = useState<TransactionRecord | null>(null)
  const [deleting, setDeleting] = useState<TransactionRecord | null>(null)
  const [message, setMessage] = useState('')
  const [error, setError] = useState('')
  const [menuOpen, setMenuOpen] = useState(false)

  const boundaries = useMemo(() => {
    const now = new Date()
    const currentStart = `${now.getFullYear()}-${pad(now.getMonth() + 1)}-01`
    const currentEnd = toDate(new Date(now.getFullYear(), now.getMonth() + 1, 0))
    const lastStartDate = new Date(now.getFullYear(), now.getMonth() - 1, 1)
    const lastEndDate = new Date(now.getFullYear(), now.getMonth(), 0)
    return { currentStart, currentEnd, lastStart: toDate(lastStartDate), lastEnd: toDate(lastEndDate) }
  }, [])

  const inRange = (item: TransactionRecord) => {
    if (range === 'this-month') return item.date >= boundaries.currentStart && item.date <= boundaries.currentEnd
    if (range === 'last-month') return item.date >= boundaries.lastStart && item.date <= boundaries.lastEnd
    if (range === 'custom') return (!startDate || item.date >= startDate) && (!endDate || item.date <= endDate)
    return true
  }
  const ranged = transactions.filter(inRange)
  const totalIncome = ranged.reduce((sum, item) => sum + (item.type === 'income' ? item.amountPaise : 0), 0)
  const totalExpenses = ranged.reduce((sum, item) => sum + (item.type === 'expense' ? item.amountPaise : 0), 0)
  const filtered = [...ranged].filter(item => {
    const text = `${item.note} ${item.type === 'income' ? item.source : item.category} ${item.type}`.toLowerCase()
    return (!search.trim() || text.includes(search.trim().toLowerCase())) && (type === 'all' || item.type === type) && (category === 'all' || (item.type === 'income' ? item.source : item.category) === category) && (payment === 'all' || item.paymentMethod === payment)
  }).sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  const clearFilters = () => { setSearch(''); setType('all'); setCategory('all'); setPayment('all'); setRange('this-month'); setStartDate(''); setEndDate('') }
  const saveEdit = (draft: TransactionDraft) => {
    if (!editing) return
    try { onUpdate(editing.id, draft); setEditing(null); setMessage('Transaction updated successfully.'); setError('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not update this transaction.'); throw reason }
  }
  const confirmDelete = () => {
    if (!deleting) return
    try { onDelete(deleting.id); setDeleting(null); setSelected(null); setMessage('Transaction deleted successfully.'); setError('') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete this transaction.') }
  }
  const hasFilters = !!search || type !== 'all' || category !== 'all' || payment !== 'all' || range !== 'this-month' || !!startDate || !!endDate

  return <div className="transactions-page">
    <div className="transactions-title-row"><div className="transactions-title-actions">
      <label className="range-control"><CalendarDays size={15} /><select aria-label="Date range" value={range} onChange={e => setRange(e.target.value as Range)}><option value="this-month">This Month</option><option value="last-month">Last Month</option><option value="all-time">All Time</option><option value="custom">Custom Range</option></select><ChevronDown size={14} /></label>
      <div className="add-transaction-wrap"><button className="button button-primary" onClick={() => setMenuOpen(!menuOpen)}><Plus size={16} /> Add Transaction <ChevronDown size={14} /></button>{menuOpen && <div className="add-transaction-menu"><button onClick={() => { setMenuOpen(false); onAdd('expense') }}><span className="tx-menu-expense"><ArrowUpRight size={15} /></span>Add Expense</button><button onClick={() => { setMenuOpen(false); onAdd('income') }}><span className="tx-menu-income"><ArrowDownLeft size={15} /></span>Add Income</button></div>}</div>
    </div></div>

    <div className="transaction-summary">
      <Summary icon={<ArrowDownLeft size={21} />} tone="income" label="Total Income" amount={totalIncome} count={ranged.filter(x => x.type === 'income').length} kind="income records" />
      <Summary icon={<ArrowUpRight size={21} />} tone="expense" label="Total Expenses" amount={totalExpenses} count={ranged.filter(x => x.type === 'expense').length} kind="expense records" />
      <Summary icon={<Wallet size={21} />} tone="balance" label="Recorded Balance" amount={totalIncome - totalExpenses} detail={`${range === 'all-time' ? 'All-time' : 'Selected range'} income − expenses`} />
    </div>
    <div className="transaction-disclaimer"><ShieldCheck size={14} />Totals are based on saved PocketWise records and are not verified bank balances.</div>

    <section className="transaction-table-panel">
      <div className="transaction-filters">
        <label className="transaction-search"><Search size={16} /><input value={search} onChange={e => setSearch(e.target.value)} placeholder="Search transactions..." aria-label="Search transactions" /></label>
        <select aria-label="Transaction type" value={type} onChange={e => setType(e.target.value)}><option value="all">All Types</option><option value="income">Income</option><option value="expense">Expense</option></select>
        <select aria-label="Category or source" value={category} onChange={e => setCategory(e.target.value)}><option value="all">All Categories</option>{[...EXPENSE_CATEGORIES, ...INCOME_SOURCES].filter((value, index, all) => all.indexOf(value) === index).map(value => <option key={value}>{value}</option>)}</select>
        <select aria-label="Payment method" value={payment} onChange={e => setPayment(e.target.value)}><option value="all">All Payment Methods</option>{[...PAYMENT_METHODS, ...INCOME_PAYMENT_METHODS].filter((value, index, all) => all.indexOf(value) === index).map(value => <option key={value}>{value}</option>)}</select>
        {range === 'custom' && <div className="custom-date-filters"><label>From <input type="date" value={startDate} onChange={e => setStartDate(e.target.value)} /></label><label>To <input type="date" value={endDate} onChange={e => setEndDate(e.target.value)} /></label></div>}
        <button className="clear-filter-button" onClick={clearFilters}>Clear Filters</button>
      </div>
      {error && <p className="transaction-error" role="alert">{error}</p>}
      {message && <p className="transaction-success" role="status"><Check size={15} />{message}<button onClick={() => setMessage('')} aria-label="Dismiss message"><X size={14} /></button></p>}
      {filtered.length === 0 ? <div className="transaction-page-empty"><div className="transaction-empty-icon"><FileText size={25} /></div><h3>{transactions.length === 0 && !hasFilters ? 'No transactions yet' : 'No transactions match your filters.'}</h3><p>{transactions.length === 0 && !hasFilters ? 'Start tracking your money by adding your first income or expense.' : 'Try adjusting your search or filters to find what you are looking for.'}</p>{transactions.length === 0 && !hasFilters ? <div><button className="button button-primary" onClick={() => onAdd('expense')}><Plus size={15} /> Add Your First Expense</button><button className="button button-outline" onClick={() => onAdd('income')}><ArrowDownLeft size={15} /> Add Income</button></div> : <button className="button button-outline" onClick={clearFilters}>Clear Filters</button>}</div> : <>
        <div className="transaction-table-scroll"><table className="transaction-table"><thead><tr><th>Type</th><th>Description</th><th>Category / Source</th><th>Date</th><th>Payment Method</th><th className="amount-column">Amount</th><th>Actions</th></tr></thead><tbody>{filtered.map(item => <tr key={item.id}><td><TypeBadge item={item} /></td><td className="description-cell">{item.note || (item.type === 'income' ? item.source : item.category)}</td><td>{item.type === 'income' ? item.source : item.category}</td><td>{formatDate(item.date)}</td><td>{item.paymentMethod || '—'}</td><td className={`amount-column ${item.type}`}>{item.type === 'income' ? '+' : '−'}{formatRupees(item.amountPaise)}</td><td><div className="transaction-row-actions"><button aria-label={`View ${item.note || 'transaction'}`} onClick={() => setSelected(item)}><Eye size={15} /></button><button aria-label={`Edit ${item.note || 'transaction'}`} onClick={() => { setEditing(item); setError(''); setMessage('') }}><Pencil size={14} /></button><button className="delete-action" aria-label={`Delete ${item.note || 'transaction'}`} onClick={() => { setDeleting(item); setError(''); setMessage('') }}><Trash2 size={14} /></button></div></td></tr>)}</tbody></table></div>
        <div className="transaction-mobile-list">{filtered.map(item => <article className="transaction-mobile-card" key={item.id}><div className="transaction-mobile-top"><TypeBadge item={item} /><span className={`amount-column ${item.type}`}>{item.type === 'income' ? '+' : '−'}{formatRupees(item.amountPaise)}</span></div><strong>{item.note || (item.type === 'income' ? item.source : item.category)}</strong><div className="transaction-mobile-meta"><span>{item.type === 'income' ? item.source : item.category}</span><span>{formatDate(item.date)}</span></div><div className="transaction-mobile-bottom"><span>{item.paymentMethod || 'Payment not specified'}</span><div className="transaction-row-actions"><button aria-label="View details" onClick={() => setSelected(item)}><Eye size={15} /></button><button aria-label="Edit transaction" onClick={() => setEditing(item)}><Pencil size={14} /></button><button className="delete-action" aria-label="Delete transaction" onClick={() => setDeleting(item)}><Trash2 size={14} /></button></div></div></article>)}</div>
        <div className="transaction-results-count">Showing {filtered.length} of {transactions.length} transactions</div>
      </>}
    </section>

    {selected && <DetailsDialog item={selected} onClose={() => setSelected(null)} />}
    {editing && <EditDialog item={editing} onClose={() => setEditing(null)} onSave={saveEdit} />}
    {deleting && <div className="transaction-modal-backdrop"><section className="transaction-modal delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-heading"><button className="transaction-modal-close" onClick={() => setDeleting(null)} aria-label="Close confirmation"><X size={17} /></button><div className="delete-icon"><Trash2 size={20} /></div><h2 id="delete-heading">Delete Transaction?</h2><p>Are you sure you want to delete this transaction? This action cannot be undone.</p><div className="delete-preview"><TypeBadge item={deleting} /><strong>{deleting.note || (deleting.type === 'income' ? deleting.source : deleting.category)}</strong><b className={`amount-column ${deleting.type}`}>{deleting.type === 'income' ? '+' : '−'}{formatRupees(deleting.amountPaise)}</b></div><div className="delete-warning">This action cannot be undone.</div>{error && <p className="transaction-error" role="alert">{error}</p>}<footer><button className="expense-cancel" onClick={() => setDeleting(null)}>Cancel</button><button className="confirm-delete-button" onClick={confirmDelete}>Delete</button></footer></section></div>}
  </div>
}

function Summary({ icon, tone, label, amount, count, kind, detail }: { icon: ReactNode; tone: string; label: string; amount: number; count?: number; kind?: string; detail?: string }) {
  return <article className="transaction-summary-card"><span className={`transaction-summary-icon ${tone}`}>{icon}</span><div><span>{label}</span><strong>{formatRupees(amount)}</strong><small>{detail ?? `${count} ${kind}`}</small></div></article>
}
function TypeBadge({ item }: { item: TransactionRecord }) { return <span className={`transaction-type-badge ${item.type}`} title={item.type}><span>{item.type === 'income' ? <ArrowDownLeft size={14} /> : <ArrowUpRight size={14} />}</span><b>{item.type === 'income' ? 'Income' : 'Expense'}</b></span> }
function DetailsDialog({ item, onClose }: { item: TransactionRecord; onClose: () => void }) {
  return <div className="transaction-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section className="transaction-modal" role="dialog" aria-modal="true" aria-labelledby="details-heading"><button className="transaction-modal-close" onClick={onClose} aria-label="Close details"><X size={17} /></button><h2 id="details-heading">Transaction Details</h2><div className="transaction-detail-lead"><TypeBadge item={item} /><strong>{item.note || (item.type === 'income' ? item.source : item.category)}</strong><b className={`amount-column ${item.type}`}>{item.type === 'income' ? '+' : '−'}{formatRupees(item.amountPaise)}</b></div><Detail label="Type" value={item.type === 'income' ? 'Income' : 'Expense'} /><Detail label={item.type === 'income' ? 'Income Source' : 'Category'} value={item.type === 'income' ? item.source : item.category} /><Detail label="Date" value={formatDate(item.date)} /><Detail label="Payment Method" value={item.paymentMethod || 'Not specified'} /><Detail label="Note" value={item.note || 'No note'} /><Detail label="Created" value={new Date(item.createdAt).toLocaleString('en-IN')} /><button className="expense-cancel detail-close" onClick={onClose}>Close</button></section></div>
}
function Detail({ label, value }: { label: string; value: string }) { return <div className="transaction-detail-row"><span>{label}</span><b>{value}</b></div> }
function EditDialog({ item, onClose, onSave }: { item: TransactionRecord; onClose: () => void; onSave: (draft: TransactionDraft) => void }) {
  const [amount, setAmount] = useState((item.amountPaise / 100).toFixed(2))
  const [date, setDate] = useState(item.date)
  const [note, setNote] = useState(item.note)
  const [field, setField] = useState<string>(item.type === 'income' ? item.source : item.category)
  const [payment, setPayment] = useState<string>(item.paymentMethod)
  const [errors, setErrors] = useState<Record<string, string>>({})
  const [saveError, setSaveError] = useState('')
  const submit = (event: FormEvent) => {
    event.preventDefault()
    const draft = item.type === 'income' ? { amount, source: field, date, paymentMethod: payment, note } : { amount, category: field, date, paymentMethod: payment, note }
    const validation = item.type === 'income' ? validateIncome(draft as IncomeDraft) : validateExpense(draft as ExpenseDraft)
    setErrors(validation)
    if (Object.keys(validation).length) return
    try { onSave(draft); } catch (reason) { setSaveError(reason instanceof Error ? reason.message : 'Could not update this transaction.') }
  }
  const options = item.type === 'income' ? INCOME_SOURCES : EXPENSE_CATEGORIES
  const payments = item.type === 'income' ? INCOME_PAYMENT_METHODS : PAYMENT_METHODS
  return <div className="transaction-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section className="transaction-modal edit-dialog" role="dialog" aria-modal="true" aria-labelledby="edit-heading"><button className="transaction-modal-close" onClick={onClose} aria-label="Close edit form"><X size={17} /></button><h2 id="edit-heading">Edit Transaction</h2><form className="transaction-edit-form" onSubmit={submit} noValidate><EditField label="Description" error={errors.note}><input value={note} maxLength={100} onChange={e => setNote(e.target.value)} placeholder="Add a description" /></EditField><EditField label={item.type === 'income' ? 'Income Source' : 'Category'} error={errors[item.type === 'income' ? 'source' : 'category']}><select value={field} onChange={e => setField(e.target.value)}>{options.map(option => <option key={option}>{option}</option>)}</select></EditField><EditField label="Date" error={errors.date}><input type="date" value={date} onChange={e => setDate(e.target.value)} /></EditField><EditField label="Payment Method" error={errors.paymentMethod}><select value={payment} onChange={e => setPayment(e.target.value)}>{item.type === 'income' && <option value="">Not specified</option>}{payments.map(option => <option key={option}>{option}</option>)}</select></EditField><EditField label="Amount (₹)" error={errors.amount}><input inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} /></EditField>{saveError && <p className="transaction-error">{saveError}</p>}<footer><button type="button" className="expense-cancel" onClick={onClose}>Cancel</button><button type="submit" className="expense-save">Update</button></footer></form></section></div>
}
function EditField({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="edit-field"><span>{label} {label !== 'Description' && <b>*</b>}</span>{children}{error && <small>{error}</small>}</label> }
function formatRupees(paise: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(paise / 100) }
function formatDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Intl.DateTimeFormat('en-IN', { day: '2-digit', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day)) }
function pad(value: number) { return String(value).padStart(2, '0') }
function toDate(value: Date) { return `${value.getFullYear()}-${pad(value.getMonth() + 1)}-${pad(value.getDate())}` }
