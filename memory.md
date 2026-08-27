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
- React frontend implemented for Case T-001 with responsive tribunal panels and telemetry.
- Babel/Jest JSX and jsdom configuration added for frontend component testing.
- React frontend connected to `/api/verdict` with response rendering and telemetry updates.
- Application startup test isolated with an ephemeral port for reliable parallel Jest execution.
- Backend `/api/verdict` aligned with the React response contract and independent judge telemetry.
- Tribunal case history retrieval implemented through `GET /api/cases`.
- Frontend tribunal history sidebar implemented with populated, empty, and error states.
- History sidebar selection restores saved tribunal runs into the main view.
- Agent instructions (`CLAUDE.md`) configured with tech stack (React, Node.js, Express, MongoDB) and strict TDD workflow.
- Express backend (`app.js`) created with `/api/status` and `/api/verdict` endpoints.
- TDD testing protocol implemented: 25 tests written and passing.

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
- [x] React frontend implemented with charge sheet, model toggle, tribunal panels, states, and budget footer.
- [x] JSX-aware Babel/Jest tooling configured and production frontend build verified.
- [x] Frontend `/api/verdict` integration implemented with judge, advocate, loading, error, and budget states.
- [x] Parallel Jest port collision fixed without changing production default port 3000.
- [x] `/api/verdict` returns independent judges, advocates, and aggregated free-model telemetry.
- [x] Tribunal case history retrieved from MongoDB through `GET /api/cases`.
- [x] Frontend history sidebar implemented with responsive case browsing.
- [x] History selection restores charge sheet, opinions, arguments, and telemetry.

**Next Immediate Tasks:**
- Improve saved-run navigation and history metadata presentation.

**Active Context/Blockers:**
- None currently. Saved tribunal run selection and restoration are implemented and verified.