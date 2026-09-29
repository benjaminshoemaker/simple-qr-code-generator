# AGENTS.md

Project-wide guidance for AI agents working on Simple QR Code Generator.

- Stack: TypeScript, Next.js App Router, Tailwind CSS, Drizzle, Neon,
  Auth.js/NextAuth, and Stripe.
- Run `npm run dev` for local development at `http://localhost:3000`.
- Existing plans are historical product context, not a mandatory workflow.
- Make the smallest change that satisfies the request and follow existing patterns.
- Do not duplicate files as a workaround or introduce APIs without calling out
  the impact.
- Add or update tests for behavior changes and run project-native checks before
  reporting completion.
- Preserve unrelated work and read complete error output before fixing failures.
- Record out-of-scope ideas and technical debt in `TODOS.md`.

Treat instruction, automation, CI, authentication, billing, and security files
as high-impact configuration. Git history is the recovery path for retired
workflow material.
