"""Reusable, honest first-run dashboard for PocketWise Phase 1."""
from datetime import date
import streamlit as st

# Replaced by a real per-user provider in a later phase. Empty by design.
EMPTY_DATA = {"transactions": [], "income": [], "expenses": [], "goals": [], "balance_paise": 0}
NAV = ["Overview", "Transactions", "Add Expense", "Savings Goals", "Money Forecast", "AI Money Coach", "Settings"]
ICONS = ["⌂", "↔", "＋", "◎", "◷", "✳", "⚙"]

def _styles():
    st.markdown("""<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
:root{--navy:#14213D;--green:#079b83;--mint:#DDF5EE;--ink:#172033;--muted:#6B7280;--line:#E8ECF1;--bg:#F3F6F8}
.stApp{background:var(--bg);color:var(--ink);font-family:'DM Sans',sans-serif}.block-container{padding:1.25rem 1.4rem 2rem;max-width:1440px}
[data-testid="stSidebar"]{background:var(--navy)}[data-testid="stSidebar"] *{color:#f5f8ff}
h1,h2,h3{font-family:'Manrope',sans-serif!important;color:var(--navy);letter-spacing:-.035em}h1{font-size:1.8rem!important;margin-bottom:0!important}h2{font-size:1.18rem!important}
[data-testid="stVerticalBlockBorderWrapper"]{background:white;border-color:var(--line)!important;border-radius:15px;box-shadow:0 4px 16px #14213d07}
.eyebrow{font-size:.69rem;font-weight:700;letter-spacing:.11em;text-transform:uppercase;color:var(--green)}
.stButton>button{border-radius:9px;border-color:var(--line);font-weight:600;min-height:2.55rem}.stButton>button[kind="primary"]{background:var(--green);border-color:var(--green);color:white}
.st-key-hero{background:linear-gradient(105deg,#dff5f0,#e8f7f5);border:1px solid #d6eee8;border-radius:16px;padding:.8rem 1.05rem;margin:.7rem 0 1rem}
.hero-title{font-family:'Manrope',sans-serif;font-size:1.55rem;font-weight:800;color:#14213D;letter-spacing:-.04em}
.hero-copy{font-size:.94rem;color:#33445e;margin:.22rem 0 .65rem}
.metric-card{background:#fff;border:1px solid var(--line);border-radius:14px;padding:1rem;min-height:116px;box-shadow:0 4px 15px #14213d06}
.metric-label{font-size:.84rem;color:#46556d;margin-bottom:.35rem}.metric-value{font:800 1.45rem 'Manrope',sans-serif;color:#101d39}.metric-hint{font-size:.74rem;color:#788397;margin-top:.27rem}
.icon-dot{display:inline-grid;place-items:center;width:34px;height:34px;border-radius:50%;background:#e1f5ef;color:#078d77;margin-right:8px}
.empty-icon{color:#0d9c83;background:#e5f6f1;border-radius:50%;width:38px;height:38px;display:grid;place-items:center;font-size:1.05rem;margin-bottom:.6rem}
.subtle{font-size:.81rem;color:#68768b}
@media(max-width:800px){.block-container{padding:1rem}h1{font-size:1.6rem!important}}
</style>""", unsafe_allow_html=True)

def _open(feature): st.session_state["pocketwise_modal"] = feature

@st.dialog("Coming in a future phase")
def _modal(feature):
    notes={"Add Expense":"Expense entry is planned for Phase 2. No expense has been recorded.","Add Income":"Income tracking will be introduced in a future phase. No sample income has been added.","Savings Goals":"Savings goal creation will arrive in a future phase. You’ll be able to set your own goal and track it."}
    st.write(notes.get(feature,f"{feature} is planned for a future phase."))
    if st.button("Got it",type="primary",use_container_width=True):
        st.session_state.pop("pocketwise_modal",None);st.rerun()

def _empty(title,subtitle,message,detail,button,feature):
    with st.container(border=True):
        st.subheader(title);st.caption(subtitle)
        st.markdown('<div class="empty-icon">◌</div>',unsafe_allow_html=True)
        st.markdown(f"**{message}**")
        st.markdown(f'<div class="subtle">{detail}</div>',unsafe_allow_html=True)
        st.write("")
        if st.button(button,key=f"{title}_{button}",use_container_width=True):
            if feature=="Money Forecast": st.session_state["pocketwise_page"]="Money Forecast"
            else: _open(feature)

