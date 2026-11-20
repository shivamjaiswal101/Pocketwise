import { useState, type FormEvent, type ReactNode } from 'react'
import {
  ArrowLeft, ArrowRight, BarChart3, Check, Eye, EyeOff,
  GraduationCap, Leaf, LockKeyhole, Mail, ShieldCheck, Sparkles, Target, UserRound,
  Wallet, X,
} from 'lucide-react'
import './auth.css'

type Navigate = (path: string) => void
type AuthPageProps = { navigate: Navigate; onTemporaryPreview?: (name: string) => void }
type Feedback = { kind: 'error' | 'info'; text: string } | null

function Brand({ compact = false }: { compact?: boolean }) {
  return <div className={`auth-brand ${compact ? 'compact' : ''}`}><span className="auth-brand-mark"><Leaf size={20} /></span><span><b>PocketWise</b><small>Student Finance</small></span></div>
}

function AuthFrame({ children, aside, className = '' }: { children: ReactNode; aside?: ReactNode; className?: string }) {
  return <main className={`auth-frame ${className}`}><section className="auth-form-side"><Brand compact /><div className="auth-form-wrap">{children}</div></section>{aside && <aside className="auth-benefit-side">{aside}</aside>}</main>
}

function BenefitList() {
  return <div className="benefit-list"><div><span><Wallet size={17} /></span><p>Track your expenses easily</p></div><div><span><Target size={17} /></span><p>Set and achieve savings goals</p></div><div><span><Sparkles size={17} /></span><p>Personalized insights <small>Coming soon</small></p></div><div><span><ShieldCheck size={17} /></span><p>Your data stays yours</p></div></div>
}

function AuthAside({ title, text, children }: { title: string; text: string; children?: ReactNode }) {
  return <div className="auth-aside-content"><div className="aside-art">{children ?? <div className="lock-art"><LockKeyhole size={38} /></div>}</div><h2>{title}</h2><p>{text}</p></div>
}

function Field({ label, value, onChange, placeholder, icon, type = 'text', error, autoComplete, trailing }: {
  label: string; value: string; onChange: (value: string) => void; placeholder: string; icon: ReactNode; type?: string; error?: string; autoComplete?: string; trailing?: ReactNode
}) {
  const id = `field-${label.toLowerCase().replaceAll(' ', '-')}`
  return <div className="auth-field"><label htmlFor={id}>{label}</label><div className={`input-wrap ${error ? 'input-error' : ''}`}><span className="field-icon">{icon}</span><input id={id} type={type} value={value} onChange={e => onChange(e.target.value)} placeholder={placeholder} autoComplete={autoComplete} aria-invalid={!!error} aria-describedby={error ? `${id}-error` : undefined} />{trailing}</div>{error && <span className="field-error" id={`${id}-error`}><X size={13} />{error}</span>}</div>
}

function PasswordField(props: Omit<Parameters<typeof Field>[0], 'type' | 'trailing'>) {
  const [visible, setVisible] = useState(false)
  return <Field {...props} type={visible ? 'text' : 'password'} trailing={<button type="button" className="password-toggle" aria-label={visible ? 'Hide password' : 'Show password'} onClick={() => setVisible(!visible)}>{visible ? <EyeOff size={17} /> : <Eye size={17} />}</button>} />
}

function AuthHeading({ title, subtitle }: { title: string; subtitle: string }) {
  return <div className="auth-heading"><h1>{title}</h1><p>{subtitle}</p></div>
}

