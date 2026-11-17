# WeChat group Anti-Fraud System

An end-to-end anti-fraud solution for the **Great Panda Society (GPS) Smart Campus Platform**, built to identify and block ghostwriting services, spam advertising, and scams in student WeChat communities.

### Features
 
**Blacklist Management**
- Real-time lookup by WeChat ID or email, used by the admission system (Module 1) to auto-reject flagged applicants
- Add, remove, and restore entries from the admin dashboard
- All changes persisted to the database

**Report & Review Workflow**
- Public report form — users can report by WeChat ID, nickname, or email, without needing to be friends with the target
- Admin review queue with approve / reject actions
- Approving a report automatically adds the target to the blacklist, with de-duplication (existing entries are skipped; removed entries are reactivated)

**Keyword Detection**
- Categorized sensitive-word library (ghostwriting / advertising / fraud)
- Admins paste suspicious messages into the detector to get instant matches
- Implemented as a reusable API, ready to be plugged into an automated monitoring bot later

### Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js (App Router) |
| Language | TypeScript |
| UI | React |
| Database | Google Sheets (via Google Sheets API) |
| Auth | Google Cloud Service Account |

### API Reference

| Method | Endpoint | Description |
|---|---|---|
| GET | `/api/blacklist` | List all blacklist entries |
| POST | `/api/blacklist` | Add a blacklist entry |
| GET | `/api/blacklist/check?wxid=&email=` | Check whether a user is blacklisted |
| POST | `/api/blacklist/update` | Update an entry's status (active / removed) |
| GET | `/api/reports` | List all reports |
| POST | `/api/reports` | Submit a report |
| POST | `/api/reports/approve` | Approve a report and sync to blacklist |
| POST | `/api/reports/reject` | Reject a report |
| POST | `/api/keywords/check` | Detect sensitive keywords in text |

Example - blacklist check:

```http
GET /api/blacklist/check?wxid=wxid_abc123
```
```json
{ "blocked": true, "reason": "代写" }
```

### Pages

| Route | Description |
|---|---|
| `/admin` | Admin dashboard: blacklist, report review, keyword detection |
| `/report` | Public report form |

### Getting Started

```bash
git clone https://github.com/Simonyzz/wechat-group-anti-fraud.git
cd wechat-group-anti-fraud
npm install
```

Create a `.env.local` file in the project root:

```
GOOGLE_SERVICE_ACCOUNT_EMAIL=your-service-account@your-project.iam.gserviceaccount.com
GOOGLE_PRIVATE_KEY="-----BEGIN PRIVATE KEY-----\n...\n-----END PRIVATE KEY-----"
SPREADSHEET_ID=your-google-sheet-id
```

Share the Google Sheet with the service account email (Editor access). The sheet needs three tabs: `blacklist`, `reports`, `keywords`.

```bash
npm run dev
```

Open `http://localhost:3000/admin` or `http://localhost:3000/report`.

> Never commit `.env.local` or service account JSON key files.

### Design Decisions

- **WeChat ID over WeChat handle** — a user's WeChat handle is only visible to friends, but the WeChat ID is visible to any group member, so reporters can submit valid reports without adding the target.
- **Semi-automated keyword detection** — real-time group monitoring via a WeChat bot carries account-ban risk and a higher false-positive cost. The detection logic is built as a standalone API so automation can be added later without rewriting it.
- **Google Sheets as the data layer** — low barrier for non-technical admins to view data directly, and easy integration with the analytics dashboard (Module 6). The data access layer is isolated in `app/lib/sheets.ts`, so migrating to Firebase or Postgres only requires changing one file.

### Roadmap

- [ ] Trust score system for community members
- [ ] GPS Trusted User Badge
- [ ] Automated keyword monitoring via chat bot
- [ ] Deployment to Vercel
