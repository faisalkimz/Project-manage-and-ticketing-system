import sqlite3
con = sqlite3.connect('db.sqlite3')
cur = con.cursor()
cur.execute("PRAGMA table_info('users_user')")
print('users_user schema:')
for row in cur.fetchall():
    print(row)

cur.execute("SELECT name, sql FROM sqlite_master WHERE type='table' AND name='users_user'")
print('\nusers_user create SQL:')
print(cur.fetchone())
con.close()