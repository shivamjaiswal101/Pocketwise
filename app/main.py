from __future__ import annotations
import streamlit as st
from datetime import date, timedelta
from app.database import initialize, connect, account_id
from app.finance import *
from app.imports import preview_csv, map_rows

st.set_page_config(page_title='PocketWise · Student Finance',page_icon='◈',layout='wide',initial_sidebar_state='expanded')
from app.dashboard import render_app
render_app()
st.stop()
initialize()
st.markdown('''<style>
@import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@400;500;600;700&family=Manrope:wght@500;600;700;800&display=swap');
html,body,[class*="css"]{font-family:'DM Sans',sans-serif}.stApp{background:#f5f7f5;color:#152820}
[data-testid="stSidebar"]{background:#132b25;color:#edf5ef}[data-testid="stSidebar"] *{color:#edf5ef}
h1,h2,h3{font-family:'Manrope',sans-serif!important;letter-spacing:-.035em} h1{font-size:2.25rem}
[data-testid="stMetric"]{background:white;border:1px solid #e3ebe5;border-radius:16px;padding:20px;box-shadow:0 4px 18px #16382a08}
div[data-testid="stForm"]{background:white;border:1px solid #e3ebe5;border-radius:18px;padding:22px}
.eyebrow{color:#51806a;text-transform:uppercase;letter-spacing:.12em;font-weight:700;font-size:.75rem}
.stButton>button[kind="primary"]{background:#1c7859;border-color:#1c7859}
</style>''',unsafe_allow_html=True)
with st.sidebar:
    st.markdown('## ◈ Pennywise')
    st.caption('Your money, made clearer.')
    page=st.radio('Navigate',['Dashboard','Transactions','Add expense','Savings goals','Money forecast','AI money coach','Settings'],label_visibility='collapsed')
    st.divider();st.caption('Private to this device · INR')
today=date.today(); month_start=today.replace(day=1)
def header(kicker,title,caption=''):
    st.markdown(f'<div class="eyebrow">{kicker}</div>',unsafe_allow_html=True);st.title(title)
    if caption: st.caption(caption)
def tx_form(key, kind='expense'):
    with st.form(key):
        a,b=st.columns(2); amount=a.number_input('Amount (₹)',min_value=0.01,step=10.0,format='%.2f'); cat=b.selectbox('Category',CATEGORIES)
        desc=st.text_input('Description'); d=st.date_input('Date',today); note=st.text_input('Note (optional)')
        ok=st.form_submit_button('Save transaction',type='primary',use_container_width=True)
    if ok:
        try: add_transaction(amount,kind,cat,desc,d,note);st.success('Saved. Your balance and summaries are up to date.');st.rerun()
        except Exception as e: st.error(str(e))
if page=='Dashboard':
    header('Your money at a glance','Good money habits start here.','A clear view of your recorded finances.')
    t=period_totals(month_start,today); avail=balance()
    c=st.columns(3);c[0].metric('Available balance',money(avail));c[1].metric('Income this month',money(t['income']));c[2].metric('Spent this month',money(t['expenses']))
    st.write('')
    left,right=st.columns([1.25,1])
    with left:
        st.subheader('Recent activity')
        recent=list_transactions()[:6]
        if recent:
            for x in recent: st.markdown(f"**{x['description']}** · {x['category']}  \n{x['date']} · {x['account']} <span style='float:right'><b>{'+' if x['type']=='income' else '−'}{money(x['amount_paise'])}</b></span>",unsafe_allow_html=True);st.divider()
        else: st.info('Your ledger is ready. Add your first income or expense to see a live balance here.')
    with right:
        st.subheader('A useful next step')
        if not recent: st.write('Start with one recent expense. You can add it manually or describe it in your own words.')
        elif t['expenses']>t['income'] and t['income']>0: st.warning('Recorded spending is higher than income so far this month. Review your transactions and upcoming needs.')
        else: st.success('You’re building a clearer picture. Review your recorded transactions before your next payday.')
        if goals():
            st.subheader('Savings in progress')
            for g in goals(): st.write(f"**{g['name']}** · {money(g['saved_paise'])} of {money(g['target_paise'])}");st.progress(min(1,g['saved_paise']/g['target_paise']))
    a,b,c=st.columns(3)
    if a.button('＋ Add expense',use_container_width=True): st.session_state.go_add=True
    if b.button('＋ Set a savings goal',use_container_width=True): st.session_state.go_goal=True
    if c.button('View money forecast',use_container_width=True): st.session_state.go_forecast=True
    if st.session_state.pop('go_add',False): st.session_state.page_redirect='Add expense'
    if st.session_state.pop('go_goal',False): st.session_state.page_redirect='Savings goals'
    if st.session_state.pop('go_forecast',False): st.session_state.page_redirect='Money forecast'
