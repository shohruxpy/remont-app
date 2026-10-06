# TECHNICAL SPECIFICATION (TZ) v4: Equipment Repair Tracking & Control Mobile App

> This document is written for an AI coding agent (Antigravity).
> **Autonomous mode:** the product owner is not a developer and does not want to be asked many questions. Do all the work yourself. Where something is unclear, make the most reasonable decision, record it in one line in `docs/DECISIONS.md` (what was chosen and why), and continue. Asking the owner a question is allowed only in the rare cases described in Section 13. Do not change the requirements and do not add features that are not in this document.

> **LANGUAGE RULES (important):**
> - This specification, all code, identifiers, comments, commit messages, API field names, and `docs/*` files are in **English**.
> - The **mobile app UI is 100% in Russian**: every label, button, message, error, empty state, dialog, validation text, date/number format, generated PDF (QR sheets), and the seed/test data (machine names, notes, etc.). No English or Uzbek text may be visible to the end user.
> - Implement i18n properly (ARB files, `ru` as the only shipped locale and the default) so that other languages can be added later without code changes. Never hard-code user-visible strings in widgets.
> - UI formats: dates `DD.MM.YYYY`, numbers with a space as thousands separator and a comma as decimal separator (e.g. `1 250 000,50`), currency label `сум` (UZS). API uses ISO `YYYY-MM-DD` and plain numbers.
> - The final report to the owner (Section 13, rule 5) is written in **simple Uzbek (Latin script)**, because the owner reads Uzbek.

---

## 1. Project overview

**Organization:** one of the largest carpet-weaving factories in Central Asia.
**Goal:** a mobile app to control equipment repairs and keep the repair history of 35+ large carpet-weaving machines (looms).
**Problem:** The factory uses SAP S/4HANA. Every machine has its own CO order; any consumption is posted to that order and, when the order is settled, the amount goes to the right cost center (MVZ). This does not provide **full monitoring** (which part, new or refurbished, when, by whom, how much).
**Solution:** each machine gets a QR code. Scanning it opens that machine's card with three buttons: **History**, **Plans**, **Repairs & Expenses**. All data is stored in **our own PostgreSQL database** and accessed through **our own backend API**. SAP is used **read-only** as a source of reference data (materials, moving average prices, CO orders, cost centers). Writing back to SAP is out of scope.

## 2. Architecture

```
[Mobile app (Flutter, Android)] --HTTPS/JSON--> [Backend API (FastAPI)] --> [PostgreSQL]
[Web panel (React, see TZ_web.md)] --HTTPS/JSON-->        |
                                                          |  read-only, Phase 6
                                    [SAP S/4HANA / HANA: materials, MAP prices, CO orders, cost centers]
```

- **The system of record is our PostgreSQL database.** Both clients (mobile app, web panel) use the same backend and the same database. The clients have no own database (the mobile app keeps only a temporary cache and the login token).
- **Backend:** Python 3.12, FastAPI, SQLAlchemy 2, Alembic migrations, Pydantic, PostgreSQL 16. The OpenAPI file `docs/openapi.yaml` is generated from the backend and committed.
- **Deployment:** Docker Compose (services: `db`, `backend`, later `web`), one `.env` file, runs on a factory-internal Linux server reachable over the factory Wi-Fi/VPN. The agent first runs everything locally with Docker.
- **SAP integration is read-only and isolated.** Define an interface `SapReader` (methods: `list_materials()`, `get_map_prices()`, `get_co_orders()`), selected by env `SAP_MODE`:
  - `excel` (default until SAP access is provided): materials and prices are loaded from an Excel/CSV file with a CLI command (`python -m app.cli import-materials file.xlsx`).
  - `hana`: reads directly from SAP HANA with a **read-only** database user (SELECT on `MARA`, `MAKT`, `MBEW`; optionally `AUFK`/`CSKS` for CO orders and cost centers), using `hdbcli`. If the owner's IT prefers an SAP-provided read-only API, implement the same interface over HTTP instead.
  - The sync runs nightly (scheduler inside the backend) and via the CLI `python -m app.cli sync-sap`. It only updates the `materials` table (and price fields); it never deletes anything (missing materials become archived) and never touches repair data. Every run is logged in `sap_sync_log`.
- **The core product (everything except SAP sync) must work without any SAP connection.**
- **Stack of clients:** Flutter (**Android only**, iOS is not needed), `mobile_scanner` for QR, `flutter_secure_storage` for tokens.

## 3. Roles

