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
- Final Jest verification and clean production build completed; README instructions documented.
- OpenRouter now discovers active free models dynamically with a fallback list.
- OpenRouter prioritizes known free models and retries the next candidate on 429/500 responses.
- OpenRouter completion failures now log the structured API response payload.
- Agent instructions (`CLAUDE.md`) configured with tech stack (React, Node.js, Express, MongoDB) and strict TDD workflow.
- Express backend (`app.js`) created with `/api/status` and `/api/verdict` endpoints.
- TDD testing protocol implemented: 32 tests written and passing.
- Unified-model generation fixed: the OpenRouter system prompt now enforces JSON-only output with a strict schema, word limits, and compact verdict/argument fields.
- Multi-model matrix generation fixed: each parallel judge and advocate API call now uses a role-specific JSON-only system prompt that enforces the 50-word judge cap and 80-word advocate cap, while preserving the required JSON structure.
- Frontend verdict normalization fixed: React now reads judge verdicts and advocate arguments from the structured model response and renders both arrays reliably.
- MongoDB persistence fixed: completed tribunal verdicts are explicitly saved via TribunalCase.create() before the API returns the verdict payload, and any Mongoose failure is logged with a full console.error stack for debugging.

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
- [x] Final test suite, production build, and README documentation verified.
- [x] OpenRouter dynamic free-model discovery and fallback behavior verified.
- [x] OpenRouter priority ordering and 429/500 retry resilience verified.
- [x] Structured OpenRouter API error-response logging verified.

**Next Immediate Tasks:**
- Project complete; future work can improve saved-run navigation and metadata presentation.

**Active Context/Blockers:**
- None currently. Tribunal implementation, tests, production build, and documentation are verified.