def _overview():
    h,r=st.columns([5,1.4],vertical_alignment="center")
    with h:
        st.title("Overview")
        st.markdown('<div class="subtle">Here’s your financial snapshot.</div>',unsafe_allow_html=True)
    with r:
        st.caption(date.today().strftime("%A, %B %d, %Y").replace(" 0", " "))
        a,b=st.columns(2)
        if a.button("♧",help="No notifications yet"):st.toast("You’re all caught up.")
        b.markdown("<div style='background:#e5eaf0;color:#14213D;border-radius:50%;width:32px;height:32px;display:grid;place-items:center;font-weight:700'>♙</div>",unsafe_allow_html=True)
    with st.container(key="hero"):
        a,b=st.columns([4,1.35],vertical_alignment="center")
        with a:
            st.markdown("<div class='hero-title'>Welcome to PocketWise 👋</div><div class='hero-copy'>Let’s get your money organized, one small step at a time.</div><div class='subtle'>Add your first financial details to start understanding your money and building better habits.</div>",unsafe_allow_html=True)
        with b:
            if st.button("＋ Add Your First Expense",type="primary",use_container_width=True):_open("Add Expense")
            if st.button("＋ Add Income",use_container_width=True):_open("Add Income")
    cols=st.columns(3)
    for col,(icon,title,hint) in zip(cols,[("▣","Available Balance","Your balance will appear here."),("↗","Income This Month","Add income to get started."),("▱","Expenses This Month","Your spending will appear here.")]):
        with col:
            st.markdown(f"<div class='metric-card'><div class='metric-label'><span class='icon-dot'>{icon}</span>{title}</div><div class='metric-value'>₹0</div><div class='metric-hint'>{hint}</div></div>",unsafe_allow_html=True)
    st.caption("No financial records yet · ₹0 means nothing has been recorded in PocketWise. It is not a verified bank balance.")
    left,right=st.columns([1.15,1],gap="small")
    with left:
        _empty("Spending Overview","See where your money goes as you record your expenses.","No spending data yet.","Add your first expense to see your spending by category.","＋ Add Expense","Add Expense")
        _empty("Recent Transactions","Recent income and expenses will appear here.","Your transactions will appear here.","Once you start recording income and expenses, you can review them here.","＋ Add Expense","Add Expense")
    with right:
        _empty("Your Savings Goals","Turn something you want into a goal you can work toward.","No savings goals yet.","Create your first goal to start planning for something important.","＋ Create Your First Goal","Savings Goals")
        _empty("Will your money last?","Understand how far your money could go before your next allowance.","Your forecast starts with your financial picture.","Record income and expenses first. PocketWise will estimate future spending in a later phase.","Explore Money Forecast","Money Forecast")
    with st.expander("Getting started · three small steps"):
        st.write("○  Record your first income");st.write("○  Add your first expense");st.write("○  Create your first savings goal")
        x,y,z=st.columns(3)
        if x.button("Add income",key="step_income"): _open("Add Income")
        if y.button("Add expense",key="step_expense"): _open("Add Expense")
        if z.button("Create a goal",key="step_goal"): _open("Savings Goals")

def render_app():
    _styles()
    with st.sidebar:
        st.markdown("# ◈ PocketWise");st.caption("Understand your money.\nControl your spending.");st.divider()
        page=st.radio("Navigate",NAV,format_func=lambda p:f"{ICONS[NAV.index(p)]}  {p}",label_visibility="collapsed")
        st.divider();st.caption("A fresh start · no records yet")
    page=st.session_state.pop("pocketwise_page",page)
    if page=="Overview":_overview()
    else:
        st.markdown('<div class="eyebrow">PocketWise · Future feature</div>',unsafe_allow_html=True);st.title(page)
        text={"Transactions":"Your recorded income and expenses will be easy to review here.","Add Expense":"Expense entry is planned for Phase 2.","Savings Goals":"Savings goal creation is planned for a future phase.","Money Forecast":"Forecasting will arrive once PocketWise can use real income and expense records.","AI Money Coach":"The money coach will arrive in a later phase and use your actual financial information.","Settings":"Account preferences and data controls are planned for a future phase."}.get(page,"This feature is coming soon.")
        with st.container(border=True):
            st.subheader("A thoughtful feature is on its way");st.write(text);st.caption("No sample data or predictions are shown here.")
            if st.button("← Back to Overview",type="primary"):st.session_state["pocketwise_page"]="Overview";st.rerun()
    if feature:=st.session_state.get("pocketwise_modal"):_modal(feature)
