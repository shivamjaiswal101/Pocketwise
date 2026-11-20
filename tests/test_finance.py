import os, tempfile
from datetime import date
import pytest

@pytest.fixture
def finance(tmp_path,monkeypatch):
    monkeypatch.setenv('FINANCE_DB_PATH',str(tmp_path/'test.db'))
    from app import database
    database.DB_PATH=tmp_path/'test.db';database.initialize()
    from app import finance as f
    return f

def test_balance_and_edit_delete(finance):
    f=finance
    f.add_transaction('100','income','Income','Allowance')
    f.add_transaction('25.50','expense','Food','Lunch')
    assert f.balance()==7450
    rows=f.list_transactions(); f.update_transaction(rows[0]['id'],'30','expense','Food','Dinner',date.today())
    assert f.balance()==7000
    f.delete_transaction(rows[0]['id']);assert f.balance()==10000

def test_transfer_refund_and_invalid_amount(finance):
    f=finance
    f.add_transaction('200','income','Income','Pay')
    f.add_transaction('20','transfer_out','Other','Savings move')
    f.add_transaction('20','transfer_in','Other','Savings move')
    f.add_transaction('5','refund','Food','Refund')
    assert f.balance()==20500
    with pytest.raises(ValueError):f.to_paise('-1')

def test_goal_and_forecast(finance):
    f=finance;f.add_transaction('50','expense','Food','Lunch')
    f.create_goal('Laptop','1000',date.today());g=f.goals()[0];f.contribute(g['id'],'100')
    assert f.goals()[0]['saved_paise']==10000
    assert f.forecast(7)['history_count']==1

def test_csv_validation_and_duplicates(finance):
    from app.imports import preview_csv,map_rows
    rows,cols=preview_csv('date,description,amount,type\n2026-10-20,Metro,-80,debit\n2026-10-21,Unknown,30,\n')
    result=map_rows(rows,'date','description','amount','type',date_format='%Y-%m-%d')
    assert result[0]['amount_paise']==8000 and result[0]['type']=='expense'
    assert result[1]['error']
    f=finance;f.add_transaction(result[0]['amount_paise'],'expense','Transport',result[0]['description'],result[0]['date'],source='import',fingerprint=result[0]['fingerprint'])
    with pytest.raises(Exception):f.add_transaction(result[0]['amount_paise'],'expense','Transport',result[0]['description'],result[0]['date'],fingerprint=result[0]['fingerprint'])
