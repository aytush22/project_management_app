🏢 WorkFlow — Project Management System

1️⃣ Project Overview

WorkFlow is a project management system built with the MERN Stack (MongoDB, Express, React, Node.js) and TypeScript.

It allows multiple workspaces, projects, and team members with role-based permissions.
A unique feature is the Smart Task Priority AI, which predicts task priority (High, Medium, Low) automatically based on task details and historical patterns.

2️⃣ Features

- Workspace & Project Management:

- Create and manage multiple workspaces

- Create projects and epics within workspaces

- Invite team members via invite links

- Role-based permissions: Owner, Admin, Member

Task Management:

- Full CRUD for tasks

- Assign tasks to team members

- Filter tasks by status, priority, assignee

- Track overdue tasks and team workload

Dashboard & Analytics:

- Visual dashboard showing total, completed, and overdue tasks

- Recent projects and task activity

- Pagination and filtering for easy navigation

Authentication:

- Google Sign-In

- Email and password login

- Session management with secure logout

3️⃣ Tech Stack
Layer Technology
Frontend React.js, TypeScript, Tailwind CSS
Backend Node.js, Express, TypeScript
Database MongoDB (Mongoose)
ML Model Python (scikit-learn, pandas, numpy)
Authentication Google OAuth 2.0, JWT / Cookies
Dev Tools Git, Docker (optional), VS Code

4️⃣ Machine Learning Feature

Smart Task Priority Prediction automates priority assignment using a Random Forest classifier.

Input Features:

- Task title & description (processed with TF-IDF)

- Days until deadline

- Team member workload

- Historical overdue rate

- Average completion delay

- Project type

Benefits:

- Eliminates manual and inconsistent priority assignment

- Improves task management efficiency

- Adapts to team performance patterns over time
