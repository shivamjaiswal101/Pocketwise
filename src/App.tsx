import { useEffect, useState, type ReactNode } from 'react'
import {
  Activity, ArrowDownLeft, ArrowUpRight, Bell, BookOpen, BusFront, CalendarDays, Check, Clapperboard,
  ChevronDown, CircleDollarSign, CreditCard, LayoutDashboard, Leaf,
  Menu, Plus, Search, Settings, ShieldCheck, Sparkles, Target, TrendingUp,
  Wallet, ReceiptText, HeartPulse, ShoppingBag, Utensils,
} from 'lucide-react'
import { ForgotPasswordPage, LoginPage, RegisterPage, RegisterSuccessPage, VerifyEmailPage, WelcomePage } from './auth/AuthPages'
import ExpenseModal from './expenses/ExpenseModal'
import IncomeModal from './income/IncomeModal'
import { categoryTotals, currentMonthExpenses, currentMonthIncomes, deleteTransaction, loadTransactions, recordedBalance, saveExpense, saveIncome, todayLocal, updateTransaction, type ExpenseDraft, type IncomeDraft, type TransactionRecord } from './expenses/expenseStore'
import TransactionsPage from './transactions/TransactionsPage'
import GoalsPage from './goals/GoalsPage'
import { addGoalContribution, createGoal, deleteGoal, goalProgress, goalSavedPaise, loadGoals, updateGoal, type GoalContributionDraft, type GoalDraft, type SavingsGoal } from './goals/goalStore'
import ForecastPage from './forecast/ForecastPage'
import { calculateForecast, deleteUpcomingExpense, loadForecastSettings, loadUpcomingExpenses, saveForecastSettings, saveUpcomingExpense, type ForecastSettingsDraft, type UpcomingExpenseDraft } from './forecast/forecastStore'
import CoachPage from './coach/CoachPage'

type Page = 'Overview' | 'Transactions' | 'Add Expense' | 'Savings Goals' | 'Money Forecast' | 'AI Money Coach' | 'Settings'
type ModalKind = 'expense' | 'income' | null

const navigation: { label: Page; icon: typeof LayoutDashboard }[] = [
  { label: 'Overview', icon: LayoutDashboard },
  { label: 'Transactions', icon: ReceiptText },
  { label: 'Add Expense', icon: Plus },
  { label: 'Savings Goals', icon: Target },
  { label: 'Money Forecast', icon: TrendingUp },
  { label: 'AI Money Coach', icon: Sparkles },
]

const futureCopy: Record<Exclude<Page, 'Overview' | 'AI Money Coach'>, string> = {
  Transactions: 'Review and manage your money activity.',
  'Add Expense': 'Expense entry is planned for Phase 2. This first version focuses on a clear, honest dashboard.',
  'Savings Goals': 'Set a goal that matters to you and track your progress in a future phase.',
  'Money Forecast': 'Forecasting will arrive once PocketWise can use your real income and spending history.',
  Settings: 'Account preferences and privacy controls are planned for a future phase.',
}

