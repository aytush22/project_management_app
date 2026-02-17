"""
Advanced Synthetic Training Data Generator
For Smart Task Priority Prediction

Generates 5000 realistic multi-domain tasks with:
- Text diversity
- Numeric correlations
- Business + Technical tasks
- Controlled noise
- Balanced labels
"""

import csv
import random
import numpy as np

# ---------------------------------------
# CONFIG
# ---------------------------------------
NUM_ROWS = 5000
random.seed(42)
np.random.seed(42)

# ---------------------------------------
# DOMAIN DATA
# ---------------------------------------

components = ["Backend API", "Frontend App", "Mobile App", "Auth Service", "Payment Gateway", "Database", "Data Pipeline"]
services = ["User Service", "Billing Service", "Inventory Service", "Notification Service", "Reporting Service"]
features = ["Checkout", "Login", "Dashboard", "Search", "Analytics", "Profile", "Settings"]
clients = ["Enterprise Client", "Startup Client", "Premium Customer", "Government Client"]
departments = ["Marketing", "Sales", "Finance", "Operations", "HR", "Support"]
project_types = ["SaaS", "Fintech", "E-commerce", "Healthcare", "EdTech", "AI Platform"]
campaigns = ["Q4 Launch", "Black Friday Campaign", "Referral Program", "Email Automation"]
finance_tasks = ["Invoice Processing", "Budget Planning", "Expense Audit"]
hr_tasks = ["Employee Onboarding", "Payroll Review", "Recruitment Drive"]

# ---------------------------------------
# PRIORITY TEMPLATES
# ---------------------------------------

high_templates = [
    "Production outage affecting {service}",
    "Critical issue in {component}",
    "Payment failure reported by {client}",
    "Security breach detected in {component}",
    "Revenue-impacting defect in {feature}",
    "Compliance violation in {department}",
    "Client escalation regarding {feature}",
    "System crash during {feature}",
    "Immediate rollback required for {component}",
    "Audit failure in {department}",
]

medium_templates = [
    "Implement new feature for {feature}",
    "Enhance performance of {component}",
    "Optimize workflow in {department}",
    "Improve analytics reporting for {feature}",
    "Refactor codebase in {component}",
    "Integrate new API into {service}",
    "Automate campaign tracking for {campaign}",
    "Upgrade billing process in {finance}",
    "Improve onboarding process for {hr}",
    "Enhance UI for {feature}",
]

low_templates = [
    "Fix minor typo in documentation",
    "Improve formatting in {component}",
    "Update dependency versions",
    "Enhance internal documentation",
    "Minor UI alignment fix",
    "Refactor variable naming in {component}",
    "Cleanup unused resources",
    "Update design theme slightly",
    "Improve comments in codebase",
    "Organize file structure",
]

# ---------------------------------------
# TEMPLATE GENERATOR
# ---------------------------------------

def generate_title(template):
    return template.format(
        component=random.choice(components),
        service=random.choice(services),
        feature=random.choice(features),
        client=random.choice(clients),
        department=random.choice(departments),
        campaign=random.choice(campaigns),
        finance=random.choice(finance_tasks),
        hr=random.choice(hr_tasks),
    )

# ---------------------------------------
# DESCRIPTION GENERATOR
# ---------------------------------------

def generate_description(title, priority):
    urgency_text = {
        "HIGH": [
            "This issue is affecting multiple stakeholders and requires immediate attention.",
            "Failure to resolve may result in financial or reputational damage.",
            "This task is blocking critical business operations.",
        ],
        "MEDIUM": [
            "This task will improve operational efficiency.",
            "This enhancement supports ongoing optimization efforts.",
            "Important for improving overall system quality.",
        ],
        "LOW": [
            "This is a minor improvement with low business impact.",
            "Can be addressed during routine maintenance.",
            "No immediate operational risk involved.",
        ],
    }
    return f"{title}. {random.choice(urgency_text[priority])}"

# ---------------------------------------
# NUMERIC FEATURE LOGIC
# ---------------------------------------

def generate_numeric_features(priority):
    # Introduce overlaps to force model to use text features
    if priority == "HIGH":
        # High priority usually urgent, but can be up to 30 days
        days = int(np.random.triangular(0, 5, 30))
        # Workload: Massive overlap to neutralize bias.
        workload = int(np.random.triangular(0, 10, 20))
        overdue_rate = round(random.uniform(0.2, 0.9), 2)
        avg_delay = round(random.uniform(1.0, 10.0), 1)

    elif priority == "MEDIUM":
        # Medium overlap with both High and Low
        days = int(np.random.triangular(2, 15, 45))
        # Workload: 0-15
        workload = int(np.random.triangular(0, 5, 15))
        overdue_rate = round(random.uniform(0.0, 0.5), 2)
        avg_delay = round(random.uniform(0.0, 4.0), 1)

    else:
        # Low can also start fairly soon (e.g. minor typo fix today)
        days = int(np.random.triangular(0, 30, 90))
        # Workload: 0-10
        workload = int(np.random.triangular(0, 2, 10))
        overdue_rate = round(random.uniform(0.0, 0.2), 2)
        avg_delay = round(random.uniform(0.0, 2.0), 1)

    # Simulate missing due date (-1) for 20% of tasks
    # This forces the model to learn from text when date is missing
    if random.random() < 0.2:
        days = -1
        
    # Simulate unassigned tasks (workload = 0) for 30% of cases
    # This specifically fixes the "Workload=0 -> Low Priority" bias
    if random.random() < 0.3:
        workload = 0

    return days, workload, overdue_rate, avg_delay

# ---------------------------------------
# DATA GENERATION
# ---------------------------------------

def generate_dataset():
    rows = []
    rows_per_class = NUM_ROWS // 3

    for priority, templates in [
        ("HIGH", high_templates),
        ("MEDIUM", medium_templates),
        ("LOW", low_templates),
    ]:
        for _ in range(rows_per_class):
            template = random.choice(templates)
            title = generate_title(template)
            description = generate_description(title, priority)

            days, workload, overdue_rate, avg_delay = generate_numeric_features(priority)

            rows.append({
                "title": title,
                "description": description,
                "days_until_deadline": days,
                "assignee_active_tasks": workload,
                "assignee_overdue_rate": overdue_rate,
                "assignee_avg_completion_delay": avg_delay,
                "project_type": random.choice(project_types),
                "priority": priority,
            })

    random.shuffle(rows)
    return rows

# ---------------------------------------
# SAVE TO CSV
# ---------------------------------------

def save_to_csv(rows):
    fieldnames = [
        "title",
        "description",
        "days_until_deadline",
        "assignee_active_tasks",
        "assignee_overdue_rate",
        "assignee_avg_completion_delay",
        "project_type",
        "priority"
    ]

    with open("training_data.csv", "w", newline="", encoding="utf-8") as f:
        writer = csv.DictWriter(f, fieldnames=fieldnames)
        writer.writeheader()
        writer.writerows(rows)

    print(f"✅ Generated {len(rows)} rows in training_data.csv")

# ---------------------------------------
# MAIN
# ---------------------------------------

if __name__ == "__main__":
    dataset = generate_dataset()
    save_to_csv(dataset)
