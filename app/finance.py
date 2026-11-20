"""Deterministic financial calculations and validated transaction operations."""
from __future__ import annotations
from datetime import date, timedelta
import re, hashlib
from .database import connect, account_id

CATEGORIES = ['Food','Transport','Education','Shopping','Entertainment','Health','Bills','Personal','Income','Other']
def to_paise(value):
    from decimal import Decimal, InvalidOperation, ROUND_HALF_UP
    try: n=Decimal(str(value))
    except InvalidOperation: raise ValueError('Enter a valid amount.')
    if not n.is_finite() or n<=0 or n>Decimal('100000000'): raise ValueError('Amount must be greater than zero and within a valid range.')
    return int((n*100).quantize(Decimal('1'),rounding=ROUND_HALF_UP))
def money(paise): return f"₹{paise/100:,.2f}"
def add_transaction(amount, kind, category, description, tx_date=None, note='', account=None, source='manual', fingerprint=None):
    if kind not in ('income','expense','refund','transfer_in','transfer_out'): raise ValueError('Choose a valid transaction type.')
    desc=str(description).strip()
    if not desc or len(desc)>180: raise ValueError('Description is required (180 characters maximum).')
    d=str(tx_date or date.today())
    try: date.fromisoformat(d)
    except ValueError: raise ValueError('Date must be valid.')
    amt=amount if isinstance(amount,int) else to_paise(amount)
    if amt<=0: raise ValueError('Amount must be greater than zero.')
    with connect() as db:
        cur=db.execute('INSERT INTO transactions(account_id,amount_paise,type,category,description,date,note,source,fingerprint) VALUES(?,?,?,?,?,?,?,?,?)',(account or account_id(),amt,kind,str(category)[:40],desc,d,str(note)[:500],source,fingerprint))
        return cur.lastrowid
def balance():
    with connect() as db:
        opening=db.execute('SELECT COALESCE(SUM(opening_paise),0) FROM accounts').fetchone()[0]
        delta=db.execute("SELECT COALESCE(SUM(CASE WHEN type IN ('income','refund','transfer_in') THEN amount_paise WHEN type IN ('expense','transfer_out') THEN -amount_paise ELSE 0 END),0) FROM transactions").fetchone()[0]
        return opening+delta
def period_totals(start,end):
    with connect() as db:
        r=db.execute("SELECT COALESCE(SUM(CASE WHEN type='income' THEN amount_paise ELSE 0 END),0) income, COALESCE(SUM(CASE WHEN type='expense' THEN amount_paise ELSE 0 END),0) expenses FROM transactions WHERE date BETWEEN ? AND ?",(str(start),str(end))).fetchone()
        return dict(r)
def list_transactions(start=None,end=None,category=None,kind=None,search=None):
    sql='SELECT t.*,a.name account FROM transactions t JOIN accounts a ON a.id=t.account_id WHERE 1=1'; args=[]
    for col,val in [('date >=',start),('date <=',end),('category =',category),('type =',kind)]:
        if val: sql+=f' AND {col} ?';args.append(str(val))
    if search: sql+=' AND (description LIKE ? OR note LIKE ?)';args += [f'%{search}%',f'%{search}%']
    sql+=' ORDER BY date DESC,id DESC'
    with connect() as db:return [dict(r) for r in db.execute(sql,args)]
def delete_transaction(tid):
    with connect() as db: db.execute('DELETE FROM transactions WHERE id=?',(int(tid),))
def update_transaction(tid, amount, kind, category, description, tx_date, note=''):
    amt=amount if isinstance(amount,int) else to_paise(amount)
    date.fromisoformat(str(tx_date))
    if kind not in ('income','expense','refund','transfer_in','transfer_out') or not str(description).strip(): raise ValueError('Invalid transaction details.')
    with connect() as db: db.execute('UPDATE transactions SET amount_paise=?,type=?,category=?,description=?,date=?,note=?,fingerprint=NULL WHERE id=?',(amt,kind,category,str(description).strip(),str(tx_date),note,int(tid)))
def create_goal(name,target,target_date=None):
    amt=to_paise(target)
    if target_date: date.fromisoformat(str(target_date))
    with connect() as db: db.execute('INSERT INTO goals(name,target_paise,target_date) VALUES(?,?,?)',(name.strip(),amt,str(target_date) if target_date else None))
def goals():
    with connect() as db:return [dict(r) for r in db.execute('SELECT * FROM goals WHERE archived=0 ORDER BY id DESC')]
def contribute(goal_id,amount,when=None,note=''):
    amt=to_paise(amount);d=str(when or date.today());date.fromisoformat(d)
    with connect() as db:
        db.execute('INSERT INTO contributions(goal_id,amount_paise,date,note) VALUES(?,?,?,?)',(int(goal_id),amt,d,note))
        db.execute('UPDATE goals SET saved_paise=saved_paise+? WHERE id=?',(amt,int(goal_id)))
def forecast(days=14, upcoming=0):
    b=balance(); end=date.today()+timedelta(days=days); start=date.today()-timedelta(days=55)
    rows=list_transactions(start=start,end=date.today(),kind='expense')
    daily=sum(r['amount_paise'] for r in rows)/56 if rows else 0
    expected=round(daily*days); known=to_paise(upcoming) if upcoming else 0
    return {'balance':b,'days':days,'expected':expected,'known':known,'typical':b-expected-known,'lower':b-round(expected*.75)-known,'higher':b-round(expected*1.35)-known,'history_count':len(rows)}
def categorize(text):
    t=text.lower()
    for cat,words in {'Food':['lunch','dinner','breakfast','cafe','coffee','food','restaurant'],'Transport':['metro','bus','cab','uber','auto','fuel'],'Education':['book','course','college','tuition','stationery'],'Shopping':['shirt','shoes','amazon','shopping'],'Entertainment':['movie','game','netflix'],'Health':['medicine','doctor','pharmacy'],'Bills':['recharge','electricity','internet']}.items():
        if any(w in t for w in words): return cat
    return 'Other'
def parse_quick(text):
    """Conservative local parser; returns review candidates, never saves."""
    out=[]
    for chunk in re.split(r'\s+and\s+|,\s*',text.strip(),flags=re.I):
        m=re.search(r'(?:₹|rs\.?\s*)?([0-9]+(?:\.[0-9]{1,2})?)',chunk,re.I)
        if not m: continue
        desc=(chunk[:m.start()]+chunk[m.end():]).strip(' ₹,.-') or 'Unclear purchase'
        out.append({'amount':m.group(1),'description':desc,'category':categorize(desc),'type':'expense','date':str(date.today()),'confidence':'Review details'})
    return out
def fingerprint(d,amount,description): return hashlib.sha256(f'{d}|{amount}|{description.strip().lower()}'.encode()).hexdigest()
