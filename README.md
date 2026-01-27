# Email Job Scheduler

Developed by **Aviral Asthana** (Email: aviralasthana4@gmail.com) as part of the ReachInbox (Outbox Labs) Software Development Internship Assignment.

## 🚀 Features

### Backend
- **Advanced Scheduling**: Schedule emails to be sent at specific timestamps or after delays.
- **Persistence**: 
  - **Postgres** stores the authoritative state of all emails (PENDING, SENT, FAILED, THROTTLED).
  - **Redis + BullMQ** handles the job queue persistence to ensure jobs survive server restarts.
- **Rate Limiting (Calculated Delays)**: 
  - Enforces hourly quotas per user.
  - Instead of blocking the queue, the system intelligently calculates the exact future timestamp for each email to respect the limit, ensuring high throughput and non-blocking operations.
- **Concurrency**: Configurable parallel processing (default: 5 concurrent emails).
- **Data Isolation**: API ensures users only access their own data.

### Frontend
- **Dashboard**: Real-time view of scheduled and sent emails with status badges.
- **Compose Page**: 
  - Bulk recipient upload (CSV/TXT) - A reference CSV file with list of recipients is already provided in the repo.
  - Manual recipient entry.
  - "Send Later" modal for precise scheduling.
  - Auto-creates Sender profile for new users.
- **Email Detail View**: Full visual preview of sent emails.
- **Authentication**: Real Google OAuth login (no mock), with user profile displayed in the dashboard.

---

## 🛠 Prerequisites

- [Node.js](https://nodejs.org/) (v18+)
- [Docker](https://www.docker.com/) (for Redis and Postgres)

---

## 🏗 Setup Guide

### 1. Start Infrastructure
Run Redis and Postgres using Docker Compose:
```bash
cd server
docker-compose up -d
```

### 2. Configure Environment Variables
Create a `.env` file in the `server` directory:

```env
DATABASE_URL="postgresql://user:password@localhost:5432/email_scheduler?schema=public"
REDIS_HOST=localhost
REDIS_PORT=6379
EMAIL_CONCURRENCY=5
MIN_DELAY_MS=1000
PORT=3000
```

### 3. Install Dimensions
**Server:**
```bash
cd server
npm install
npx prisma migrate dev  # Initialize Database
npm run dev             # Start Backend (Port 3000)
```

**Client:**
```bash
cd client
npm install
npm run dev             # Start Frontend (Port 5173)
```
Note: Replace GOOGLE_CLIENT_ID variable with your Google Client ID in the App.tsx file to use Google OAuth.

---

## 📐 Architecture Overview

### Scheduling Strategy
When a campaign is created:
1. **Base Time Calculation**: The system determines the start time (`sendAt` or `now`).
2. **Interval Calculation**: Based on the `Hourly Limit`, an interval is calculated (`3600s / limit`).
3. **Distribution**: Emails are distributed along the timeline: `Time(i) = BaseTime + (i * Interval)`.
4. **Queueing**: Each email is added to BullMQ with a specific `delay`, ensuring it is processed exactly when intended.

### Persistence & Reliability
- **On Restart**: BullMQ stores pending and delayed jobs in Redis on disk. If the server crashes, jobs resume automatically upon restart.
- **Double-Entry Bookkeeping**: 
  - The job queue manages execution.
  - The Postgres database tracks the official status. 
  - If a job fails, the DB status is updated to `FAILED`.

### Rate Limiting & Concurrency
- **Concurrency**: Controlled by the worker config (`email.concurrency`). This limits how many *connections* updates open to the SMTP server simultaneously.
- **Rate Limiting**: We use a **Token Bucket** approach simulated via Redis counters per user per hour.
  - Ideally handled at schedule time (Pre-calculation).
  - **Safety Net**: The worker also checks a Redis counter before sending. If a user exceeds their quota (e.g. by parallel requests), the job is *re-scheduled* (delayed) to the next hour automatically.
- **Global Throttling**: A minimum delay of **1 second** (`MIN_DELAY_MS`) is enforced between every email send to prevent overwhelming the SMTP provider, regardless of user quotas.

### Ethereal Email
Used [Ethereal Email](https://ethereal.email/) for safe testing. 
- The server console logs a **Preview URL** for every sent email.
- You can view the rendered email content by clicking these links.

---