# NovaPath — Education & Career Navigator
![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)
![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=nextdotjs)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react)
![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)
![TailwindCSS](https://img.shields.io/badge/TailwindCSS-3.4-38B2AC?logo=tailwindcss)
![Firebase](https://img.shields.io/badge/Firebase-Auth%20%26%20Firestore-orange?logo=firebase)
![Lucide Icons](https://img.shields.io/badge/Lucide-Icons-lightgrey?logo=lucide)


**NovaPath** is an AI-powered guidance platform designed to illuminate educational pathways and career options. Whether you’re choosing a degree, pursuing certifications, or exploring skill-based growth, NovaPath helps you navigate with clarity and structure.

---

## Watch NovaPath in Action

[Watch the demo on YouTube](https://youtu.be/TjKtfPF5r4U)

---

## Features

- **Personalized Career Paths** — Tailored suggestions for job roles, certifications, and degree options.  
- **Courses & Skill Recommendations** — Discover courses and skills aligned with your goals.  
- **Gamified Quiz System** — Self-assessment quizzes to uncover your strengths and map them to suitable career paths.  
- **Nova Assistant Chatbot** — An AI-powered conversational assistant to answer your career and education questions in real-time.  
- **Timeline Visualization** — Plan your educational and career journey step-by-step.
- **Live news update** - real-time news on education, exams, and career opportunities
- **Forum updates/discussion** - Engage with peers and mentors, ask questions, share experiences
- **Nearby government college directory** - courses, cut-offs, facilities, interactive map, location-based search
- **Secure Backend with Next.js & Firebase** — Modern tech stack ensuring safety and scalability.

---

## Tech Stack

| Layer | Technologies |
|-------|---------------|
| Frontend | Next.js (TypeScript), React, Tailwind CSS, Framer Motion |
| Backend & AI | Firebase, GroQ AI, Google Maps API |
| Database | Firestore |
| DevOps | Firebase, GitHub Actions |

---

## Getting Started

### Environment Setup

Before running the project, create a `.env.local` file in the root of your Next.js project and add the following:

```dotenv
# ---------------- AI / LLM ----------------
GROQ_API_KEY=your_groq_api_key

# ---------------- Firebase ----------------
NEXT_PUBLIC_FIREBASE_API_KEY=your_firebase_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_messaging_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
NEXT_PUBLIC_FIREBASE_MEASUREMENT_ID=your_measurement_id

# ---------------- News API ----------------
NEWS_API_KEY=your_news_api_key
```

### Prerequisites

- Node.js **v18+**
- npm, yarn, or pnpm

### Installation

1. Clone the repository
```bash
https://github.com/AbhinavPamadi/NovaPath---Career-Guidance.git

cd NovaPath---Career-Guidance
```

2. Install dependencies
```bash
npm install
```

3. Start development server
```bash
npm run dev
```

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.




