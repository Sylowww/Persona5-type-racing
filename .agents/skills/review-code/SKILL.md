---
name: review-code
description: Review project code or a pull request for bugs, regressions, security issues, architecture problems and missing tests.
---

# Review Code

Inspect the changed code and relevant surrounding code.

Prioritize:

1. Bugs and regressions.
2. Security vulnerabilities.
3. Missing server-side authorization.
4. Client-trusted competitive state.
5. Race/reconnection/real-time synchronization problems.
6. Database integrity problems.
7. Incorrect TypeScript usage.
8. Missing or insufficient tests.
9. Violations of AGENTS.md.
10. Unnecessary complexity or unrelated changes.

Report concrete findings with the affected file/location and explain the impact.

Prioritize real problems over style preferences.

If no meaningful issue is found, say so clearly.
