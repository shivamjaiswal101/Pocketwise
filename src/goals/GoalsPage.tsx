import { useRef, useState, type CSSProperties, type FormEvent, type ReactNode } from 'react'
import { CalendarDays, Check, CircleDollarSign, Clock3, Eye, Goal, Pencil, Plus, ShieldCheck, Target, Trash2, X } from 'lucide-react'
import { goalProgress, goalRemainingPaise, goalSavedPaise, validateContribution, validateGoal, type GoalContributionDraft, type GoalDraft, type SavingsGoal } from './goalStore'
import './goals.css'

type Props = { goals: SavingsGoal[]; onCreate: (draft: GoalDraft) => void; onUpdate: (id: string, draft: GoalDraft) => void; onDelete: (id: string) => void; onContribute: (id: string, draft: GoalContributionDraft) => void }
type FormMode = 'create' | 'edit' | null

export default function GoalsPage({ goals, onCreate, onUpdate, onDelete, onContribute }: Props) {
  const [formMode, setFormMode] = useState<FormMode>(null)
  const [selected, setSelected] = useState<SavingsGoal | null>(null)
  const [deleting, setDeleting] = useState<SavingsGoal | null>(null)
  const [adding, setAdding] = useState<SavingsGoal | null>(null)
  const [toast, setToast] = useState('')
  const [error, setError] = useState('')
  const activeCount = goals.filter(goal => goalRemainingPaise(goal) > 0).length
  const savedTotal = goals.reduce((sum, goal) => sum + goalSavedPaise(goal), 0)
  const targetTotal = goals.reduce((sum, goal) => sum + goal.targetPaise, 0)
  const beginEdit = (goal: SavingsGoal) => { setSelected(goal); setFormMode('edit'); setError('') }
  const submitForm = (draft: GoalDraft) => {
    try {
      if (formMode === 'create') onCreate(draft)
      else if (selected) onUpdate(selected.id, draft)
      setFormMode(null); setSelected(null); setError('')
      setToast(formMode === 'create' ? 'Savings goal created successfully.' : 'Savings goal updated successfully.')
    } catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this goal.'); throw reason }
  }
  const confirmDelete = () => {
    if (!deleting) return
    try { onDelete(deleting.id); setDeleting(null); setSelected(null); setError(''); setToast('Savings goal deleted successfully.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not delete this goal.') }
  }
  const submitContribution = (draft: GoalContributionDraft) => {
    if (!adding) return
    try { onContribute(adding.id, draft); setAdding(null); setError(''); setToast('Contribution Added! Your recorded goal contribution has been saved.') }
    catch (reason) { setError(reason instanceof Error ? reason.message : 'Could not save this contribution.'); throw reason }
  }

  return <div className="goals-page">
    <div className="goals-page-actions"><div><span className="eyebrow">Small steps add up</span></div><button className="button button-primary" onClick={() => { setFormMode('create'); setSelected(null); setError('') }}><Plus size={16} />Create New Goal</button></div>
    <div className="goals-summary-grid">
      <GoalSummary icon={<Target size={20} />} tone="mint" title="Total Goals" value={String(goals.length)} note={`${activeCount} active`} />
      <GoalSummary icon={<CircleDollarSign size={20} />} tone="green" title="Total Saved" value={formatRupees(savedTotal)} note="Recorded contributions only" />
      <GoalSummary icon={<Goal size={20} />} tone="amber" title="Total Target Amount" value={formatRupees(targetTotal)} note="Across all goals" />
    </div>
    <div className="goals-disclaimer"><ShieldCheck size={14} />Goals are plans, not bank transfers. Saved amounts only reflect contributions recorded for that goal.</div>
    {goals.length === 0 ? <section className="goals-empty-state"><div className="goals-empty-icon"><Target size={27} /></div><h2>No savings goals yet.</h2><p>Create your first goal to start planning for something important.</p><button className="button button-primary" onClick={() => setFormMode('create')}><Plus size={16} />Create Your First Goal</button></section> : <div className="goals-card-grid">{goals.map(goal => <GoalCard key={goal.id} goal={goal} onView={() => setSelected(goal)} onAdd={() => { setAdding(goal); setError('') }} />)}</div>}
    {toast && <div className="goals-toast" role="status"><Check size={16} />{toast}<button onClick={() => setToast('')} aria-label="Dismiss"><X size={14} /></button></div>}
    {error && !formMode && !deleting && <p className="goal-error" role="alert">{error}</p>}
    {formMode && <GoalForm mode={formMode} goal={selected ?? undefined} onClose={() => { setFormMode(null); setError('') }} onSave={submitForm} externalError={error} />}
    {selected && !formMode && <GoalDetails goal={goals.find(goal => goal.id === selected.id) ?? selected} onClose={() => setSelected(null)} onEdit={() => beginEdit(goals.find(goal => goal.id === selected.id) ?? selected)} onDelete={() => { setDeleting(goals.find(goal => goal.id === selected.id) ?? selected); setError('') }} onAdd={() => { setAdding(goals.find(goal => goal.id === selected.id) ?? selected); setError('') }} />}
    {adding && <ContributionForm goal={goals.find(goal => goal.id === adding.id) ?? adding} onClose={() => { setAdding(null); setError('') }} onSave={submitContribution} externalError={error} />}
    {deleting && <div className="goal-modal-backdrop"><section className="goal-dialog goal-delete-dialog" role="alertdialog" aria-modal="true" aria-labelledby="delete-goal-title"><button className="goal-modal-close" onClick={() => setDeleting(null)} aria-label="Close confirmation"><X size={17} /></button><div className="goal-delete-icon"><Trash2 size={20} /></div><h2 id="delete-goal-title">Delete Savings Goal?</h2><p>Are you sure you want to delete this goal?</p>{deleting.contributions.length > 0 && <div className="goal-delete-warning">Deleting this goal will also remove its {deleting.contributions.length} recorded contribution{deleting.contributions.length === 1 ? '' : 's'} from the goal history. Related income and expense transactions will not be changed.</div>}{error && <small className="goal-field-error">{error}</small>}<footer><button className="goal-button-outline" onClick={() => setDeleting(null)}>Cancel</button><button className="goal-button-delete" onClick={confirmDelete}>Delete Goal</button></footer></section></div>}
  </div>
}

