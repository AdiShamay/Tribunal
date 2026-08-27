# Project Memory

**Current Status:**
- Initial project structure created.
- GitHub repository initialized and connected.
- OpenRouter API key secured in `.env` (excluded via `.gitignore`).
- OpenRouter service implemented with Axios, a free model, and token/cost tracking.
- Advocate and judge API routes/controllers implemented and integrated with the OpenRouter service.
- Agent instructions (`CLAUDE.md`) configured with tech stack (React, Node.js, Express, MongoDB) and strict TDD workflow.
- Express backend (`app.js`) created with `/api/status` and `/api/verdict` endpoints.
- TDD testing protocol implemented: 7 tests written and passing.

**Completed Tasks:**
- [x] Repository setup and Git configuration.
- [x] Context files creation (`CLAUDE.md`, `.env`, `.gitignore`).
- [x] Project dependencies installed (express, mongoose, axios, dotenv).
- [x] Test-driven development: wrote failing tests first, implemented code to make them pass.
- [x] Express server created with basic endpoints for tribunal simulation.
- [x] OpenRouter Axios service implemented with free-model selection and usage tracking.
- [x] Advocate and judge routes/controllers implemented with validation and telemetry responses.

**Next Immediate Tasks:**
- Create advocate/prosecution/judge endpoint routes.

**Active Context/Blockers:**
- None currently. OpenRouter service and advocate/judge routes are implemented and verified.