| Role | Capabilities |
|---|---|
| **Admin** | Everything: create/edit/archive machines, generate and print QR codes, create/edit/block users, reset passwords, edit any record, manage templates, see amounts, view the audit log |
| **User** | Cannot see amounts. Usage only: view machines, scan QR, view history and plans, add repair and expense records, edit **own** records within a time window set by admin (default 24 h). Cannot create machines or users, cannot edit others' records, cannot manage templates |

No self-registration. Only the admin creates users. The app shows/hides buttons by role, but **the real permission check is on the backend**.

## 4. Business rules

1. Every machine has a unique **code** and a unique **QR**. QR text format: `EQ:<machine_code>` (e.g. `EQ:LOOM-014`). Any other format shows the error "Неверный QR-код".
2. A **repair** record belongs to a machine and has several **material lines**.
3. Each material line is one of two kinds: **NEW** (new spare part from stock) or **REFURBISHED** (an existing old part repaired and reinstalled). Analytics always show them **separately**.
4. **Zaprafka** (Russian UI label: **«Заправка»**) is the major periodic service of a machine, done **once every 5 years**. It is not an ordinary repair:
   - The machine's consumables/parts are **fully renewed**.
   - It lasts about **1 month**, so it is a process with a **start date** and an **end date**.
   - Statuses: `PLANNED → IN_PROGRESS → DONE` (or `CANCELLED`).
   - While `IN_PROGRESS`, materials are added **many times over the month** (daily entries). The zaprafka card aggregates all of these entries under one process with total quantity/amount.
   - While a zaprafka is `IN_PROGRESS`, machine status = **«Заправка»**. Ordinary repairs may still be added, but they are linked to the zaprafka.
   - **Next zaprafka date = zaprafka END date + 60 months** (interval is configurable per machine, default 60). Calculated from the **end** date.
   - A **template** (list of items usually replaced: material, quantity, condition NEW/REFURBISHED) is available. Only the **admin** creates and edits templates, in the **"Repairs & Expenses"** section (6.3-C). When a zaprafka starts, a template is selected and its lines are copied into the record; the user enters actual quantities and may remove lines or add new ones. Editing a template later does **not** affect zaprafkas already started.
   - There can be several templates (named, e.g. «Стандартная заправка»). Templates may also be created for ordinary repairs.