function GoalSummary({ icon, tone, title, value, note }: { icon: ReactNode; tone: string; title: string; value: string; note: string }) { return <article className="goal-summary-card"><span className={`goal-summary-icon ${tone}`}>{icon}</span><div><span>{title}</span><strong>{value}</strong><small>{note}</small></div></article> }
function GoalCard({ goal, onView, onAdd }: { goal: SavingsGoal; onView: () => void; onAdd: () => void }) {
  const saved = goalSavedPaise(goal), progress = goalProgress(goal), remaining = goalRemainingPaise(goal), status = goalStatus(goal)
  return <article className="goal-card"><button className="goal-card-main" onClick={onView} aria-label={`View ${goal.name}`}><div className="goal-card-head"><span className="goal-card-icon"><Target size={22} /></span><span className={`goal-status ${status.className}`}>{status.label}</span></div><h2>{goal.name}</h2><p className="goal-card-description">{goal.description || 'A personal goal you are working toward.'}</p><div className="goal-card-values"><span><strong>{formatRupees(saved)}</strong><i>Saved</i></span><b>/</b><span><strong>{formatRupees(goal.targetPaise)}</strong><i>Target</i></span><strong className="goal-percent">{progress}%</strong></div><div className="goal-progress-track" role="progressbar" aria-valuenow={progress} aria-valuemin={0} aria-valuemax={100} aria-label={`${goal.name} progress`}><span style={{ width: `${progress}%` }} /></div><div className="goal-remaining"><span>{remaining > 0 ? `${formatRupees(remaining)} remaining` : 'Target reached'}</span>{goal.deadline && <span><CalendarDays size={13} />Due {formatDate(goal.deadline)}</span>}</div></button><div className="goal-card-footer"><span><Clock3 size={14} />{goal.contributions.length} contribution{goal.contributions.length === 1 ? '' : 's'} recorded</span><div className="goal-card-actions"><button onClick={onView}><Eye size={15} /> View Details</button><button className="goal-add-money" onClick={onAdd}><Plus size={14} />Add Money</button></div></div></article>
}

