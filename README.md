# SE_4: Pergas Integrated Members Engagement System

A comprehensive digital portal designed to unify the member experience for the Singapore Islamic Scholars and Religious Teachers Association (Pergas). This system replaces fragmented manual communication channels (such as emails, Telegram, and physical cards) with a centralized, secure digital environment.

---

##  Project Overview

The **Pergas Integrated Members Engagement System** delivers an intuitive digital solution split into two primary interfaces: a mobile-responsive portal for registered members and a backend administrative management dashboard for Pergas staff. The application streamlines member registration, verification, event discovery, and benefits management while strictly maintaining data integrity and compliance with local privacy frameworks.

### Core Objectives
* **Centralized Access:** Replace disparate, manual touchpoints with a single, highly secure web application.
* **Digital Verification:** Generate a live digital membership card with scannable QR/barcodes to verify eligibility at partner merchants.
* **Member Engagement:** Provide an interactive event calendar, integrated external RSVP options, partner merchant directory, and moderated community discussion threads.
* **Administrative Efficiency:** Empower Pergas staff with an operational dashboard to publish announcements, audit logs, verify records, and analyze engagement.

---

##  System Scope & Requirements

### Use Case Mapping

| UC ID | Use Case Name | Primary Actor | Secondary / System Actor | Description / Functional Scope | Associated FRs |
| :--- | :--- | :--- | :--- | :--- | :--- |
| **UC-01** | User Auth & Session Lifecycle | Member / Admin | Pergas Member Database | Secure login, role validation, and session logout. | FR-02, 03, 15, 16, 17, 23 |
| **UC-02** | Account Sync & Registration | Member | Pergas Member Database | Pre-verified paid members activate profiles. | FR-01 |
| **UC-03** | View Profile & Digital E-Card | Member | Partner Merchant | Displays details and renders live validation QR/barcode. | FR-04, 05, 13 |
| **UC-04** | Browse Events & External RSVP | Member | Zoho Backstage | Calendar/list view with deep-links for registration. | FR-06, 07, 08 |
| **UC-05** | Discover Partner Benefits | Member | Map Integration Service | Search/filter discounts via list or interactive SG map. | FR-09, 10 |
| **UC-06** | View Announcements & Engage | Member | None | Official announcement feeds and moderated threads. | FR-11, 12 |
| **UC-07** | Receive System Notifications | Member | Notification Engine | Automated push alerts for renewals and event updates. | FR-14 |
| **UC-08** | Admin Content Management | Admin | Pergas Member Database | Create, edit, publish, or archive platform content. | FR-18, 19 |
| **UC-09** | Admin Directory & Audit Logs | Admin | Pergas Member Database | View master directory, tiers, and registration logs. | FR-20, 21 |
| **UC-10** | Monitor App Metrics | Admin | System Analytics Engine | Track system health, view trends, and participation rates. | FR-22 |

### Key Quality Attributes (Non-Functional Requirements)
* **Security & Privacy (NFR-01 / NFR-02):** Strict role-based access control (RBAC) across protected administrative routes. Compliance with **Singapore PDPA guidelines** by limiting public field exposure.
* **Performance (NFR-03):** Core views must load within **3 seconds** over a standard 4G mobile connection for up to 900 users.
* **Responsiveness & Accessibility (NFR-05 / NFR-09):** Fluid layout prioritizing mobile viewports while utilizing font scaling and WCAG-compliant color contrast.
* **Brand Consistency (NFR-15):** Strictly aligned with official Pergas branding, highlighting a **light green and white** palette.

---

## 🛡️ Git & Workflow Rules

To support our focus on maintainability (`NFR-07`) and facilitate clean knowledge transfer in the upcoming trimester, all developers must adhere to the following workflow:

**Branching Strategy:** Main development occurs on a feature-branch workflow. Protect the `main` branch.
    * Format: `feature/uc-[id]-[short-description]` or `bugfix/[short-description]`
**Continuous Deployment:** Pushing or merging to verified deployment branches automatically triggers building and live deployment to our cloud hosting environment.
