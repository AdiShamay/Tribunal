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
- Express application wiring completed in `app.js`: JSON parsing, API routes, `/api/status`, API-only 404 handling, production static-file serving from `client/dist`, and SPA fallback to `client/dist/index.html`.
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
- React history and restore bugs fixed: the sidebar now shows only a case title, formatted timestamp, and execution mode; selecting a past case restores the saved judges, advocates, and telemetry into the main tribunal view.
- Actual AI response persistence fixed: both unified and matrix verdict flows now require structured OpenRouter JSON, map generated judge and advocate content to judgeVerdicts and advocateArguments, reject incomplete responses instead of saving placeholders, and persist before res.json().
- History timestamps now use the Israeli/European 24-hour format DD/MM/YYYY HH:mm without seconds.
- Telemetry persistence fixed: TribunalCase stores promptTokens, completionTokens, and cost; verdict execution passes the aggregated values into MongoDB, and selecting a saved case restores them to the frontend budget footer.
- Unified Model participant enforcement fixed: the system prompt now requires exactly Barak, Elon, and Shamgar plus Jon Snow, Tyrion Lannister, Daenerys Targaryen, and Grey Worm; incomplete, duplicate, or hallucinated participant lists are rejected before persistence.
- Frontend incomplete-response fallback fixed: the Judges and Advocates panels merge returned data into the canonical seven participant slots so a partial response cannot make UI participants disappear.
- LLM response sanitization fixed: the verdict parser now removes markdown backticks and extracts the first complete JSON object from conversationally wrapped responses; all OpenRouter role prompts explicitly require raw JSON without markdown or conversational text.
- Robust JSON extraction fixed: `sanitizeJSON(rawText)` removes markdown fences and extracts the complete substring from the earliest `{` or `[` through the latest `}` or `]`, while invalid matrix responses log their raw LLM output before throwing. OpenRouter requests now allow at least 3000 completion tokens.
- Unified validation made resilient: judge and advocate arrays now accept canonical and alternate panel keys (`judges`/`Judges`/`JudgesPanel` and equivalent advocate names), partial arrays are handled without completeness errors, and missing arrays log the parsed object with `FAILED OBJECT:` before throwing.
- Unified JSON diagnostics strengthened: the exact raw OpenRouter response is logged before sanitization, the Unified Model prompt requires the `{ "judges": [...], "advocates": [...] }` wrapper with no extra text, and null parsing now throws `LLM failed to output JSON` before array validation.

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
- [x] Actual structured LLM judge and advocate data persisted to MongoDB and verified with regression coverage.
- [x] European history date formatting and telemetry persistence/restoration verified with focused and full test coverage.
- [x] Unified participant-name/count enforcement and frontend seven-slot fallback verified with 14 suites and 39 tests.
- [x] Markdown and conversational LLM response sanitization verified with 14 suites and 40 tests.
- [x] Robust object-or-array JSON extraction, raw invalid-output logging, and 3000-token completion capacity verified with focused tests and production build.
- [x] Flexible unified array-key validation, partial-array handling, and failed-object diagnostics verified with 13 suites and 42 tests.
- [x] Raw Unified Model response logging, strict structural prompt guidance, and clear null-parse error handling verified with 13 suites and 44 tests.

**Next Immediate Tasks:**
- Project complete; future work can improve saved-run navigation and metadata presentation. The README was intentionally left unchanged during the documentation refresh.

**Active Context/Blockers:**
- Changed behavior and production build are verified. The full Jest run has one stale assertion in `tests/server.test.js`: it expects `/unknown` to return 404, while the app.js SPA fallback intentionally serves `client/dist/index.html` with 200 for non-API routes. The other 13 suites pass (46 tests).