function App() {
  const [route, setRoute] = useState(window.location.pathname === '/' ? '/welcome' : window.location.pathname)
  const [temporaryName, setTemporaryName] = useState(() => sessionStorage.getItem('pocketwise.tempName') ?? '')
  const [transactions, setTransactions] = useState<TransactionRecord[]>(() => loadTransactions())
  const [goals, setGoals] = useState<SavingsGoal[]>(() => loadGoals())
  const [forecastSettings, setForecastSettings] = useState(() => loadForecastSettings())
  const [upcomingExpenses, setUpcomingExpenses] = useState(() => loadUpcomingExpenses())
  const [page, setPage] = useState<Page>('Overview')
  const [modal, setModal] = useState<ModalKind>(null)
  const [mobileNav, setMobileNav] = useState(false)
  const [toast, setToast] = useState('')
  const [profileOpen, setProfileOpen] = useState(false)

  useEffect(() => {
    const syncRoute = () => setRoute(window.location.pathname === '/' ? '/welcome' : window.location.pathname)
    window.addEventListener('popstate', syncRoute)
    return () => window.removeEventListener('popstate', syncRoute)
  }, [])

  const goPath = (path: string) => {
    window.history.pushState({}, '', path)
    setRoute(path)
    window.scrollTo(0, 0)
  }

  const enterTemporaryPreview = (name: string) => {
    const displayName = name.trim().slice(0, 60) || 'Student'
    sessionStorage.setItem('pocketwise.tempName', displayName)
    setTemporaryName(displayName)
    goPath('/dashboard')
  }
  const exitTemporaryPreview = () => {
    sessionStorage.removeItem('pocketwise.tempName')
    setTemporaryName('')
    goPath('/welcome')
  }

  if (route === '/register') return <RegisterPage navigate={goPath} onTemporaryPreview={enterTemporaryPreview} />
  if (route === '/login') return <LoginPage navigate={goPath} onTemporaryPreview={enterTemporaryPreview} />
  if (route === '/verify-email') return <VerifyEmailPage navigate={goPath} />
  if (route === '/forgot-password') return <ForgotPasswordPage navigate={goPath} />
  if (route === '/register-success') return <RegisterSuccessPage navigate={goPath} />
  if (route !== '/dashboard') return <WelcomePage navigate={goPath} onTemporaryPreview={enterTemporaryPreview} />

  const showToast = (message: string) => {
    setToast(message)
    window.setTimeout(() => setToast(''), 2800)
  }
  const navigate = (next: Page) => {
    setPage(next)
    setMobileNav(false)
    if (next === 'Add Expense') setModal('expense')
  }
  const handleSaveExpense = (draft: ExpenseDraft) => {
    const expense = saveExpense(draft)
    setTransactions(loadTransactions())
    setModal(null)
    setPage(current => current === 'Add Expense' ? 'Overview' : current)
    setToast(`Expense ${formatRupees(expense.amountPaise)} added successfully.`)
    window.setTimeout(() => setToast(''), 3000)
  }
  const handleSaveIncome = (draft: IncomeDraft) => {
    saveIncome(draft)
    setTransactions(loadTransactions())
    setModal(null)
    setPage(current => current === 'Add Expense' ? 'Overview' : current)
    setToast('Income Added Successfully! Your income has been added to your records.')
    window.setTimeout(() => setToast(''), 3500)
  }
  const handleCreateGoal = (draft: GoalDraft) => { createGoal(draft); setGoals(loadGoals()) }
  const handleUpdateGoal = (id: string, draft: GoalDraft) => { updateGoal(id, draft); setGoals(loadGoals()) }
  const handleDeleteGoal = (id: string) => { deleteGoal(id); setGoals(loadGoals()) }
  const handleGoalContribution = (id: string, draft: GoalContributionDraft) => { addGoalContribution(id, draft); setGoals(loadGoals()) }
  const handleForecastSettings = (draft: ForecastSettingsDraft) => { saveForecastSettings(draft); setForecastSettings(loadForecastSettings()) }
  const handleUpcomingSave = (draft: UpcomingExpenseDraft, id?: string) => { saveUpcomingExpense(draft, window.localStorage, id); setUpcomingExpenses(loadUpcomingExpenses()) }
  const handleUpcomingDelete = (id: string) => { deleteUpcomingExpense(id); setUpcomingExpenses(loadUpcomingExpenses()) }

  return (
    <div className="app-shell">
      <button className={`mobile-scrim ${mobileNav ? 'show' : ''}`} onClick={() => setMobileNav(false)} aria-label="Close navigation" />
      <aside className={`sidebar ${mobileNav ? 'open' : ''}`}>
        <div className="brand">
          <div className="brand-mark"><Leaf size={21} strokeWidth={2.5} /></div>
          <div><div className="brand-name">PocketWise</div><div className="brand-sub">Student Finance</div></div>
        </div>
        <nav className="nav-list" aria-label="Main navigation">
          {navigation.map(({ label, icon: Icon }) => (
            <button key={label} className={`nav-item ${page === label ? 'active' : ''}`} onClick={() => navigate(label)}>
              <Icon size={18} strokeWidth={2} /><span>{label}</span>{label === 'AI Money Coach' && <span className="nav-soon">Soon</span>}
            </button>
          ))}
        </nav>
        <div className="sidebar-bottom">
          <div className="privacy-note"><ShieldCheck size={15} /><span>Your data stays yours</span></div>
          <button className={`nav-item ${page === 'Settings' ? 'active' : ''}`} onClick={() => navigate('Settings')}><Settings size={18} /><span>Settings</span></button>
        </div>
      </aside>

      <main className="main-area">
        {route === '/dashboard' && <div className="dev-preview-banner"><ShieldCheck size={15} /><span>{temporaryName ? `Temporary preview for ${temporaryName} · not a real account.` : 'Dashboard development preview · Authentication is not configured.'}</span><button onClick={exitTemporaryPreview}>{temporaryName ? 'End preview' : 'Back to Welcome'}</button></div>}
        <header className="topbar">
          <button className="mobile-menu icon-button" onClick={() => setMobileNav(true)} aria-label="Open navigation"><Menu size={21} /></button>
          <div className="page-heading">
            <h1>{page}</h1>
            <p>{page === 'Overview' ? "Here's your financial snapshot." : page === 'Transactions' ? 'Review and manage your money activity.' : page === 'Savings Goals' ? 'Turn your dreams into achievable goals.' : page === 'Money Forecast' ? 'See how your money might look in the coming days and plan better.' : page === 'AI Money Coach' ? 'Your personal finance assistant for smarter money decisions.' : 'A thoughtful feature is on its way.'}</p>
          </div>
          <div className="top-actions">
            <div className="today-label"><CalendarDays size={15} /><span>{new Intl.DateTimeFormat('en-IN', { weekday: 'short', day: 'numeric', month: 'short', year: 'numeric' }).format(new Date())}</span></div>
            <button className="icon-button notification-button" aria-label="Notifications" onClick={() => showToast('You’re all caught up — no notifications yet.')}><Bell size={19} /><i /></button>
            <div className="profile-wrap">
              <button className="profile-button" aria-label="Profile menu" onClick={() => setProfileOpen(!profileOpen)}><span className="avatar">{temporaryName ? temporaryName.charAt(0).toUpperCase() : '◎'}</span><ChevronDown size={15} /></button>
              {profileOpen && <div className="profile-popover"><b>{temporaryName || 'PocketWise preview'}</b><span>{temporaryName ? 'Temporary preview · this tab only' : 'Development preview · no records yet'}</span><button onClick={() => { setPage('Settings'); setProfileOpen(false) }}>Settings</button><button onClick={exitTemporaryPreview}>{temporaryName ? 'End temporary preview' : 'Back to Welcome'}</button></div>}
            </div>
          </div>
        </header>

        {page === 'Overview' ? <Dashboard transactions={transactions} goals={goals} forecastSettings={forecastSettings} upcomingExpenses={upcomingExpenses} onModal={setModal} onNavigate={navigate} /> : page === 'Transactions' ? <TransactionsPage transactions={transactions} onAdd={kind => setModal(kind)} onUpdate={(id, draft) => { updateTransaction(id, draft); setTransactions(loadTransactions()) }} onDelete={id => { deleteTransaction(id); setTransactions(loadTransactions()) }} /> : page === 'Savings Goals' ? <GoalsPage goals={goals} onCreate={handleCreateGoal} onUpdate={handleUpdateGoal} onDelete={handleDeleteGoal} onContribute={handleGoalContribution} /> : page === 'Money Forecast' ? <ForecastPage transactions={transactions} settings={forecastSettings} upcoming={upcomingExpenses} onSettingsSave={handleForecastSettings} onUpcomingSave={handleUpcomingSave} onUpcomingDelete={handleUpcomingDelete} onToast={showToast} /> : page === 'AI Money Coach' ? <CoachPage transactions={transactions} settings={forecastSettings} upcoming={upcomingExpenses} displayName={temporaryName} /> : <ComingSoon page={page} copy={futureCopy[page]} onBack={() => setPage('Overview')} />}
      </main>
      {modal === 'expense' && <ExpenseModal onClose={() => setModal(null)} onSave={handleSaveExpense} />}
      {modal === 'income' && <IncomeModal onClose={() => setModal(null)} onSave={handleSaveIncome} />}
      {toast && <div className="toast"><Check size={17} />{toast}</div>}
    </div>
  )
}

