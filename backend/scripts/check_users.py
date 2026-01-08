import sqlite3
con = sqlite3.connect('db.sqlite3')
cur = con.cursor()
try:
    cur.execute('SELECT id, username, is_active FROM users_user')
    rows = cur.fetchall()
    for r in rows:
        print(r)
except Exception as e:
    print('ERR', e)
finally:
    con.close()