5. A **plan** is a future repair or zaprafka. When executed, it is linked to the resulting repair/zaprafka record.
6. **Nothing is physically deleted** (archive/cancel only). Every change is written to the **audit log** (who, when, what).
7. If no QR is scanned, the app shows **all machines** (6.4).
8. **Every section has a date range picker** (from–to). Default: current month.
9. Materials (spare parts) live in the `materials` table, which is filled from SAP (Section 2: Excel import now, read-only HANA sync in Phase 6). The app does **not** create materials; it only selects them. If a material is missing, a free-text field is available; the admin reviews such lines later.
10. **Performer:** the logged-in user who creates the record is stored automatically (`created_by`). Optional extra field: «Мастер/бригада» (free text).
11. **Quantity and amount:** the user enters **quantity** only. At save time the backend stores a **price snapshot** (`unit_price` = the material's SAP **moving average price, MAP**, from the `materials` table) in the repair line, so past records never change when prices change later. **Amount** = quantity × `unit_price`, calculated by the backend and shown **only to the admin**, together with the quantity. If a material has no price, the amount is empty («—»). For a non-admin user, amount and price fields are **never sent** by the API (hiding in the UI is not enough; the check is on the backend).

## 5. PostgreSQL schema

Create with Alembic migrations. Naming: snake_case, plural table names. All tables have: `id uuid` (primary key, `gen_random_uuid()`), `created_at timestamptz`, `updated_at timestamptz`, `created_by uuid` (nullable FK `users`), `updated_by uuid`, and — for editable business tables — `version integer default 1` (optimistic locking, incremented on every update) and `is_archived boolean default false` (soft delete). Use `numeric(18,2)` for money, `numeric(14,3)` for quantities, `timestamptz` for times.

- **users**: `username` (unique, case-insensitive), `password_hash` (argon2id), `full_name`, `role` (`ADMIN|USER`), `is_active`, `failed_attempts`, `locked_until`
- **machines**: `code` (unique), `name`, `model`, `serial_no`, `location`, `commissioned_on` (date), `sap_co_order` (text, nullable), `sap_cost_center` (text, nullable), `zaprafka_interval_months` (default 60), `last_zaprafka_end` (date, nullable), `status` (`ACTIVE|IN_ZAPRAFKA|ARCHIVED`)
- **materials**: `code` (SAP material number, unique), `name`, `unit`, `map_price` (numeric, nullable), `price_updated_at`, `source` (`SAP|EXCEL`)
- **repairs**: `machine_id`, `repair_date`, `type` (`REPAIR|INSPECTION|ZAPRAFKA_WORK`), `title`, `description`, `crew` (text), `zaprafka_id` (nullable), `plan_id` (nullable), `status` (`DRAFT|DONE|CANCELLED`)
- **repair_items**: `repair_id`, `item_no`, `material_id` (nullable), `free_text_material` (nullable), `condition` (`NEW|REFURBISHED`), `qty` (> 0), `unit`, `unit_price` (numeric, nullable; snapshot, admin-only), `amount` (generated column `qty * unit_price`, nullable), `note`. Constraint: either `material_id` or `free_text_material` is set.
- **zaprafka**: `machine_id`, `start_date`, `end_date` (nullable), `status` (`PLANNED|IN_PROGRESS|DONE|CANCELLED`), `template_id` (nullable), `note`. Constraint: at most one `IN_PROGRESS` zaprafka per machine.
- **templates**: `name`, `type` (`ZAPRAFKA|REPAIR`), `is_active`
- **template_items**: `template_id`, `item_no`, `material_id`, `condition`, `qty`, `unit`, `note`
- **plans**: `machine_id`, `type` (`REPAIR|ZAPRAFKA`), `plan_date`, `description`, `status` (`PLANNED|DONE|OVERDUE|CANCELLED`), `done_repair_id` (nullable)
- **audit_log**: `user_id`, `action`, `entity`, `entity_id`, `before` (jsonb), `after` (jsonb), `at` (timestamptz). Written by the backend for every create/update/archive/login-block/password-reset.
- **sap_sync_log**: `started_at`, `finished_at`, `mode`, `status`, `materials_updated`, `error` (text)

Indexes: `repairs(machine_id, repair_date)`, `repair_items(repair_id)`, `plans(machine_id, plan_date)`, `zaprafka(machine_id, status)`, `materials(code)`, `audit_log(at)`. An `OVERDUE` plan status is computed (plan_date < today and status `PLANNED`) — implement as a query rule, not a nightly job.

## 6. Screens and flows (all UI text in Russian)

Main labels (use exactly): **История** (History), **Планы** (Plans), **Ремонт и расходы** (Repairs & Expenses), **Заправка** (Zaprafka), **Сканировать QR**, **Станки** (machines), **Управление** (Admin), **Шаблоны** (Templates), **Новый / Восстановленный** (NEW / REFURBISHED).

### 6.1 Login
Login + password. Clear error on failure. Token stored securely. Logout button.

### 6.2 Home screen
- Large **«Сканировать QR»** button.
- Machine list with search (code/name). Tapping opens the machine card.
- Three general buttons: **История**, **Планы**, **Ремонт и расходы** (all-machines mode, see 6.4).
- Small warning block for zaprafkas that are due soon/overdue.
- Admin only: **Управление**.

### 6.3 Machine card (after QR scan)
Header: code, name, location, status (including «Заправка»). Three buttons below:

**A) История (History)** — all repairs and expenses of this machine, ordered by date (newest first); date-range and type filters. Inside a record, materials are shown in **two groups**: «Новые» and «Восстановленные». A zaprafka is shown as a single process (start–end, totals). **Analytics block** (for the selected period): number of repairs; total quantity (and amount, admin only) of new materials; total quantity of refurbished materials; top 5 most replaced parts; refurbishment share (%); total zaprafka expenses (admin only for amounts).

**B) Планы (Plans)** — future repairs (by date), date filter. **Zaprafka block:** last zaprafka (end date), next zaprafka date, time remaining, color (green > 6 months, yellow ≤ 6 months, red overdue). Add/edit plans. "Done" opens the repair/zaprafka creation screen pre-filled.

**C) Ремонт и расходы (Repairs & Expenses)** — new record form: date, type, description, crew/master. **Material lines:** search and pick a SAP material, **Новый / Восстановленный**, quantity, note. Several lines allowed. Users enter **quantity only**; the **admin** also sees the **amount** per line and in total. Validation on save (quantity > 0; at least one line or a description). A date-filtered list of earlier records of this machine is also shown here.
**Templates (admin only):** a "Шаблоны" list in this section: create, edit, copy, deactivate; lines = SAP material, condition, quantity. Regular users see templates only to select them.
**Zaprafka mode:** «Начать заправку» (start date, **choose template**) → add materials over the following days → «Завершить заправку» (end date). On finish, `LAST_ZAPR_END` is updated and the next zaprafka is recalculated.