function Dashboard({ transactions, goals, forecastSettings, upcomingExpenses, onModal, onNavigate }: { transactions: TransactionRecord[]; goals: SavingsGoal[]; forecastSettings: ReturnType<typeof loadForecastSettings>; upcomingExpenses: ReturnType<typeof loadUpcomingExpenses>; onModal: (kind: ModalKind) => void; onNavigate: (page: Page) => void }) {
  const expenses = transactions.filter((item): item is Extract<TransactionRecord, { type: 'expense' }> => item.type === 'expense')
  const incomes = transactions.filter((item): item is Extract<TransactionRecord, { type: 'income' }> => item.type === 'income')
  const thisMonthExpenses = currentMonthExpenses(expenses)
  const thisMonthTotal = thisMonthExpenses.reduce((total, item) => total + item.amountPaise, 0)
  const thisMonthIncome = currentMonthIncomes(incomes).reduce((total, item) => total + item.amountPaise, 0)
  const balance = recordedBalance(transactions)
  const spending = categoryTotals(thisMonthExpenses)
  const recent = [...transactions].sort((a, b) => b.date.localeCompare(a.date) || b.createdAt.localeCompare(a.createdAt)).slice(0, 5)
  return <div className="dashboard-content">
    <section className="welcome-banner">
      <div className="welcome-copy">
        <span className="eyebrow">A fresh start, at your pace</span>
        <h2>Welcome to PocketWise <span aria-hidden="true">👋</span></h2>
        <p>Let’s get your money organized, one small step at a time.</p>
        <span className="welcome-detail">Add your first financial details to start understanding your money and building better habits.</span>
      </div>
      <div className="welcome-actions">
        <button className="button button-primary" onClick={() => onModal('expense')}><Plus size={17} /> Add Your First Expense</button>
        <button className="button button-soft" onClick={() => onModal('income')}><ArrowDownLeft size={17} /> Add Income</button>
      </div>
      <div className="banner-orbit orbit-one" /><div className="banner-orbit orbit-two" />
    </section>

    <div className="summary-grid">
      <SummaryCard icon={<Wallet size={19} />} iconTone="mint" title="Available Balance" value={formatRupees(balance)} hint="Based on income and expenses recorded here." />
      <SummaryCard icon={<ArrowDownLeft size={19} />} iconTone="blue" title="Income This Month" value={formatRupees(thisMonthIncome)} hint={`${currentMonthIncomes(incomes).length} recorded ${currentMonthIncomes(incomes).length === 1 ? 'income' : 'incomes'}`} />
      <SummaryCard icon={<CreditCard size={18} />} iconTone="rose" title="Expenses This Month" value={formatRupees(thisMonthTotal)} hint={thisMonthExpenses.length ? `${thisMonthExpenses.length} recorded ${thisMonthExpenses.length === 1 ? 'expense' : 'expenses'}` : 'Your spending will appear here.'} />
    </div>
    <div className="truth-note"><ShieldCheck size={14} /><span>{transactions.length ? 'Balance is calculated from records stored in this browser; it is not a verified bank balance.' : 'No financial records yet. ₹0 means nothing has been recorded in PocketWise; it is not a verified bank balance.'}</span></div>

    <div className="content-grid">
      <div className="column-stack">
        <section className="panel spending-panel">
          <PanelHeader title="Spending Overview" subtitle="See where your money goes as you record your expenses." action="View transactions" onAction={() => onNavigate('Transactions')} />
          {spending.length ? <SpendingList totals={spending} onAdd={() => onModal('expense')} /> : <div className="empty-inline">
            <div className="empty-illustration mint-illustration"><Activity size={23} /></div>
            <div><h3>No spending data yet.</h3><p>Add your first expense to see your spending by category.</p></div>
            <button className="text-button" onClick={() => onModal('expense')}><Plus size={15} /> Add Expense</button>
          </div>}
        </section>
        <section className="panel transactions-panel">
          <PanelHeader title="Recent Transactions" subtitle="Your recent money activity." action="View all" onAction={() => onNavigate('Transactions')} />
          {recent.length ? <RecentTransactions transactions={recent} onAdd={() => onModal('expense')} /> : <div className="transaction-empty">
            <div className="empty-illustration neutral-illustration"><ReceiptText size={21} /></div>
            <div><h3>Your transactions will appear here.</h3><p>Once you start recording income and expenses, you can review them here.</p></div>
            <button className="button button-outline" onClick={() => onModal('expense')}><Plus size={15} /> Add Expense</button>
          </div>}
        </section>
      </div>
      <div className="column-stack">
        <section className="panel goals-panel">
          <PanelHeader title="Your Savings Goals" subtitle="Turn something you want into a goal you can work toward." action="Explore goals" onAction={() => onNavigate('Savings Goals')} />
          {goals.length ? <div className="dashboard-goal-preview">{goals.filter(goal => goalProgress(goal) < 100).slice(0, 2).map(goal => <button className="dashboard-goal-row" key={goal.id} onClick={() => onNavigate('Savings Goals')}><span className="goal-preview-icon"><Target size={17} /></span><span className="goal-preview-copy"><b>{goal.name}</b><small>{formatRupees(goalSavedPaise(goal))} / {formatRupees(goal.targetPaise)}</small><i><span style={{ width: `${goalProgress(goal)}%` }} /></i></span><strong>{goalProgress(goal)}%</strong></button>)}{goals.every(goal => goalProgress(goal) === 100) && <p className="dashboard-goals-complete">All your goals have reached their targets. Start another goal to keep planning.</p>}<div className="dashboard-goal-actions"><button className="text-button" onClick={() => onNavigate('Savings Goals')}>View All Goals <ArrowUpRight size={14} /></button><button className="button button-outline" onClick={() => onNavigate('Savings Goals')}><Plus size={14} />Create Goal</button></div></div> : <div className="goal-empty">
            <div className="empty-illustration blue-illustration"><Target size={22} /></div>
            <h3>No savings goals yet.</h3>
            <p>Create your first goal to start planning for something important.</p>
            <button className="button button-outline" onClick={() => onNavigate('Savings Goals')}><Plus size={15} /> Create Your First Goal</button>
          </div>}
        </section>
        <DashboardForecastPreview transactions={transactions} settings={forecastSettings} upcoming={upcomingExpenses} onOpen={() => onNavigate('Money Forecast')} />
        <section className="getting-started">
          <div className="getting-title"><BookOpen size={17} /><h2>Getting started</h2></div>
          <div className="checklist-row"><span className="step-number">1</span><span>Record your first income</span><button onClick={() => onModal('income')}>Start</button></div>
          <div className="checklist-row"><span className="step-number">2</span><span>Add your first expense</span><button onClick={() => onModal('expense')}>Start</button></div>
          <div className="checklist-row"><span className="step-number">3</span><span>Create a savings goal</span><button onClick={() => onNavigate('Savings Goals')}>Start</button></div>
        </section>
      </div>
    </div>
  </div>
}

