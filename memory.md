# Project Memory

**Current Status:**
- Initial project structure created.
- GitHub repository initialized and connected.
- OpenRouter API key secured in `.env` (excluded via `.gitignore`).
- OpenRouter service implemented with Axios, a free model, and token/cost tracking.
- Advocate and judge API routes/controllers implemented and integrated with the OpenRouter service.
- MongoDB connection utility implemented with Mongoose and `MONGODB_URI`.
- TribunalCase Mongoose model implemented with charge sheet, advocate arguments, and judge verdicts.
- Database connection integrated into application startup through `startServer()`.
- Case controller implemented to invoke OpenRouter and persist tribunal cases.
- All API routes mounted in `app.js`, including `POST /api/cases`.
- Agent instructions (`CLAUDE.md`) configured with tech stack (React, Node.js, Express, MongoDB) and strict TDD workflow.
- Express backend (`app.js`) created with `/api/status` and `/api/verdict` endpoints.
- TDD testing protocol implemented: 14 tests written and passing.

**Completed Tasks:**
- [x] Repository setup and Git configuration.
- [x] Context files creation (`CLAUDE.md`, `.env`, `.gitignore`).
- [x] Project dependencies installed (express, mongoose, axios, dotenv).
- [x] Test-driven development: wrote failing tests first, implemented code to make them pass.
- [x] Express server created with basic endpoints for tribunal simulation.
- [x] OpenRouter Axios service implemented with free-model selection and usage tracking.
- [x] Advocate and judge routes/controllers implemented with validation and telemetry responses.
- [x] MongoDB connection utility implemented with environment-based configuration.
- [x] TribunalCase Mongoose model implemented with independent advocate and judge records.
- [x] Database connection integrated into application startup.
- [x] Case controller implemented with judge calls and MongoDB persistence.
- [x] All API routes mounted and verified through the main Express application.

**Next Immediate Tasks:**
- Add frontend integration for tribunal case execution.

**Active Context/Blockers:**
- None currently. OpenRouter service, API routes, database utility, model, startup integration, case controller, and route mounting are implemented and verified.