elif page=='Transactions':
    header('Your ledger','Transactions','Search and review recorded income and spending.')
    x,y,z=st.columns([2,1,1]);q=x.text_input('Search description');kind=y.selectbox('Type',['All','income','expense','refund','transfer_in','transfer_out']);cat=z.selectbox('Category',['All']+CATEGORIES)
    rows=list_transactions(search=q,kind=None if kind=='All' else kind,category=None if cat=='All' else cat)
    if rows:
        for r in rows:
            a,b,c=st.columns([3,2,1]);a.markdown(f"**{r['description']}** · {r['category']}  \n{r['date']} · {r['type']}");b.write(money(r['amount_paise']));
            with c:
                if st.button('Delete',key=f"del{r['id']}"): st.session_state.confirm_delete=r['id']
        if st.session_state.get('confirm_delete'):
            tid=st.session_state.confirm_delete;st.warning(f'Delete transaction #{tid}? This cannot be undone.')
            ca,cb=st.columns(2)
            if ca.button('Confirm delete',type='primary'): delete_transaction(tid);del st.session_state['confirm_delete'];st.rerun()
            if cb.button('Keep it'): del st.session_state['confirm_delete'];st.rerun()
    else: st.info('No transactions match. Try another filter or add a transaction.')
    with st.expander('Import a CSV statement'):
        file=st.file_uploader('Choose a CSV file',type='csv')
        if file:
            try:
                rows,cols=preview_csv(file.getvalue()); st.caption('Map columns. Rows without a clear credit/debit sign or type are rejected for review.')
                a,b,c=st.columns(3);dc=a.selectbox('Date column',cols);desc=b.selectbox('Description column',cols);ac=c.selectbox('Amount column',cols)
                tc=st.selectbox('Credit/debit type column (optional)', ['—']+cols);cc=st.selectbox('Category column (optional)',['—']+cols);fmt=st.selectbox('Date format',['%Y-%m-%d','%d/%m/%Y','%m/%d/%Y'])
                mapped=map_rows(rows,dc,desc,ac,None if tc=='—' else tc,None if cc=='—' else cc,fmt);st.dataframe(mapped,use_container_width=True)
                good=[r for r in mapped if not r['error']]
                if st.button(f'Import {len(good)} valid rows',disabled=not good):
                    with connect() as db:
                        batch=db.execute('INSERT INTO import_batches(filename) VALUES(?)',(file.name,)).lastrowid;count=0
                        for r in good:
                            try: db.execute("INSERT INTO transactions(account_id,amount_paise,type,category,description,date,source,fingerprint) VALUES(?,?,?,?,?,?,?,?)",(account_id(),r['amount_paise'],r['type'],r['category'],r['description'],r['date'],'import',r['fingerprint']));count+=1
                            except Exception: pass
                        db.execute('UPDATE import_batches SET imported_count=? WHERE id=?',(count,batch))
                    st.success(f'Imported {count} rows. Duplicates were skipped.');st.rerun()
            except Exception as e: st.error(str(e))
elif page=='Add expense':
    header('Capture it while it’s fresh','Add a transaction','Manual entry and local parsing use the same validated ledger.')
    tabs=st.tabs(['Quick add','Describe it'])
    with tabs[0]: tx_form('expense_form')
    with tabs[1]:
        phrase=st.text_area('Describe one or more transactions','',placeholder='Spent ₹180 on lunch at college and ₹80 for the metro')
        if st.button('Extract for review',type='primary'):
            st.session_state.candidates=parse_quick(phrase)
            if not st.session_state.candidates: st.warning('Could not find an amount. Try a phrase with a number, such as “₹180 lunch”.')
        for i,item in enumerate(st.session_state.get('candidates',[])):
            with st.form(f'candidate{i}'):
                st.caption('Review before saving · local rule-based parsing')
                a,b,c=st.columns(3);amt=a.number_input('Amount (₹)',value=float(item['amount']),min_value=.01,key=f'a{i}');desc=b.text_input('Description',value=item['description'],key=f'd{i}');cat=c.selectbox('Category',CATEGORIES,index=CATEGORIES.index(item['category']) if item['category'] in CATEGORIES else 9,key=f'c{i}')
                dt=st.date_input('Date',today,key=f't{i}');save=st.form_submit_button('Save this transaction')
            if save:
                try: add_transaction(amt,'expense',cat,desc,dt,source='natural-language');st.success('Saved.');st.session_state.candidates=[];st.rerun()
                except Exception as e: st.error(str(e))