export function WelcomePage({ navigate, onTemporaryPreview }: AuthPageProps) {
  return <main className="welcome-layout">
    <section className="welcome-dark">
      <Brand />
      <div className="welcome-dark-copy"><span className="auth-kicker">For students, by students</span><h1>Understand your money.<br /><em>Control your spending.</em></h1><p>A simple and smart way for students to manage their money, track expenses, and build better financial habits.</p></div>
      <div className="welcome-benefits"><div><span><Wallet size={16} /></span>Track your expenses</div><div><span><Target size={16} /></span>Set savings goals</div><div><span><BarChart3 size={16} /></span>Plan for a better future</div></div>
      <div className="welcome-footer"><i /><i /><i /></div>
    </section>
    <section className="welcome-light">
      <div className="welcome-visual-wrap"><div className="welcome-top-chip"><GraduationCap size={15} /><span>For students<br />by students</span></div>
        <div className="finance-visual" aria-label="Illustration of PocketWise planning tools" role="img">
          <div className="visual-card visual-card-a"><div className="visual-card-title"><span className="mini-dot" />Your spending</div><div className="visual-bars"><i /><i /><i /><i /><i /></div></div>
          <div className="visual-orb"><Wallet size={27} /></div>
          <div className="visual-plant"><i /><i /><i /><b /></div>
          <div className="visual-card visual-card-b"><Target size={18} /><span>A goal worth saving for</span><b /></div>
          <div className="visual-floor" />
        </div>
      </div>
      <div className="welcome-light-copy"><h2>Take control of your<br />financial journey</h2><p>Start today and build better money habits for a brighter tomorrow.</p><div className="welcome-buttons"><button className="auth-primary" onClick={() => navigate('/register')}>Create an Account <ArrowRight size={16} /></button><button className="auth-secondary" onClick={() => navigate('/login')}>Login to Your Account</button>{onTemporaryPreview && <button className="temporary-link" onClick={() => onTemporaryPreview('Student')}>Explore a temporary preview <ArrowRight size={14} /></button>}</div></div>
    </section>
  </main>
}

export function RegisterPage({ navigate, onTemporaryPreview }: AuthPageProps) {
  const [name, setName] = useState(''), [email, setEmail] = useState(''), [password, setPassword] = useState(''), [confirm, setConfirm] = useState(''), [terms, setTerms] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({}), [feedback, setFeedback] = useState<Feedback>(null), [policy, setPolicy] = useState('')
  const submit = (e: FormEvent) => {
    e.preventDefault(); const next: Record<string, string> = {}
    if (!name.trim()) next.name = 'Enter your full name.'
    if (!email.trim()) next.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Create a password.'
    else if (password.length < 8) next.password = 'Use at least 8 characters.'
    if (!confirm) next.confirm = 'Confirm your password.'
    else if (confirm !== password) next.confirm = 'Passwords do not match.'
    if (!terms) next.terms = 'Please agree before continuing.'
    setErrors(next); setFeedback(Object.keys(next).length ? { kind: 'error', text: 'Please review the highlighted fields.' } : { kind: 'info', text: 'Registration isn’t connected yet. No account was created and your details were not sent or saved.' })
  }
  return <AuthFrame className="register-frame" aside={<><Brand compact /><BenefitList /></>}>
    <AuthHeading title="Create Your Account" subtitle="Join PocketWise and start your financial journey." />
    <form className="auth-form" onSubmit={submit} noValidate>
      <Field label="Full Name" value={name} onChange={setName} placeholder="Enter your full name" icon={<UserRound size={16} />} autoComplete="name" error={errors.name} />
      <Field label="Email Address" value={email} onChange={setEmail} placeholder="Enter your email address" icon={<Mail size={16} />} autoComplete="email" error={errors.email} />
      <PasswordField label="Password" value={password} onChange={setPassword} placeholder="Create a strong password" icon={<LockKeyhole size={16} />} autoComplete="new-password" error={errors.password} />
      <PasswordField label="Confirm Password" value={confirm} onChange={setConfirm} placeholder="Confirm your password" icon={<LockKeyhole size={16} />} autoComplete="new-password" error={errors.confirm} />
      <div className="terms-row"><label><input type="checkbox" checked={terms} onChange={e => setTerms(e.target.checked)} /><span className="custom-check"><Check size={12} /></span><span>I agree to the</span></label><button type="button" className="inline-link" onClick={() => setPolicy('Terms of Service')}>Terms of Service</button><span>and</span><button type="button" className="inline-link" onClick={() => setPolicy('Privacy Policy')}>Privacy Policy</button></div>
      {errors.terms && <span className="field-error terms-error">{errors.terms}</span>}
      <button className="auth-primary submit-button" type="submit">Create Account <ArrowRight size={16} /></button>
      {feedback && <FeedbackBox feedback={feedback} />}
      {feedback?.kind === 'info' && Object.keys(errors).length === 0 && <><button type="button" className="auth-back temporary-preview-button" onClick={() => onTemporaryPreview?.(name.trim() || 'Student')}>Continue in temporary preview <ArrowRight size={14} /></button><span className="temporary-note">Uses your display name for this tab only. Your password is discarded.</span><button type="button" className="auth-back" onClick={() => navigate('/verify-email')}>Preview email verification screen <ArrowRight size={14} /></button></>}
    </form>
    <div className="auth-divider"><span>or register with</span></div>
    <div className="social-row"><button type="button" onClick={() => setFeedback({ kind: 'info', text: 'Social sign-in is not configured.' })}><b className="google-g">G</b>Google</button><button type="button" onClick={() => setFeedback({ kind: 'info', text: 'Social sign-in is not configured.' })}><b className="apple-mark">●</b>Apple</button></div>
    <p className="auth-switch">Already have an account? <button onClick={() => navigate('/login')}>Login</button></p>
    {policy && <PolicyDialog title={policy} onClose={() => setPolicy('')} />}
  </AuthFrame>
}

