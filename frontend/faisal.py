import pandas as pd
import random
from datetime import datetime, timedelta

# --------------------- Ugandan realistic data ---------------------
male_first = ['John', 'Joseph', 'Moses', 'James', 'Peter', 'David', 'Brian', 'Ronald', 'Geoffrey', 'Patrick', 'Simon', 'Charles', 'Francis', 'Stephen', 'Samuel']
female_first = ['Mary', 'Sarah', 'Grace', 'Faith', 'Esther', 'Rebecca', 'Prossy', 'Brenda', 'Gloria', 'Doreen', 'Lydia', 'Nakato', 'Achen', 'Namukwaya', 'Nantongo']
surnames = ['Akello', 'Okello', 'Mbabazi', 'Apio', 'Asiimwe', 'Nabukeera', 'Nakandi', 'Kiwanuka', 'Mukasa', 'Nabukenya', 'Nalwanga', 'Kato', 'Ssekitto', 'Tumwebaze', 'Byaruhanga']

departments = ['Engineering', 'Finance', 'Human Resources', 'Management', 'Operations', 'Sales']

job_titles = {
    'Engineering': ['Civil Engineer', 'Mechanical Engineer', 'Electrical Engineer', 'Software Engineer', 'Project Engineer'],
    'Finance': ['Accountant', 'Senior Accountant', 'Auditor', 'Financial Analyst', 'Payroll Officer'],
    'Human Resources': ['HR Officer', 'HR Manager', 'Recruitment Specialist', 'Training Coordinator'],
    'Management': ['General Manager', 'Department Manager', 'Project Manager', 'Executive Director'],
    'Operations': ['Operations Manager', 'Logistics Coordinator', 'Procurement Officer', 'Admin Officer'],
    'Sales': ['Sales Executive', 'Sales Manager', 'Business Development Manager', 'Marketing Officer']
}

cities = ['Kampala', 'Entebbe', 'Jinja', 'Gulu', 'Mbarara', 'Fort Portal', 'Mbale', 'Masaka']
districts = ['Kampala', 'Wakiso', 'Mukono', 'Gulu', 'Mbarara', 'Jinja', 'Mbale']
banks = ['Stanbic Bank', 'Centenary Bank', 'Equity Bank', 'Bank of Africa', 'DFCU Bank', 'Absa Bank']

def generate_employee():
    gender = random.choice(['Male', 'Female'])
    first = random.choice(male_first if gender == 'Male' else female_first)
    middle = random.choice([''] * 3 + [random.choice(male_first + female_first)])
    last = random.choice(surnames)
    email = f"{first.lower()}.{last.lower()}@company.co.ug"
    phone = f"+2567{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}"
    dob = f"{random.randint(1975,2005)}-{random.randint(1,12):02d}-{random.randint(1,28):02d}"
    marital = random.choice(['Single', 'Married', 'Divorced', 'Widowed'])
    dept = random.choice(departments)
    job = random.choice(job_titles[dept])
    manager_email = f"manager.{dept.lower().replace(' ', '')}@company.co.ug" if random.random() > 0.35 else ""
    emp_type = random.choices(['Full-time', 'Contract', 'Part-time'], weights=[75, 20, 5])[0]
    emp_status = 'Active'
    join_date = (datetime.now() - timedelta(days=random.randint(180, 4380))).strftime('%Y-%m-%d')
    probation_end = "" if random.random() > 0.35 else (datetime.strptime(join_date, '%Y-%m-%d') + timedelta(days=180)).strftime('%Y-%m-%d')
    create_account = random.choice(['Yes', 'No'])
    username = f"{first.lower()}.{last.lower()}" if create_account == 'Yes' else ""
    password = "Welcome2025!" if create_account == 'Yes' else ""
    access_role = random.choice(['Employee', 'Supervisor', 'Admin']) if create_account == 'Yes' else ""
    basic_salary = random.randint(1500000, 9500000)
    housing = random.choice([0] + [random.randrange(300000, 1800000, 100000)] * 3)
    transport = random.choice([0] + [random.randrange(200000, 900000, 50000)] * 3)
    medical = random.choice([0] + [random.randrange(150000, 600000, 50000)] * 2)
    lunch = random.choice([0] + [random.randrange(100000, 350000, 50000)] * 2)
    other = random.randrange(0, 1200000, 100000) if random.random() > 0.6 else 0
    bank_name = random.choice(banks)
    acc_num = str(random.randint(1000000000, 9999999999))
    branch = random.choice(['Kampala Main', 'Kampala Branch', 'Central Branch'])
    mobile_money = f"+25675{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}" if random.random() > 0.6 else ""
    national_id = f"CM{random.randint(70000000,99999999)}{random.randint(1000,9999)}"
    tin = str(random.randint(1000000000,9999999999)) if random.random() > 0.4 else ""
    nssf = "" if random.random() > 0.55 else f"{random.randint(30000000,99999999)}-{random.randint(10,99):02d}"
    address = f"Plot {random.randint(5,220)}, {random.choice(['Bombo Road','Entebbe Road','Ggaba Road','Old Kampala Road','Nakasero'])}"
    city = random.choice(cities)
    district = random.choice(districts)
    emer_name = f"{random.choice(male_first + female_first)} {random.choice(surnames)}"
    emer_phone = f"+2567{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}{random.randint(0,9)}"
    emer_rel = random.choice(['Spouse','Child','Parent','Sibling','Friend'])

    return {
        'First Name*': first, 'Middle Name': middle, 'Last Name*': last, 'Email*': email, 'Phone': phone,
        'Date of Birth': dob, 'Gender': gender, 'Marital Status': marital, 'Job Title': job, 'Department': dept,
        'Manager Email': manager_email, 'Employment Type': emp_type, 'Employment Status': emp_status,
        'Join Date': join_date, 'Probation End Date': probation_end,
        'Create User Account? (Yes/No)': create_account, 'Username': username, 'Password': password, 'Access Role': access_role,
        'Basic Salary': basic_salary, 'Housing Allowance': housing, 'Transport Allowance': transport,
        'Medical Allowance': medical, 'Lunch Allowance': lunch, 'Other Allowances': other,
        'Bank Name': bank_name, 'Bank Account Number': acc_num, 'Bank Branch': branch,
        'Mobile Money Number': mobile_money, 'National ID*': national_id, 'Passport Number': '',
        'TIN Number': tin, 'NSSF Number': nssf, 'Address': address, 'City': city, 'District': district,
        'Emergency Contact Name': emer_name, 'Emergency Contact Phone': emer_phone,
        'Emergency Contact Relationship': emer_rel, 'Notes': ''
    }

# Generate
random.seed(2025)  # for reproducible results
df = pd.DataFrame([generate_employee() for _ in range(2000)])

# Save
df.to_csv('ugandan_employees_2000.csv', index=False)
df.to_excel('ugandan_employees_2000.xlsx', index=False)  # if your app prefers .xlsx

print("Files created: ugandan_employees_2000.csv and .xlsx")
print("First 3 rows sample:")
print(df.head(3).to_string(index=False))