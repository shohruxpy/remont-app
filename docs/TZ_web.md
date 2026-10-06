# TECHNICAL SPECIFICATION (TZ) — WEB PANEL: Equipment Repair Monitoring & Control

> **Companion to `docs/TZ.md`** (the mobile-app TZ v4). Read that document first. Its Sections 3 (roles), 4 (business rules), 5 (PostgreSQL schema), 8 (API contract), 9 (security) and the language rules **apply unchanged**. This document defines the **web panel** and the **API additions** it needs.
>
> **Visual source of truth: `docs/ui_mockup.html`** (approved by the owner). Open it in a browser (tab «Веб-панель»). The web panel must look and behave exactly like it: same layout, same colors, same labels, same buttons, same placement. Do not redesign, rename, reorder, add, or remove visible elements. The only additions allowed are the minimum needed to make it a working product (listed in Section 3).
>
> **Autonomous mode (same as `docs/TZ.md`):** do all the work yourself. When something is unclear, choose the simplest reasonable option, log it in one line in `docs/DECISIONS.md`, and continue. Ask the owner only in the cases of Section 12.

---

## 1. Purpose and scope

The web panel is the management tool for **full monitoring, control, statistics and data entry/editing** of equipment repairs. The mobile app (workers) and the web panel use the **same backend API and the same PostgreSQL database**. The web panel is **admin-only**: it shows amounts (SAP moving average price, MAP), manages machines, users and templates, and exports reports.

- Decision: only users with role `ADMIN` can sign in to the web panel. A non-admin login shows «Доступ только для администратора». Make this a config value (`WEB_ALLOWED_ROLES=ADMIN`) so it can be changed later without code changes.
- The web app has no own database. All data comes from the backend API defined in `docs/TZ.md` (built in mobile phases 0–2; the web phases extend it). SAP is only a read-only source of materials and prices inside the backend.

## 2. Language and formats

- Code, identifiers, comments, commit messages and `docs/*` are in **English**.
- **All visible UI text is Russian**, exactly as in the mockup (labels are quoted in Section 5). No English/Uzbek text visible to users. Use an i18n layer (`react-i18next`, locale `ru` only, default) — no hard-coded visible strings.
- Dates `DD.MM.YYYY`; numbers with a space as thousands separator and comma as decimal separator (`128 450 000`, `1 250 000,50`); currency label `сум`. The API uses ISO `YYYY-MM-DD` and plain numbers.
- Final report to the owner: **simple Uzbek (Latin)**.

## 3. Allowed additions to the mockup (and nothing else)

