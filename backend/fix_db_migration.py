import sqlite3
import os

db_path = 'db.sqlite3'
if not os.path.exists(db_path):
    print("db.sqlite3 not found")
    exit()

conn = sqlite3.connect(db_path)
cursor = conn.cursor()

user_table = 'users_user'
team_table = 'users_team'
ent_table = 'users_enterprise'

columns_to_add = [
    (user_table, 'language', "varchar(10) DEFAULT 'en-us'"),
    (user_table, 'timezone', "varchar(50) DEFAULT 'UTC'"),
    (user_table, 'theme_preference', "varchar(10) DEFAULT 'LIGHT'"),
    (user_table, 'profile_image', "varchar(100)"), # ImageField is varchar path
    (user_table, 'department', "varchar(100) DEFAULT ''"),
    (user_table, 'job_title', "varchar(100) DEFAULT ''"),
    (user_table, 'task_updates_only', "boolean DEFAULT 0"),
    (user_table, 'is_2fa_enabled', "boolean DEFAULT 0"),
    (user_table, 'otp_secret', "varchar(32)"),
    (user_table, 'backup_codes', "text DEFAULT '[]'"), # JSON
    (user_table, 'ip_whitelist', "text DEFAULT '[]'"),
    (user_table, 'enforce_ip_whitelist', "boolean DEFAULT 0"),
    (user_table, 'failed_login_attempts', "integer DEFAULT 0"),
    (user_table, 'account_locked_until', "datetime"),
    (user_table, 'last_login_ip', "char(39)"), # GenericIP
    
    (team_table, 'slug', "varchar(50)"),
    
    (ent_table, 'custom_domain', "varchar(255)"),
    (ent_table, 'logo', "varchar(100)"),
    (ent_table, 'primary_color', "varchar(7) DEFAULT '#0052CC'"),
    (ent_table, 'secondary_color', "varchar(7) DEFAULT '#172B4D'"),
]

print("Applying manual column fixes...")
for table, col, definition in columns_to_add:
    try:
        # Check existence first to avoid error log spam? 
        # SQLite 'ADD COLUMN' fails if exists.
        cursor.execute(f"ALTER TABLE {table} ADD COLUMN {col} {definition}")
        print(f"Added {table}.{col}")
    except Exception as e:
        if "duplicate column" in str(e).lower():
            pass # print(f"Skipped {table}.{col} (exists)")
        else:
            print(f"Error adding {table}.{col}: {e}")

try:
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS "users_subscriptionplan" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, 
        "name" varchar(50) NOT NULL, 
        "price_monthly" decimal NOT NULL, 
        "max_users" integer NOT NULL, 
        "max_storage_gb" integer NOT NULL, 
        "features" text NOT NULL
    )
    """)
    print("Ensured SubscriptionPlan table.")
    
    cursor.execute("""
    CREATE TABLE IF NOT EXISTS "users_enterprisesubscription" (
        "id" integer NOT NULL PRIMARY KEY AUTOINCREMENT, 
        "start_date" datetime NOT NULL, 
        "end_date" datetime NULL, 
        "is_active" boolean NOT NULL, 
        "billing_email" varchar(254) NOT NULL, 
        "enterprise_id" integer NOT NULL REFERENCES "users_enterprise" ("id") DEFERRABLE INITIALLY DEFERRED, 
        "plan_id" integer NULL REFERENCES "users_subscriptionplan" ("id") DEFERRABLE INITIALLY DEFERRED
    )
    """)
    print("Ensured EnterpriseSubscription table.")
    
except Exception as e:
    print(f"Table creation error: {e}")

conn.commit()
conn.close()
print("Done.")