### 6.4 No-scan mode (all machines)
- **История:** works of **all machines** in the chosen date range; group/filter by machine; overall analytics.
- **Планы:** plans and zaprafka deadlines of all machines (soonest first).
- **Ремонт и расходы:** when adding a record, first choose a machine (or scan a QR), then the form from 6.3-C.

### 6.5 Admin: «Управление»
- **Machines:** list, create, edit, archive. A QR is generated automatically; **print QR codes as a PDF** (several per A4 page, with machine code and name below, in Russian). Fields for SAP CO order and cost center.
- **Users:** create, edit, change password, block/activate.
- **Audit log.**

## 7. Errors and edge cases (the agent must handle)

- Backend unreachable: clear Russian message («Нет связи с сервером»), retry button, the app must not freeze.
- QR scanning works without signal, but loading data needs internet (MVP). Offline queue is Phase 7.
- Two people edit the same record: use the `version` field and show «Запись была изменена».
- Archived machine's QR scanned: «Станок в архиве», show history only.
- Date range with "from" > "to": validation error.

## 8. API contract (REST/JSON, `/api/v1`) — implemented by our backend

The agent writes this fully into `docs/openapi.yaml` (with request/response examples).

```
POST /auth/login           → {access_token, refresh_token, user{role,...}}
POST /auth/refresh         GET  /auth/me
GET  /machines             GET  /machines/{code}        (admin) POST/PUT /machines, archive
GET/POST/PUT /users        (admin)
GET  /templates   GET /templates/{id}   POST/PUT /templates   (POST/PUT admin only)
GET  /materials?search=&page=   (from the `materials` table, synced from SAP)
GET  /repairs?machine_code=&date_from=&date_to=&type=&zapr_id=
POST /repairs   GET /repairs/{id}   PUT /repairs/{id}
GET  /plans?machine_code=&date_from=&date_to=&status=
POST /plans   PUT /plans/{id}   POST /plans/{id}/complete
GET  /zaprafka?machine_code=    POST /zaprafka/start
POST /zaprafka/{id}/finish      GET /zaprafka/{id}  (with totals)
GET  /analytics/history?machine_code=&date_from=&date_to=
GET  /audit-log   (admin)
```
If `machine_code` is omitted, the endpoint returns data for all machines. Lists are paginated (`page`, `page_size`). Error format: `{"error":{"code":"...","message":"..."}}`. Dates in ISO `YYYY-MM-DD`. **Role checks on every endpoint happen in the backend. `amount`/`unit_price` fields appear only in admin responses.**

## 9. Security

- HTTPS only (nginx reverse proxy in front of the backend). The Android app must reject invalid certificates; if IT uses an internal certificate authority, its certificate is installed on the devices. Document the options in the README.
- Passwords are stored as **argon2id** hashes in `users.password_hash`. The app never stores the password, only the token. Short-lived access token + longer refresh token (refresh tokens revocable).
- Login rate limiting and lockout (`failed_attempts`, `locked_until`).
- The server is reachable only from the factory network/VPN; it is not exposed to the public internet.
- The SAP connection (Phase 6) uses a **read-only** database/API user with minimal authorizations; credentials only in `.env`, never in the repo.
- Role and amount-visibility checks are enforced in the backend on every endpoint (tests required).

## 10. Non-functional requirements

- Speed: lists < 2 s; QR recognition < 2 s.
- Large buttons (usable with work gloves), simple Russian texts.
- Code quality: README, `.env.example`, automated tests (business rules: zaprafka calculation, roles, amount visibility, date filters).
- **Backups are our responsibility now:** a daily `pg_dump` (02:00) by a scheduled container, kept for 30 days in a mounted volume; README must contain restore instructions and the agent must test a restore once.

## 11. Work plan

**Execution mode (autonomous):** run Phase 0 through Phase 5 **continuously without stopping**. At the end of each phase, verify its acceptance criteria yourself (tests, running on an emulator), log the result in `docs/PROGRESS.md`, and move on. **Phase 6** starts only after the owner provides SAP read-only access details; until then, stop after Phase 5 and give the final report. **Phase 7** only if the owner asks.

