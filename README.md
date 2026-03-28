# CarePulse — Healthcare Patient Management System

A full-stack healthcare management system that streamlines patient registration, appointment scheduling, and medical records management for healthcare providers.

🔗 **Live Demo:** [healthcare-management-system-seven-theta.vercel.app](https://healthcare-management-system-seven-theta.vercel.app)

---

## Architecture Diagram

```
┌─────────────────────────────────────────────────────────────┐
│                        Next.js 14 App                       │
│                                                             │
│  ┌─────────────┐   ┌─────────────┐   ┌─────────────────┐    │
│  │  Patient    │   │    Admin    │   │   Middleware    │    │
│  │  Pages      │   │  Dashboard  │   │  (Cookie Auth)  │    │
│  └──────┬──────┘   └──────┬──────┘   └────────┬────────┘    │
│         │                 │                    │            │
│  ┌──────▼─────────────────▼────────────────────▼────────┐   │
│  │              Server Actions (Next.js)                │   │
│  │         patient.actions.ts / appointment.actions.ts  │   │
│  └──────────────────────────┬───────────────────────────┘   │
└─────────────────────────────│───────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │         Appwrite Cloud        │
              │                               │
              │  ┌─────────┐  ┌───────────┐   │
              │  │  Auth   │  │ Database  │   │
              │  │ (Users) │  │(Patients/ │   │
              │  └─────────┘  │Appointments│  │
              │               └───────────┘   │
              │  ┌─────────┐  ┌───────────┐   │
              │  │ Storage │  │Messaging  │   │
              │  │ (Docs)  │  │  (SMS)    │   │
              │  └─────────┘  └───────────┘   │
              └───────────────────────────────┘
                              │
              ┌───────────────▼───────────────┐
              │            Sentry             │
              │   Error monitoring & tracing  │
              └───────────────────────────────┘
```

**Flow:**
1. Patient lands on homepage → fills basic details → redirected to register page
2. Patient fills full medical profile → redirected to new appointment page
3. Patient books appointment → receives SMS confirmation
4. Admin logs in via passkey → views all appointments → can schedule or cancel
5. On schedule/cancel → patient receives SMS notification

---

## Tech Stack

| Technology | Why I chose it |
|---|---|
| **Next.js 14** | App router gives server components and server actions out of the box — no separate API layer needed for simple CRUD. Built-in file-based routing and image optimization saved significant setup time. |
| **TypeScript** | Healthcare data is sensitive — strict typing catches bugs at compile time rather than runtime. Especially important for patient records where silent failures are unacceptable. |
| **Appwrite** | Open-source BaaS that provides Auth, Database, Storage, and Messaging in one platform. Avoided the complexity of managing separate services. Self-hostable if needed for compliance. |
| **Zod** | Schema validation that works on both client and server. Single source of truth for form validation and API input validation — no duplicated validation logic. |
| **React Hook Form** | Minimal re-renders compared to Formik. Works seamlessly with Zod via `@hookform/resolvers`. The register form has 20+ fields — performance matters. |
| **Tailwind CSS** | Utility-first approach keeps styles co-located with components. No context switching between CSS files. Dark mode support built in. |
| **Sentry** | Production error monitoring with full stack traces. Captures both client and server errors. Critical for a healthcare app where silent failures can affect patient care. |
| **TanStack Table** | Headless table library giving full control over rendering while handling complex logic like pagination and sorting. The admin dashboard needed custom cell renderers for status badges and action buttons. |

---

## Key Technical Decisions & Tradeoffs

### 1. Server Actions over REST API
**Decision:** Used Next.js server actions for all data mutations instead of building a separate API layer.

**Tradeoff:** Faster to build and co-located with the UI. However, server actions are harder to test in isolation and can't be consumed by external clients (e.g., a mobile app). For a single-client app this is acceptable; for a multi-client system a REST or GraphQL API would be better.

### 2. Cookie-based Admin Auth over JWT/localStorage
**Decision:** Admin passkey is verified server-side and stored as an `httpOnly` cookie, replacing the original `localStorage` approach.

**Why it matters:** `localStorage` is accessible via JavaScript, making it vulnerable to XSS attacks. `httpOnly` cookies cannot be read by JavaScript at all. For an admin panel controlling patient data this is non-negotiable.

**Tradeoff:** Slightly more complex to implement. Cannot be used in non-browser environments.

### 3. Appwrite over Supabase or Firebase
**Decision:** Chose Appwrite for backend services.

**Tradeoff:** Appwrite has a smaller community than Firebase and fewer third-party integrations. However, it is open-source (self-hostable for HIPAA compliance), has built-in SMS messaging via its Messaging API, and avoids vendor lock-in to Google. Firebase's Firestore pricing can become unpredictable at scale.

### 4. `useForm<any>` for Complex Form Typing
**Decision:** Used `useForm<any>` instead of strict Zod inference in forms that use `CustomFormField`.

**Why:** `CustomFormField` accepts `Control<any>` in its props. React Hook Form's `Control<T>` type is contravariant — `Control<SpecificType>` is not assignable to `Control<any>` due to how TypeScript handles function parameter types. The tradeoff is losing compile-time type safety on `values` inside `onSubmit`, but Zod still validates all data at runtime before submission.

### 5. Single `parseStringify` Utility
**Decision:** All Appwrite responses are passed through `JSON.parse(JSON.stringify(value))` before returning.

**Why:** Appwrite SDK returns objects with non-serializable properties (prototype methods, circular references). Next.js server actions require all returned data to be serializable. This utility strips non-serializable properties cleanly.

**Tradeoff:** Slight performance overhead on every response. Loses TypeScript class instance methods on returned objects.

---

## How to Run Locally

### Prerequisites
- Node.js 18+
- An [Appwrite Cloud](https://cloud.appwrite.io) account or self-hosted Appwrite instance

### 1. Clone the repository
```bash
git clone https://github.com/Namala-Yeshwanth/healthcare-management-system.git
cd healthcare-management-system
```

### 2. Install dependencies
```bash
npm install
```

### 3. Set up Appwrite
1. Create a new project in Appwrite Console
2. Create a Database with three collections: `patients`, `appointments`, `doctors`
3. Create a Storage bucket for identification documents
4. Create an API key with full permissions
5. Enable SMS messaging (optional — for appointment notifications)

### 4. Configure environment variables
Create a `.env.local` file in the root:
```env
NEXT_PUBLIC_ENDPOINT=https://cloud.appwrite.io/v1
PROJECT_ID=your_project_id
API_KEY=your_api_key
DATABASE_ID=your_database_id
PATIENT_COLLECTION_ID=your_patient_collection_id
APPOINTMENT_COLLECTION_ID=your_appointment_collection_id
DOCTOR_COLLECTION_ID=your_doctor_collection_id
NEXT_PUBLIC_BUCKET_ID=your_bucket_id
ADMIN_PASSKEY=123456
NEXT_PUBLIC_SENTRY_DSN=your_sentry_dsn
```

### 5. Run the development server
```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

### 6. Access admin dashboard
Navigate to `http://localhost:3000/?admin=true` and enter your `ADMIN_PASSKEY`.

---

## How to Run Tests

> Tests are not yet implemented — this is listed as a known limitation and a planned improvement.

When tests are added, they will be run with:

```bash
# Unit and component tests
npm run test

# Watch mode
npm run test:watch

# End-to-end tests
npm run test:e2e
```

---

## Known Limitations

**No automated tests**
There are currently no unit, component, or end-to-end tests. This is the most significant gap for production readiness.

**Phone number uniqueness**
Appwrite enforces globally unique phone numbers per project. If a user attempts to register with a phone number already in the system, they are redirected as the existing user rather than creating a new account. Users must use a unique phone number per account.

**Single admin account**
The admin system uses a single shared passkey rather than individual admin accounts. There is no way to audit which admin performed which action.

**No doctor-facing portal**
Doctors are currently static data in `constants/index.ts`. There is no way for doctors to log in, manage their availability, or view their own appointment schedule.

**No real-time updates**
The admin dashboard does not update in real time. Admins must manually refresh to see new appointments.

**HIPAA compliance**
This project is not HIPAA compliant in its current state. Patient data is stored without field-level encryption, there are no formal audit logs, and no Business Associate Agreement exists with Appwrite. It should not be used in production with real patient data without significant compliance work.

**Next.js security vulnerability**
The project currently uses Next.js 14.2.3 which has a known security vulnerability. Upgrading to Next.js 15 is planned.

---

## What I Would Do With More Time

**Immediate priorities**
- Upgrade to Next.js 15 to patch the security vulnerability
- Add Jest + React Testing Library unit tests for all utility functions and server actions
- Add Playwright end-to-end tests for the three critical user flows: registration, appointment booking, and admin approval
- Add environment variable validation with Zod at startup so misconfigured deployments fail fast with clear error messages

**Feature additions**
- Doctor portal — separate login, availability management, appointment view
- Real-time appointment updates using Appwrite Realtime subscriptions
- Email notifications alongside SMS using Resend or Appwrite's email provider
- Appointment reminder system (24 hours and 1 hour before)
- Patient portal — view appointment history, cancel own appointments, update profile
- Analytics dashboard for admins — appointments per day, cancellation rate, doctor utilization

**AI integration**
- AI symptom checker before booking using Vercel AI SDK — patient describes symptoms, AI suggests appropriate specialist
- Auto-summary of patient medical history for doctors before appointments
- Smart scheduling — AI suggests optimal appointment slots based on urgency and availability

**Production readiness**
- Field-level encryption for sensitive PHI (protected health information)
- Formal audit logging for every data access and modification
- Rate limiting on all API routes
- Individual admin accounts with role-based permissions
- Proper HIPAA compliance review and BAA with Appwrite

---

## Project Structure

```
├── app/
│   ├── admin/              # Admin dashboard
│   ├── api/admin-auth/     # Passkey verification endpoint
│   ├── patients/[userId]/  # Patient pages (register, appointment, success)
│   ├── layout.tsx
│   └── page.tsx            # Homepage with patient form
├── components/
│   ├── forms/              # PatientForm, RegisterForm, AppointmentForm
│   ├── table/              # DataTable, columns
│   ├── AppointmentModal.tsx
│   ├── CustomFormField.tsx
│   └── PasskeyModal.tsx
├── lib/
│   ├── actions/            # Server actions (patient, appointment)
│   ├── appwrite.config.ts  # Appwrite client setup
│   ├── utils.ts
│   └── validation.ts       # Zod schemas
├── types/
│   ├── appwrite.types.ts   # Patient, Appointment interfaces
│   └── index.d.ts          # Global type declarations
└── constants/index.ts      # Doctors, form defaults, status icons
```

---

## License

MIT

---

*Built with Next.js, Appwrite, and TypeScript*