elif page=='Savings goals':
    header('Make room for what matters','Savings goals','Progress is a record you enter; contributions do not move bank money.')
    with st.form('goal'):
        name=st.text_input('Goal name',placeholder='New laptop');target=st.number_input('Target (₹)',min_value=.01,step=500.);due=st.date_input('Target date',today+timedelta(days=180));ok=st.form_submit_button('Create goal',type='primary')
    if ok:
        try:create_goal(name,target,due);st.success('Goal created.');st.rerun()
        except Exception as e:st.error(str(e))
    for g in goals():
        st.subheader(g['name']);st.write(f"{money(g['saved_paise'])} saved · {money(max(0,g['target_paise']-g['saved_paise']))} to go by {g['target_date'] or 'no target date'}");st.progress(min(1,g['saved_paise']/g['target_paise']))
        if g['target_date'] and g['saved_paise']<g['target_paise']:
            months=max(1,(date.fromisoformat(g['target_date'])-today).days//30);st.caption(f"About {money((g['target_paise']-g['saved_paise'])//months)} per month to reach this date.")
        with st.form(f"contrib{g['id']}"):
            x=st.number_input('Record a contribution (₹)',min_value=.01,key=f"amount{g['id']}");y=st.form_submit_button('Add contribution')
        if y:
            try:contribute(g['id'],x);st.success('Contribution recorded.');st.rerun()
            except Exception as e:st.error(str(e))
elif page=='Money forecast':
    header('Plan to your next payday','Money forecast','A transparent estimate from your recent recorded spending, not a promise.')
    a,b=st.columns(2);days=a.number_input('Days to next income',min_value=1,max_value=180,value=14);known=b.number_input('Known necessary expenses before then (₹)',min_value=0.,step=100.)
    f=forecast(days,known);c=st.columns(3);c[0].metric('Available now',money(f['balance']));c[1].metric('Typical projected spending',money(f['expected']));c[2].metric('Estimated after known costs',money(f['typical']))
    st.subheader('Possible scenarios');st.write(f"Lower spending: **{money(f['lower'])}** · Typical: **{money(f['typical'])}** · Higher spending: **{money(f['higher'])}**")
    if f['history_count']<7: st.warning('There is little recent history, so this estimate may not reflect your real routine.')
    if f['typical']<0: st.error('Your typical estimate goes below zero. Consider reducing flexible spending or checking whether any income arrives sooner.')
    else: st.success('The typical estimate stays above zero. Keep some room for unexpected costs.')
    st.caption(f"Baseline: average daily recorded expenses from the last 56 days × {days} days, plus the upcoming expense you entered. Scenarios scale projected spending to 75% and 135%; they are not confidence intervals. {f['history_count']} expense records in the window.")
elif page=='AI money coach':
    header('A helpful read of your finances','Money coach','Answers use deterministic totals from this ledger. No external AI service is configured.')
    q=st.chat_input('Ask about spending, balance, or your goals…')
    if q:
        st.chat_message('user').write(q);ans=q.lower()
        if any(w in ans for w in ['balance','available','have']): reply=f"Your recorded available balance is {money(balance())}. This includes the opening account balance and recorded income, expenses, refunds and transfers."
        elif 'goal' in ans or 'save' in ans:
            gs=goals();reply='You have no active savings goals yet.' if not gs else 'Your active goals: '+ '; '.join(f"{g['name']} is {money(g['saved_paise'])} of {money(g['target_paise'])}" for g in gs)+'.'
        elif any(w in ans for w in ['spend','expense','where']):
            rows=list_transactions(start=month_start,end=today,kind='expense'); totals={}
            for r in rows:totals[r['category']]=totals.get(r['category'],0)+r['amount_paise']
            reply='No expenses recorded this month yet.' if not totals else f"This month, {max(totals,key=totals.get)} is your largest recorded category at {money(max(totals.values()))}. Total recorded spending is {money(sum(totals.values()))}."
        else: reply='I can summarize your recorded balance, spending, and goals. Try asking “Where did I spend most this month?”'
        st.chat_message('assistant').write(reply)
    else: st.info('Try “What is my available balance?”, “Where did I spend most this month?”, or “How are my savings goals doing?”')
elif page=='Settings':
    header('Your data, on your device','Settings','This single-user local version stores records in SQLite on this computer.')
    st.metric('Available balance',money(balance()))
    st.subheader('Opening balance')
    with st.form('opening'):
        current=0
        with connect() as db: current=db.execute('SELECT opening_paise FROM accounts WHERE id=?',(account_id(),)).fetchone()[0]
        v=st.number_input('Opening balance (₹)',value=current/100,step=100.);ok=st.form_submit_button('Save opening balance')
    if ok:
        with connect() as db:db.execute('UPDATE accounts SET opening_paise=? WHERE id=?',(to_paise(v) if v>0 else 0,account_id()))
        st.success('Opening balance saved.');st.rerun()
    with connect() as db: batches=[dict(r) for r in db.execute('SELECT * FROM import_batches ORDER BY imported_at DESC')]
    st.subheader('Import history')
    st.write(batches if batches else 'No CSV imports yet.')
    st.subheader('Data portability')
    rows=list_transactions()
    import pandas as pd
    st.download_button('Export transactions as CSV',pd.DataFrame(rows).to_csv(index=False).encode(),file_name='transactions.csv',mime='text/csv',disabled=not rows)
    st.caption('Authentication and cloud sync are not included. Do not use this local MVP for multiple users or public deployment.')