export function LoginPage({ navigate, onTemporaryPreview }: AuthPageProps) {
  const [email, setEmail] = useState(''), [password, setPassword] = useState(''), [remember, setRemember] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({}), [feedback, setFeedback] = useState<Feedback>(null)
  const submit = (e: FormEvent) => {
    e.preventDefault(); const next: Record<string, string> = {}
    if (!email.trim()) next.email = 'Enter your email address.'
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) next.email = 'Enter a valid email address.'
    if (!password) next.password = 'Enter your password.'
    setErrors(next); setFeedback(Object.keys(next).length ? { kind: 'error', text: 'Please review the highlighted fields.' } : { kind: 'info', text: 'Authentication isn’t connected yet, so no login was attempted.' })
  }
  return <AuthFrame className="login-frame" aside={<><Brand compact /><AuthAside title="Welcome back!" text="Let’s continue building your smarter financial future together." /></>}>
    <AuthHeading title="Welcome Back" subtitle="Login to continue your financial journey." />
    <form className="auth-form login-form" onSubmit={submit} noValidate>
      <Field label="Email Address" value={email} onChange={setEmail} placeholder="Enter your email address" icon={<Mail size={16} />} autoComplete="email" error={errors.email} />
      <PasswordField label="Password" value={password} onChange={setPassword} placeholder="Enter your password" icon={<LockKeyhole size={16} />} autoComplete="current-password" error={errors.password} />
      <div className="login-options"><label className="remember-label"><input type="checkbox" checked={remember} onChange={e => setRemember(e.target.checked)} /><span className="custom-check"><Check size={12} /></span>Remember me</label><button type="button" className="inline-link" onClick={() => navigate('/forgot-password')}>Forgot Password?</button></div>
      <button className="auth-primary submit-button" type="submit">Login <ArrowRight size={16} /></button>
      {feedback && <FeedbackBox feedback={feedback} />}
      {feedback?.kind === 'info' && Object.keys(errors).length === 0 && <><button type="button" className="auth-back temporary-preview-button" onClick={() => onTemporaryPreview?.(email.split('@')[0] || 'Student')}>Continue in temporary preview <ArrowRight size={14} /></button><span className="temporary-note">Preview only. Your email and password are not saved.</span></>}
    </form>
    <div className="auth-divider"><span>or login with</span></div>
    <div className="social-row"><button type="button" onClick={() => setFeedback({ kind: 'info', text: 'Social sign-in is not configured.' })}><b className="google-g">G</b>Google</button><button type="button" onClick={() => setFeedback({ kind: 'info', text: 'Social sign-in is not configured.' })}><b className="apple-mark">●</b>Apple</button></div>
    <p className="auth-switch">Don’t have an account? <button onClick={() => navigate('/register')}>Create Account</button></p>
  </AuthFrame>
}