function DashboardForecastPreview({ transactions, settings, upcoming, onOpen }: { transactions: TransactionRecord[]; settings: ReturnType<typeof loadForecastSettings>; upcoming: ReturnType<typeof loadUpcomingExpenses>; onOpen: () => void }) {
  const forecast = calculateForecast({ transactions, settings, upcoming })
  const available = forecast.predictedBalancePaise !== null && forecast.hasHistory
  return <section className="panel forecast-panel"><div className="forecast-heading"><div className="forecast-icon"><TrendingUp size={18}/></div><div><h2>Money Forecast</h2><p>{available ? `Recorded balance ${formatRupees(forecast.balance)} · Estimated ${formatRupees(forecast.predictedBalancePaise!)}${settings?.nextAllowanceDate ? ` · Expected allowance ${new Intl.DateTimeFormat('en-IN',{day:'numeric',month:'short'}).format(new Date(`${settings.nextAllowanceDate}T12:00:00`))}${settings.expectedAmountPaise?` (${formatRupees(settings.expectedAmountPaise)})`:''}` : ''}` : 'Your forecast starts with your financial picture.'}</p></div></div>{!available&&<div className="forecast-empty"><Sparkles size={16}/><div><b>Forecast information is not available yet.</b><p>Record income and expenses and configure your next allowance to get a clearer estimate.</p></div></div>}<button className="button button-primary forecast-cta" onClick={onOpen}>{available?'View Money Forecast':'Set Up Money Forecast'} <ArrowUpRight size={16}/></button></section>
}

