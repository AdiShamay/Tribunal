## Express Startup and Hosting

- Keep the Express app export separate from process startup so tests and other callers can import the app without opening a listener.
- Put database initialization in `startServer()` and await it before `app.listen()`. This prevents persistence-dependent endpoints from accepting traffic before MongoDB is ready.
- Use `process.env.PORT || 3000` for deployment compatibility while allowing tests to pass an ephemeral port such as `0`.
- Mount API-only 404 handling before the frontend static middleware so unmatched `/api/*` requests return JSON.
- Serve the built React application from `client/dist` and send its `index.html` for non-API fallback requests so browser-side routing works in production.
- Keep the API 404 contract distinct from the SPA fallback contract: unknown API paths return JSON 404, while unknown browser paths resolve to the frontend entry point.

## LLM Response Reliability

- Require structured JSON from unified and matrix model calls, then sanitize wrapped responses before validation.
- Validate participant identity and required fields before persisting a tribunal case; never save placeholder model output as completed opinion.
- Preserve independent judge opinions and advocate arguments in both the API response and MongoDB record.

## Verification

- Focused tests and the production frontend build provide the most useful signal for changes in the touched slice.
- A fixed-port integration test can fail when port 3000 is already occupied; prefer ephemeral ports for isolated startup tests.