**Phase 0 — Setup.** Repo (`/backend`, `/mobile`, `/docs`), Docker Compose (`db` + `backend`), `.env.example`, README, git.
*Accept:* `docker compose up` starts PostgreSQL and the backend; `/health` responds.

**Phase 1 — Backend base.** Schema and Alembic migrations (Section 5), seed data in Russian (admin user, 5 machines, ~30 materials with prices, sample repairs/zaprafkas), auth (login/refresh/me), roles, users and machines CRUD, audit log, generated `docs/openapi.yaml`.
*Accept:* admin signs in and creates a machine and a user; a regular user gets 403 on admin endpoints; tests pass.

**Phase 2 — Backend business logic.** Materials, repairs and items (NEW/REFURBISHED, price snapshot), templates, plans, zaprafka flow (start from template, add entries, finish), analytics, date filters, optimistic locking, amount visibility rules.
*Accept:* finishing a zaprafka sets the next date = end date + 60 months; user responses contain no amounts; tests pass.

**Phase 3 — Mobile base.** Login, home, machine list, QR scan → machine card, three buttons, i18n with Russian locale.
*Accept:* QR opens the correct machine; a wrong QR shows the error message.

**Phase 4 — Mobile features.** History (+analytics), Plans (+zaprafka block), Repairs & Expenses (NEW/REFURBISHED), zaprafka start/finish from a template, date filters, all-machines mode.
*Accept:* all flows in Section 6 pass a manual test script (the agent writes the test scenario list).

**Phase 5 — Admin part and operations.** Machine/user CRUD in the app, QR PDF printing, audit log view, **initial import of the machine list from Excel** (provided by the owner: code, name, CO order, cost center) and **materials import from Excel** (CLI), backup container and restore test, production-ready Docker Compose, README for the IT department (server requirements, ports, HTTPS, backups).
*Accept:* a fresh server can be deployed from the README alone.

**Phase 6 — SAP read-only sync.** Implement `SapReader` modes (Section 2), nightly sync, `sap_sync_log`, CLI command; test against the SAP QAS system first. Material prices (MAP) update; amounts for **new** records use the new prices, old records keep their snapshot.
*Accept:* after a sync, material list and prices match SAP; a failed sync leaves data unchanged and logs the error.

**Phase 7 — Hardening.** Offline queue, push reminders (zaprafka due), Excel/PDF export, photo attachments, pilot (3–5 machines, 2–3 users), then full rollout.

## 12. Optional suggestions (add only if the owner approves)

1. Photo attachments to repairs. 2. Machine downtime (repair start/end time). 3. Repair reason dictionary. 4. Excel/PDF export. 5. Comparison of app expenses with actual SAP order postings.

## 13. Agent rules

1. **Decide on your own.** When unclear, choose the simplest safe option, record it in `docs/DECISIONS.md`, continue.
2. **Ask the owner only if:** (a) you need personal data/keys to continue (e.g. SAP read-only connection details in Phase 6, or server access for deployment); (b) requirements contradict each other and a wrong choice means big rework. Ask **one** precise question and include a **recommended answer**.
3. Implement only what is in this TZ. Do not add Section 12 items unless asked.
4. Do all installation and setup (Flutter, Android emulator, packages) yourself; do not hand commands to the owner if you can run them.
5. The **final report is in simple Uzbek (Latin)**: what is ready, how to open and test the app, what remains. Avoid technical jargon.
6. Commit to git after each phase with clear messages.
7. Remember the language rules at the top: English in code/docs, **Russian in the app UI**.

## 14. Decisions made and open items

**Resolved:** own PostgreSQL database shared by mobile and web (SAP is read-only reference data); backend built by the agent (FastAPI), no dependency on SAP developers for the core product; passwords hashed (argon2id) in PostgreSQL; amounts use SAP moving average price (MAP) as a price snapshot per repair line; SAP has a QAS system for Phase 6 tests; factory Wi-Fi covers all areas; Android only; amounts admin-only; admin manages templates; app UI in Russian; TZ in English.

**Owner / factory IT will provide later:**
1. A Linux server (or VM) for Docker: 2 CPU, 4 GB RAM, 50 GB disk, reachable from the factory Wi-Fi/VPN, plus IT approval to run PostgreSQL there.
2. The list of 35+ machines (Excel: code, name, CO order, cost center) and, optionally, a starting materials list (Excel: code, name, unit, price).
3. For Phase 6: SAP read-only access (HANA host/port and a read-only user with SELECT on `MARA`, `MAKT`, `MBEW`, optionally `AUFK`/`CSKS`) or an SAP-provided read-only API.