function formatRupees(paise: number) {
  return new Intl.NumberFormat('en-IN', { style: 'currency', currency: 'INR', minimumFractionDigits: 0, maximumFractionDigits: 2 }).format(paise / 100)
}

const categoryColors: Record<string, string> = {
  'Food & Dining': '#f2a33a', Travel: '#399be0', Shopping: '#df5b91', Entertainment: '#8a72df',
  Education: '#5489c9', Health: '#e27070', 'Bills & Utilities': '#53a78a', Other: '#8693a2',
}

function CategoryIcon({ category }: { category: string }) {
  const icon = category === 'Food & Dining' ? <Utensils size={14} />
    : category === 'Travel' ? <BusFront size={14} />
      : category === 'Shopping' ? <ShoppingBag size={14} />
        : category === 'Entertainment' ? <Clapperboard size={14} />
          : category === 'Education' ? <BookOpen size={14} />
            : category === 'Health' ? <HeartPulse size={14} />
              : category === 'Bills & Utilities' ? <ReceiptText size={14} /> : <CircleDollarSign size={14} />
  return <span className="expense-category-icon" style={{ color: categoryColors[category] ?? categoryColors.Other, backgroundColor: `${categoryColors[category] ?? categoryColors.Other}1c` }}>{icon}</span>
}