1. **Login page** (not in the mockup): centered card, logo 🧵, title «Ремонт станков», fields «Логин», «Пароль», button «Войти», same colors/radius as the mockup.
2. **Top bar right side:** current user name and a «Выйти» button. (The mockup's «Мобильное приложение / Веб-панель» switcher is a mockup-only element: **do not build it**.)
3. **Modals/drawers** that open from existing buttons (e.g. «Изменить», «+ Станок»), confirmation dialogs, and toast messages.
4. **Loading, empty and error states** in the same visual style.
5. Pagination under long tables (default 25 rows) in the same style as buttons/chips.

## 4. Stack and structure

- **React 18 + TypeScript + Vite**, React Router, TanStack Query (data fetching/cache), `react-i18next`.
- **Plain CSS with CSS variables** (port the mockup's CSS and tokens exactly). No UI kit (no MUI/Ant/Bootstrap) — it would change the look. No chart library: the charts are simple CSS/SVG bars as in the mockup.
- `web/` folder in the same repo; API base URL from `VITE_API_BASE_URL` (default: local backend). `.env.example`, README, Dockerfile (nginx serving the static build).
- Theme: follow `prefers-color-scheme` (light/dark) using the tokens below. No manual toggle.

### Design tokens (from the mockup — keep exact)

| Token | Light | Dark |
|---|---|---|
| `--bg` | `#f4f5f7` | `#14171b` |
| `--card` | `#ffffff` | `#1e2329` |
| `--tx` (text) | `#1b1f24` | `#e8eaed` |
| `--mu` (muted) | `#6b7280` | `#9aa3ad` |
| `--bd` (border) | `#e3e6ea` | `#2f363d` |
| `--pr` (primary) | `#1d5fd6` | `#6da0ff` |
| `--prt` (primary tint) | `#e8f0fe` | `#1d2b45` |
| `--ok` / `--okt` | `#1a9a5b` / `#e3f6ec` | `#4cc88a` / `#173326` |
| `--wa` / `--wat` | `#c98400` / `#fff4d6` | `#e8b63a` / `#3a2f12` |
| `--er` / `--ert` | `#d23b3b` / `#fde8e8` | `#ef7a7a` / `#3d1f1f` |

Typography: `system-ui, -apple-system, "Segoe UI", Roboto, sans-serif`, base 14px / line-height 1.4; page titles 18px bold; KPI numbers 22px. Radius: cards 12px, buttons/inputs 8px, tags fully rounded. Tags: `g` (green), `y` (yellow), `r` (red), `b` (blue). Table: collapsed borders, 8px cell padding, 13px text, muted header.

## 5. Layout and pages (match the mockup exactly)

### 5.1 Shell
- **Top bar:** left «🧵 Ремонт станков»; right: user name + «Выйти».
- **Two-column layout:** left sidebar 200px (card background, right border), content area with 16px padding. Below 700px width the sidebar becomes a horizontal scrollable row above the content.
- **Sidebar items, in this order, with these exact labels (emoji included):** «📊 Дашборд», «⚙️ Станки», «🛠 Ремонты и расходы», «📅 Планы и заправка», «📋 Шаблоны», «👤 Пользователи», «🧾 Журнал действий», «⬇️ Отчёты (Excel)». Active item: primary-tint background, primary text, bold. **All eight items are active and clickable** (none greyed out). Each is a route (`/`, `/machines`, `/repairs`, `/plans`, `/templates`, `/users`, `/audit`, `/reports`).

### 5.2 Дашборд (`/`)
- Header row: title «Дашборд»; right: date range inputs («с» – «по», format DD.MM.YYYY, default = current month) and a machine select with first option «Все станки». Changing any filter reloads all blocks below.
- **KPI cards (4):** «Ремонтов» (count), «Расходы, сум» (total amount), «Заправок в процессе» (count; number in warning color), «Просрочено» (count of overdue zaprafkas/plans; number in error color).
- **Two blocks side by side** (wrap on narrow screens):
  1. «Расходы по месяцам, млн сум»: vertical bars for the **5 months ending at the "to" date**, month abbreviations under bars (янв, фев, мар, апр, май, июн, июл, авг, сен, окт, ноя, дек), tallest bar = 100% height.
  2. «Новые и восстановленные»: one horizontal stacked bar (new = primary color, refurbished = green) and two tags under it: «Новые N%» (blue tag) and «Восстановленные N%» (green tag); below: «Топ-5 заменяемых деталей» — ordered list «Название — N шт.».
- **Table «Сроки заправки»** with columns «Станок», «Последняя», «Следующая», «Осталось», and a status tag column. Sorted by soonest next date. Tag rules: in progress → yellow «Заправка идёт»; overdue or ≤ 1 month left → red «Срочно»; ≤ 6 months → yellow «Скоро»; otherwise green «В норме». «Осталось» format: «N г. M мес.» / «N мес.».
- Clicking a machine code opens `/repairs` filtered to that machine.

### 5.3 Станки (`/machines`)
- Header row: title «Станки»; right: search input «Поиск» (code/name, debounced), buttons **«+ Станок»** (primary), **«Импорт из Excel»**, **«Печать QR (PDF)»**.
- Table columns: «Код», «Название», «Заказ CO», «МВЗ», «Статус», and an actions column with buttons **«Изменить»** and **«QR»** (small buttons). Status tags: green «Работает», yellow «Заправка», grey/muted «Архив».
- **«+ Станок» / «Изменить»** open a modal with fields: Код (unique, read-only on edit), Название, Модель, Серийный номер, Расположение, Дата ввода, Заказ CO, МВЗ, Интервал заправки (мес., default 60), Дата окончания последней заправки; buttons «Сохранить», «Отмена»; on edit also «Архивировать».
- **«QR»:** downloads/prints the QR for that machine (PDF, label with code and name in Russian). QR payload `EQ:<code>`.
- **«Печать QR (PDF)»:** a modal to choose machines (checkbox list with «Выбрать все») → generates an A4 PDF with several QR codes per page, each with code and name below.
- **«Импорт из Excel»:** modal with file picker (`.xlsx`, columns: code, name, CO order, cost center), preview of rows with errors highlighted, button «Импортировать».

### 5.4 Ремонты и расходы (`/repairs`)
- Header row: title «Ремонты и расходы»; right: date range inputs and **«+ Новая запись»** (primary).
- **Two-column area** (left ≈ 1.3 : right ≈ 1):
  - **Left: table** with columns «Дата», «Станок», «Тип», «Автор», «Сумма, сум». Types: «Ремонт», «Заправка», «Осмотр». Amount is «—» when there are no priced lines. The selected row has the primary-tint background. Clicking a row loads it into the right panel. Filters: machine and type selects above the table (same input style).
  - **Right: card «Редактирование записи»** with a muted subtitle «DD.MM.YYYY · КОД · Тип», field «Описание», and a lines table with columns «Материал», «Состояние», «Кол-во», «Сумма». «Состояние» shows a blue tag «Новый» or green tag «Восстан.» (editable via a two-option toggle «Новый / Восстановленный»). Lines can be added («+ Строка»: SAP material search, condition, quantity), edited and removed. **Amount is read-only**, calculated by the backend (quantity × price snapshot taken from the SAP MAP); the muted note «Цена — средняя из SAP (MAP)» sits at the bottom-left; buttons «Отмена» and **«Сохранить»** (primary) at the bottom-right.
- **«+ Новая запись»:** same card in "create" mode: choose machine, date, type, description, crew/master («Мастер/бригада»), lines.
- Saving uses the record `version`; on conflict show «Запись была изменена. Обновите страницу.»
- Zaprafka records show the process totals and link to the Plans page card.

### 5.5 Планы и заправка (`/plans`)
- Header row: title «Планы и заправка»; right: **«+ План»** (primary).
- **Card for each zaprafka in progress** (stacked if several): first row: bold «КОД · Заправка в процессе» + yellow tag «День N из ~30»; progress bar (warning color fill); second row: muted text «Начата DD.MM.YYYY · записей: N · шаблон «Название»» and on the right the bold total «N сум» plus small buttons **«Добавить материалы»** and **«Завершить»**.
  - «Добавить материалы» opens the material-lines dialog (same lines editor as 5.4) and creates a dated entry under this zaprafka.
  - «Завершить» asks for the end date (confirmation dialog), finishes the zaprafka, updates `LAST_ZAPR_END`, recalculates the next zaprafka (end date + interval).
- **Table:** «Дата», «Станок», «Тип», «Описание», «Статус», and a small button **«Изменить»**. Status tags: red «Срочно», yellow «Скоро», blue «План», green «Выполнено», muted «Отменён».
- **«+ План» / «Изменить»:** modal: machine, type («Ремонт»/«Заправка»), date, description, status; for type «Заправка» also a button **«Начать заправку»** that asks for start date and **template** and creates the in-progress zaprafka.

### 5.6 Шаблоны (`/templates`)
- Header row: title «Шаблоны»; right: **«+ Шаблон»** (primary).
- **Two columns** (≈ 1 : 1.6): left card with the list of templates (selected one has the tint background; tags: green «Активен», muted «Архив»); right card: bold template name, buttons **«Копировать»** and **«Деактивировать»** (becomes «Активировать» for archived ones), lines table «Материал (SAP)», «Состояние», «Кол-во», and per-row «✎ ✕» actions (edit/remove), then **«+ Строка»** and **«Сохранить»** (primary).
- Editing a template never changes zaprafkas that were already started.

### 5.7 Пользователи (`/users`)
- Header row: title «Пользователи»; right: **«+ Пользователь»** (primary).
- Table: «Логин», «ФИО», «Роль», «Статус», actions. Role tags: blue «Админ», plain «Пользователь». Status tags: green «Активен», red «Заблокирован». Action buttons (small): **«Изменить»**, **«Сбросить пароль»**, **«Блок»** (for blocked users: **«Активировать»**).
- «+ Пользователь»/«Изменить»: modal with Логин, ФИО, Роль, (on create) Пароль. «Сбросить пароль»: confirmation → API returns a one-time temporary password shown once in a dialog with a copy button. An admin cannot block or demote themselves.

### 5.8 Журнал действий (`/audit`) — read-only
- Header row: title «Журнал действий»; right: date input and a «Пользователь» input (filters).
- Table: «Время» (DD.MM.YYYY HH:MM), «Пользователь», «Действие» (Создание, Изменение, Блокировка, Архивация, …), «Объект» (e.g. «Станок LOOM-021»), «Изменение» (`старое → новое`, or «—»). Paginated.

### 5.9 Отчёты (Excel) (`/reports`)
- Header: title «Отчёты (Excel)». A grid of 4 cards, each with a bold title, a muted one-line description and a primary button **«⬇ Скачать .xlsx»**:
  1. «Расходы по станкам» — «За период: новые и восстановленные, количество и сумма»
  2. «История ремонтов» — «Все записи по выбранным станкам»
  3. «Сроки заправки» — «Последняя, следующая, остаток времени»
  4. «Детали: топ замен» — «Самые часто заменяемые материалы»
- Clicking a button opens a small modal to choose the period and machines («Все станки» by default), then downloads the file. Excel files: Russian column headers, formatted numbers/dates, frozen header row.

## 6. Behavior rules (apply everywhere)

- Role/amount rules from `docs/TZ.md` apply; the panel is admin-only, so amounts are shown wherever the mockup shows them.
- Every table: loading skeleton, empty state «Нет данных», error state with «Повторить» button.
- Every create/edit/archive action writes to the audit log through the API (backend side).
- Optimistic locking (`version`) on all edits.
- Nothing is physically deleted (archive/cancel only); «✕» on template/repair lines removes the line from the draft only.
- Unsaved changes: warn before leaving a dirty form («Есть несохранённые изменения»).
- Session: refresh token flow; on expiry redirect to login.

## 7. API additions (implement them in our backend; they appear in the generated `docs/openapi.yaml`)

```
GET  /analytics/dashboard?date_from=&date_to=&machine_code=
     → {kpis{repairs,amount,zapr_in_progress,overdue},
        monthly_expenses[5]{month,amount},
        new_vs_refurbished{new_pct,refurbished_pct},
        top_parts[5]{name,qty,unit},
        zaprafka_deadlines[]{machine_code,last_end,next_date,months_left,status}}
GET  /machines?search=&status=&page=&page_size=
POST /machines/import?dry_run=true|false   (multipart .xlsx → per-row result/errors)
POST /machines/qr-sheet  body {codes[]}    → application/pdf
GET  /machines/{code}/qr                   → application/pdf (single label)
GET  /repairs?...&machine_code=&type=       (list rows include total `amount`, admin only)
PUT  /repairs/{id}  (header + lines[] with version)
POST /templates/{id}/copy   PATCH /templates/{id} {active}
PATCH /users/{id} {active|role|full_name}   POST /users/{id}/reset-password → {temporary_password}
GET  /audit-log?date=&username=&page=
GET  /reports/{expenses-by-machine|repair-history|zaprafka-deadlines|top-parts}.xlsx?date_from=&date_to=&machine_code=
```
Plans and zaprafka endpoints from `docs/TZ.md` are used as is (`POST /zaprafka/start`, `POST /zaprafka/{id}/finish`, `GET /zaprafka/{id}`, `/plans` CRUD). Document every addition with examples; implement all of them in the backend; Excel reports are generated server-side (openpyxl). Extend the Russian seed data (the sample data in the mockup is a good seed).

## 8. Work plan (autonomous)

Run W0–W8 **continuously**; after each phase verify the acceptance criteria yourself, log the result in `docs/PROGRESS.md`, commit, and continue.

- **W0 Setup:** `web/` project (Vite + TS), tokens CSS, i18n, routing, Dockerfile, README. *Accept:* app starts, empty shell renders.
- **W1 Backend additions:** extend the backend and the generated `docs/openapi.yaml` with Section 7. *Accept:* all new endpoints answer with test data; tests pass.
- **W2 Shell + auth:** login, token handling, top bar, sidebar (all 8 routes), light/dark. *Accept:* matches mockup shell; non-admin is rejected.
- **W3 Дашборд.** *Accept:* identical layout to the mockup; filters reload every block.
- **W4 Станки** (list, modal create/edit/archive, QR, QR sheet PDF, Excel import).
- **W5 Ремонты и расходы** (table, edit card, lines editor, create mode, versioning).
- **W6 Планы и заправка + Шаблоны** (zaprafka card flow: start from template → add materials → finish; template CRUD).
- **W7 Пользователи, Журнал, Отчёты.**
- **W8 Quality:** side-by-side comparison with `ui_mockup.html` for every page at desktop and phone widths (fix any visual difference), automated tests (zaprafka dates, tag rules, filters, form validation, role gate), accessibility basics (labels, focus, keyboard), production build + Docker image.
- **W9 Deployment:** add the web build (nginx) to the Docker Compose stack, update the README for IT (ports, HTTPS, backups). If Phase 6 (SAP read-only sync) of `docs/TZ.md` is done, verify that material prices appear in the panel.

## 9. Acceptance checklist (the agent must confirm every item at the end)

1. Every element listed in Section 5 exists with the exact Russian label and position as in `ui_mockup.html`.
2. All 8 sidebar items are active; no greyed-out items.
3. Every button listed in Section 5 does what is described (no dead buttons).
4. Light and dark themes match the tokens.
5. No visible English/Uzbek text; dates/numbers in the Russian format.
6. Amounts visible only because the panel is admin-only; non-admin login is rejected.
7. Tests pass; `docker build` succeeds; README explains how to run everything locally with Docker and how to deploy.

## 10. Agent rules

1. Decide on your own; log decisions in `docs/DECISIONS.md`.
2. Do not add features beyond this document and `docs/TZ.md`. Do not change the look of the mockup.
3. Do all installation/setup yourself.
4. Commit after each phase with clear messages.
5. Final report in simple Uzbek (Latin): what is ready, how to open and try it, what remains.

## 11. Files the owner will provide later

- The list of 35+ machines (Excel: code, name, CO order, cost center) for the initial import.
- Server access details for deployment (W9), see `docs/TZ.md` Section 14.

## 12. When you may ask the owner a question

Only if (a) you need personal data or keys to continue (e.g. production server access), or (b) two requirements contradict each other and a wrong choice means large rework. Ask **one** precise question with a **recommended answer**.