function GoalForm({ mode, goal, onClose, onSave, externalError }: { mode: Exclude<FormMode, null>; goal?: SavingsGoal; onClose: () => void; onSave: (draft: GoalDraft) => void; externalError: string }) {
  const [name, setName] = useState(goal?.name ?? '')
  const [targetAmount, setTargetAmount] = useState(goal ? (goal.targetPaise / 100).toFixed(2) : '')
  const [deadline, setDeadline] = useState(goal?.deadline ?? '')
  const [description, setDescription] = useState(goal?.description ?? '')
  const [errors, setErrors] = useState<Partial<Record<keyof GoalDraft, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const submit = (event: FormEvent) => {
    event.preventDefault(); if (submitted) return
    const draft = { name, targetAmount, deadline, description }
    const validation = validateGoal(draft); setErrors(validation); setSaveError('')
    if (Object.keys(validation).length) return
    setSubmitted(true); setSaving(true)
    try { onSave(draft) } catch (reason) { setSaveError(reason instanceof Error ? reason.message : 'Could not save the goal.'); setSubmitted(false) } finally { setSaving(false) }
  }
  return <div className="goal-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose() }}><section className="goal-dialog" role="dialog" aria-modal="true" aria-labelledby="goal-form-title"><button className="goal-modal-close" onClick={onClose} aria-label="Close goal form"><X size={17} /></button><h2 id="goal-form-title">{mode === 'create' ? 'Create Savings Goal' : 'Edit Savings Goal'}</h2><p className="goal-dialog-subtitle">{mode === 'create' ? 'Set a goal and start saving towards it.' : 'Update your goal details.'}</p><form className="goal-form" onSubmit={submit} noValidate>
    <GoalField label="Goal Name" error={errors.name}><input id="goal-name" autoFocus value={name} onChange={e => setName(e.target.value)} placeholder="e.g. New Laptop" maxLength={60} aria-invalid={!!errors.name} /></GoalField>
    <GoalField label="Target Amount (₹)" error={errors.targetAmount}><div className="goal-money-input"><span>₹</span><input id="goal-target" inputMode="decimal" value={targetAmount} onChange={e => setTargetAmount(e.target.value)} placeholder="Enter target amount" aria-invalid={!!errors.targetAmount} /></div></GoalField>
    <GoalField label="Deadline (Optional)" error={errors.deadline}><input id="goal-deadline" type="date" min={localToday()} value={deadline} onChange={e => setDeadline(e.target.value)} aria-invalid={!!errors.deadline} /></GoalField>
    <GoalField label="Description (Optional)" error={errors.description}><textarea id="goal-description" value={description} onChange={e => setDescription(e.target.value)} placeholder="What are you saving for?" maxLength={160} rows={3} /></GoalField>
    {(saveError || externalError) && <p className="goal-field-error" role="alert">{saveError || externalError}</p>}
    <footer><button type="button" className="goal-button-outline" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="goal-button-primary" disabled={saving}>{saving ? 'Saving…' : mode === 'create' ? 'Create Goal' : 'Update Goal'}</button></footer>
  </form></section></div>
}
function ContributionForm({ goal, onClose, onSave, externalError }: { goal: SavingsGoal; onClose: () => void; onSave: (draft: GoalContributionDraft) => void; externalError: string }) {
  const [amount, setAmount] = useState('')
  const [date, setDate] = useState(localToday())
  const [note, setNote] = useState('')
  const [errors, setErrors] = useState<Partial<Record<keyof GoalContributionDraft, string>>>({})
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const submitted = useRef(false)
  const submit = (event: FormEvent) => {
    event.preventDefault()
    if (submitted.current) return
    const draft = { amount, date, note }
    const validation = validateContribution(draft)
    setErrors(validation); setSaveError('')
    if (Object.keys(validation).length) return
    submitted.current = true; setSaving(true)
    try { onSave(draft) } catch (reason) { setSaveError(reason instanceof Error ? reason.message : 'Could not save this contribution.'); submitted.current = false } finally { setSaving(false) }
  }
  return <div className="goal-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget && !saving) onClose() }}><section className="goal-dialog contribution-dialog" role="dialog" aria-modal="true" aria-labelledby="contribution-title"><button className="goal-modal-close" onClick={onClose} aria-label="Close contribution form"><X size={17} /></button><h2 id="contribution-title">Add Money to Goal</h2><p className="goal-dialog-subtitle">Record your contribution towards this savings goal.</p><div className="contribution-goal-context"><Target size={16} /><span>{goal.name}</span></div><form className="goal-form" onSubmit={submit} noValidate>
    <GoalField label="Amount (₹)" error={errors.amount}><div className="goal-money-input"><span>₹</span><input id="contribution-amount" inputMode="decimal" value={amount} onChange={e => setAmount(e.target.value)} placeholder="Enter contribution amount" aria-invalid={!!errors.amount} /></div></GoalField>
    <GoalField label="Date" error={errors.date}><input id="contribution-date" type="date" value={date} onChange={e => setDate(e.target.value)} aria-invalid={!!errors.date} /></GoalField>
    <GoalField label="Note (Optional)" error={errors.note}><div className="contribution-note-input"><textarea id="contribution-note" value={note} onChange={e => setNote(e.target.value)} placeholder="From pocket money" maxLength={100} rows={2} /><span>{note.length}/100</span></div></GoalField>
    <p className="contribution-disclaimer"><ShieldCheck size={13} />This records progress toward your goal. It does not transfer money or change your recorded balance.</p>
    {(saveError || externalError) && <p className="goal-field-error" role="alert">{saveError || externalError}</p>}
    <footer><button type="button" className="goal-button-outline" onClick={onClose} disabled={saving}>Cancel</button><button type="submit" className="goal-button-primary" disabled={saving}>{saving ? 'Saving…' : 'Add Contribution'}</button></footer>
  </form></section></div>
}
function GoalField({ label, error, children }: { label: string; error?: string; children: ReactNode }) { return <label className="goal-field"><span>{label}{label.includes('Optional') ? '' : <b> *</b>}</span>{children}{error && <small className="goal-field-error">{error}</small>}</label> }
function GoalDetails({ goal, onClose, onEdit, onDelete, onAdd }: { goal: SavingsGoal; onClose: () => void; onEdit: () => void; onDelete: () => void; onAdd: () => void }) {
  const saved = goalSavedPaise(goal), progress = goalProgress(goal), remaining = goalRemainingPaise(goal), status = goalStatus(goal)
  const history = [...goal.contributions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt))
  return <div className="goal-modal-backdrop" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><section className="goal-dialog goal-details-dialog" role="dialog" aria-modal="true" aria-labelledby="goal-detail-title"><button className="goal-modal-close" onClick={onClose} aria-label="Close goal details"><X size={17} /></button><span className={`goal-status ${status.className}`}>{status.label}</span><h2 id="goal-detail-title">{goal.name}</h2><p className="goal-detail-description">{goal.description || 'No description added.'}</p><div className="goal-detail-progress"><div className="goal-progress-ring" style={{ '--goal-progress': `${progress}%` } as CSSProperties}><span>{progress}%</span></div><div><strong>{formatRupees(saved)}</strong><span>Saved</span><strong>{formatRupees(goal.targetPaise)}</strong><span>Target</span></div></div><div className="goal-detail-remaining"><b>{formatRupees(remaining)}</b><span>remaining</span></div>{goal.deadline && <div className="goal-detail-deadline"><CalendarDays size={16} />Deadline: {formatDate(goal.deadline)}</div>}<div className="goal-details-actions"><button className="goal-button-primary" onClick={onAdd}><Plus size={15} />Add Money</button><button className="goal-button-outline" onClick={onEdit}><Pencil size={14} />Edit Goal</button></div><div className="goal-contribution-history"><h3>Contribution History</h3>{history.length ? <div className="contribution-history-table"><div className="contribution-history-head"><span>Date</span><span>Amount</span><span>Note</span></div>{history.map(item => <div className="contribution-history-row" key={item.id}><span>{formatDate(item.date)}</span><b>{formatRupees(item.amountPaise)}</b><span>{item.note || '—'}</span></div>)}</div> : <div className="contribution-history-empty"><b>No contributions yet.</b><p>Add your first contribution to start tracking your progress.</p></div>}</div><footer className="goal-detail-footer"><button className="goal-button-delete-outline" onClick={onDelete}><Trash2 size={14} />Delete Goal</button></footer></section></div>
}
function goalStatus(goal: SavingsGoal) {
  if (goalRemainingPaise(goal) === 0) return { label: 'Completed', className: 'completed' }
  if (goal.deadline && goal.deadline < localToday()) return { label: 'Overdue', className: 'overdue' }
  return { label: 'On Track', className: 'on-track' }
}
function formatRupees(paise: number) { return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(paise / 100) }
function formatDate(value: string) { const [year, month, day] = value.split('-').map(Number); return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short', year: 'numeric' }).format(new Date(year, month - 1, day)) }
function localToday() { const date = new Date(); return `${date.getFullYear()}-${String(date.getMonth()+1).padStart(2,'0')}-${String(date.getDate()).padStart(2,'0')}` }
