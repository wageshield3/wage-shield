# Wage Shield

Voice-first wage evidence and complaint tool for daily-wage workers in India.

**Live demo:** https://wage-shield-nine.vercel.app

## The problem
Daily-wage workers like Ramesh, a mason in Karnataka, are promised ₹800 a day but paid in small, irregular amounts. When they complain, they have no proof, and many cannot read or type easily.

## What Wage Shield does
- **Log a day by voice or taps** in Kannada, Hindi or English. The app reads the entry back and the worker confirms with one big button.
- **Unpaid balance and evidence timeline.** All totals are calculated in code, never by AI.
- **Complaint letter** that can be printed as a PDF.
- **Share with a legal-aid partner** after the worker gives consent, and track the case status.
- **Helper mode:** a family member or volunteer, linked with a 6-character code, can log days on behalf of a worker.

## Demo accounts (sample data only)
| Role | Email | Password |
|---|---|---|
| Worker | abc@worker.com | Abc@worker |
| Helper | xyz@helper.com | Xyz@worker |
| Partner (simulated NGO) | ngo@wageshield.test | 123456 |

You can also create your own worker or helper account on the signup page.

## Tech stack
Next.js 16 and React, Tailwind CSS, Supabase (Postgres, Auth, Storage, Row Level Security), Sarvam AI (Kannada and Hindi speech-to-text, text-to-speech and language model), deployed on Vercel.

## Responsible design
- Consent is asked before a case is shared.
- "Guidance, not legal advice" notice on the worker screens.
- The legal-aid partner is a **simulated demo organization**. No real NGO is claimed as a partner.
- All data in this project is sample data.
- Row Level Security: workers see only their own data, helpers see only linked workers, and the partner sees only cases shared with it.

## Limitations
This is a hackathon prototype. A real rollout would need verified NGO accounts and agreements, data-protection review, and verified legal references for each state.

## Run locally
```
npm install
npm run dev
```
Create `.env.local` with `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY` and `SARVAM_API_KEY`. Run the SQL files in the `supabase` folder in your Supabase project.