export function VerifyEmailPage({ navigate }: AuthPageProps) {
  const [code, setCode] = useState(''), [feedback, setFeedback] = useState<Feedback>(null)
  const submit = (e: FormEvent) => { e.preventDefault(); setFeedback(code.length !== 6 || !/^\d{6}$/.test(code) ? { kind: 'error', text: 'Enter all 6 digits to continue.' } : { kind: 'info', text: 'Email verification isn’t connected. The code was not checked.' }) }
  return <AuthFrame className="compact-auth" aside={<AuthAside title="Just one more step!" text="Email verification helps keep your account secure. Email delivery is not configured yet." />}>
    <AuthHeading title="Verify Your Email" subtitle="We’ll send a verification code to your registered email address to help keep your account secure." />
    <form className="auth-form" onSubmit={submit} noValidate><div className="auth-field"><label htmlFor="otp-code">6-digit verification code</label><input id="otp-code" className="otp-field" inputMode="numeric" autoComplete="one-time-code" maxLength={6} value={code} onChange={e => setCode(e.target.value.replace(/\D/g, '').slice(0, 6))} placeholder="· · · · · ·" aria-label="6-digit verification code" /></div><p className="inline-note"><ShieldCheck size={15} />No email will be sent until an authentication service is connected.</p><button className="auth-primary submit-button" type="submit">Verify &amp; Continue <ArrowRight size={16} /></button>{feedback && <FeedbackBox feedback={feedback} />}</form>
    <div className="verification-actions"><button className="inline-link" onClick={() => setFeedback({ kind: 'info', text: 'Email delivery is not configured, so no new code was sent.' })}>Resend Code</button><button className="auth-back" onClick={() => navigate('/register')}><ArrowLeft size={14} /> Back to Registration</button></div>
  </AuthFrame>
}

export function ForgotPasswordPage({ navigate }: AuthPageProps) {
  const [email, setEmail] = useState(''), [error, setError] = useState(''), [feedback, setFeedback] = useState<Feedback>(null)
  const submit = (e: FormEvent) => { e.preventDefault(); const msg = !email.trim() ? 'Enter your email address.' : !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) ? 'Enter a valid email address.' : ''; setError(msg); setFeedback(msg ? { kind: 'error', text: 'Please review the email address.' } : { kind: 'info', text: 'Password recovery isn’t connected. No reset email was sent.' }) }
  return <AuthFrame className="compact-auth" aside={<AuthAside title="Forgot your password?" text="No worries. Password recovery will be available when account services are connected." />}>
    <AuthHeading title="Reset Your Password" subtitle="Enter your email address and we’ll help you get back into your account." />
    <form className="auth-form login-form" onSubmit={submit} noValidate><Field label="Email Address" value={email} onChange={setEmail} placeholder="Enter your email address" icon={<Mail size={16} />} autoComplete="email" error={error} /><button className="auth-primary submit-button" type="submit">Send Reset Link <ArrowRight size={16} /></button>{feedback && <FeedbackBox feedback={feedback} />}</form>
    <button className="auth-back centered-back" onClick={() => navigate('/login')}><ArrowLeft size={14} /> Back to Login</button>
  </AuthFrame>
}

export function RegisterSuccessPage({ navigate }: AuthPageProps) {
  return <main className="success-page"><Brand compact /><div className="success-card"><div className="success-check"><Check size={29} /></div><span className="auth-kicker">Development preview only</span><h1>Account Created Successfully!</h1><p>This is a preview of the future success screen. No account was created or verified because PocketWise authentication is not configured.</p><div className="warning-note"><ShieldCheck size={16} />No authenticated session is available.</div><button className="auth-primary disabled-button" disabled title="Available after authentication is implemented">Go to Dashboard <ArrowRight size={16} /></button><button className="auth-back centered-back" onClick={() => navigate('/welcome')}><ArrowLeft size={14} /> Back to Welcome</button></div></main>
}

function FeedbackBox({ feedback }: { feedback: NonNullable<Feedback> }) { return <div className={`auth-feedback ${feedback.kind}`} role="status">{feedback.kind === 'error' ? <X size={16} /> : <ShieldCheck size={16} />}<span>{feedback.text}</span></div> }

function PolicyDialog({ title, onClose }: { title: string; onClose: () => void }) {
  return <div className="policy-overlay" role="presentation" onMouseDown={e => { if (e.target === e.currentTarget) onClose() }}><div className="policy-dialog" role="dialog" aria-modal="true"><button className="policy-close" onClick={onClose} aria-label="Close"><X size={17} /></button><h2>{title}</h2><p>This policy page is a placeholder and has not been published. It will be available before account registration is enabled.</p><button className="auth-primary" onClick={onClose}>Close</button></div></div>
}
