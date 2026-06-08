# Project Overview

The **Pergas Integrated Members Engagement System** is a digital portal designed to unify the member experience for the Singapore Islamic Scholars and Religious Teachers Association (Pergas). It replaces fragmented manual communication channels such as email, Telegram, and physical cards with a centralized, secure web application.

## Core Objectives

- Centralized access through a secure web app.
- Digital verification through a live membership card with QR or barcode support.
- Member engagement through event discovery, partner benefits, and moderated discussions.
- Administrative efficiency through tools for announcements, audit logs, verification, and analytics.

## System Scope & Requirements

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

### Key Quality Attributes

- Security and privacy: role-based access control and PDPA-aligned data exposure.
- Performance: core views should load within 3 seconds on standard 4G for up to 900 users.
- Responsiveness and accessibility: mobile-first layouts with WCAG-compliant contrast.
- Brand consistency: align with Pergas branding using a light green and white palette.