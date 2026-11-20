"""CSV parsing and conservative duplicate-aware import helpers."""
import csv, io
from datetime import datetime
from .finance import to_paise, fingerprint

def preview_csv(data):
    text=data.decode('utf-8-sig') if isinstance(data,bytes) else str(data)
    reader=csv.DictReader(io.StringIO(text))
    if not reader.fieldnames: raise ValueError('CSV needs a header row.')
    return list(reader),list(reader.fieldnames)
def map_rows(rows, date_col, description_col, amount_col, type_col=None, category_col=None, date_format='%Y-%m-%d'):
    out=[]
    for i,row in enumerate(rows,2):
        try:
            rawdate=row[date_col].strip(); d=datetime.strptime(rawdate,date_format).date().isoformat()
            raw=row[amount_col].strip().replace(',','').replace('₹','')
            amt=to_paise(abs(float(raw)))
            typ=(row.get(type_col,'') if type_col else '').strip().lower()
            if typ in ('credit','income','cr'): kind='income'
            elif typ in ('debit','expense','dr'): kind='expense'
            elif raw.startswith('-'): kind='expense'
            elif raw.startswith('+'): kind='income'
            else: raise ValueError('Amount sign or type column is needed to distinguish credit from debit.')
            desc=row[description_col].strip()
            if not desc: raise ValueError('Description is empty.')
            out.append({'row':i,'date':d,'amount_paise':amt,'type':kind,'description':desc,'category':(row.get(category_col,'').strip() if category_col else '') or 'Other','fingerprint':fingerprint(d,amt,desc),'error':''})
        except Exception as e: out.append({'row':i,'error':str(e)})
    return out