function SpendingList({ totals, onAdd }: { totals: ReturnType<typeof categoryTotals>; onAdd: () => void }) {
  return <div className="spending-list">
    {totals.map(item => <div className="spending-row" key={item.category}>
      <CategoryIcon category={item.category} /><span className="spending-name">{item.category}</span>
      <div className="spending-track"><span style={{ width: `${item.percent}%`, background: categoryColors[item.category] }} /></div>
      <strong>{formatRupees(item.amountPaise)}</strong><small>{item.percent}%</small>
    </div>)}
    <button className="text-button spending-add" onClick={onAdd}><Plus size={15} /> Add Expense</button>
  </div>
}

function expenseDateLabel(value: string) {
  const today = todayLocal()
  if (value === today) return 'Today'
  const yesterday = new Date()
  yesterday.setDate(yesterday.getDate() - 1)
  if (value === todayLocalFromDate(yesterday)) return 'Yesterday'
  const [year, month, day] = value.split('-').map(Number)
  return new Intl.DateTimeFormat('en-IN', { day: 'numeric', month: 'short' }).format(new Date(year, month - 1, day))
}

function todayLocalFromDate(date: Date) {
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')}`
}

function RecentTransactions({ transactions, onAdd }: { transactions: TransactionRecord[]; onAdd: () => void }) {
  return <div className="recent-expenses">
    <div className="recent-expense-head"><span>Transaction</span><span>Source / Category</span><span>Date</span><span>Amount</span></div>
    {transactions.map(item => <div className={`recent-expense-row ${item.type === 'income' ? 'income-transaction' : ''}`} key={item.id}>
      <span className="recent-expense-title">{item.type === 'income' ? <span className="expense-category-icon income-transaction-icon"><ArrowDownLeft size={14} /></span> : <CategoryIcon category={item.category} />}<b>{item.note || (item.type === 'income' ? item.source : item.category)}</b></span>
      <span className="recent-expense-category">{item.type === 'income' ? item.source : item.category}</span><span className="recent-expense-date">{expenseDateLabel(item.date)}</span><strong>{item.type === 'income' ? '+' : '−'}{formatRupees(item.amountPaise)}</strong>
    </div>)}
    <button className="text-button recent-add" onClick={onAdd}><Plus size={14} /> Add Expense</button>
  </div>
}

function SummaryCard({ icon, iconTone, title, value, hint }: { icon: ReactNode; iconTone: string; title: string; value: string; hint: string }) {
  return <article className="summary-card"><div className={`summary-icon ${iconTone}`}>{icon}</div><div className="summary-copy"><span>{title}</span><strong>{value}</strong><small>{hint}</small></div><span className="card-corner" /></article>
}

function PanelHeader({ title, subtitle, action, onAction }: { title: string; subtitle: string; action: string; onAction: () => void }) {
  return <div className="panel-header"><div><h2>{title}</h2><p>{subtitle}</p></div><button className="link-button" onClick={onAction}>{action}<ArrowUpRight size={14} /></button></div>
}

function ComingSoon({ page, copy, onBack }: { page: Page; copy: string; onBack: () => void }) {
  const Icon = page === 'Money Forecast' ? TrendingUp : page === 'Savings Goals' ? Target : page === 'AI Money Coach' ? Sparkles : page === 'Transactions' ? ReceiptText : page === 'Settings' ? Settings : Search
  return <div className="coming-page"><div className="coming-card"><div className="coming-icon"><Icon size={27} /></div><span className="eyebrow">PocketWise · Future feature</span><h2>A thoughtful feature is on its way.</h2><p>{copy}</p><div className="coming-note"><ShieldCheck size={16} />No sample data or predictions are shown here.</div><button className="button button-primary" onClick={onBack}>Back to Overview</button></div></div>
}

export default App
