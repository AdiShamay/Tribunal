import { useEffect, useState } from 'react';
import './styles.css';

const chargeSheet = `CASE T-001: The Realm v. Jon Snow

Accused: Jon Snow
Deceased: Daenerys Targaryen
Act alleged: Jon intentionally killed Daenerys by stabbing her during a private meeting in the throne room after the fall of King's Landing.

Agreed factual record:
1. King's Landing had surrendered, but Daenerys then used Drogon against streets and civilians, causing destruction on a vast scale.
2. Daenerys announced that the campaign of liberation would continue beyond King's Landing.
3. Tyrion warned Jon that Daenerys would treat his sisters and other obstacles as enemies.
4. Daenerys refused Jon's request for mercy and presented her own judgment as decisive.
5. Daenerys was unarmed and not attacking Jon. He used their intimacy to get close enough to strike and did not first attempt detention or a public surrender of power.

Issue: Was Jon's intentional killing justified as the necessary defense of others and the realm?

Scope: Decide only justified or not justified, provide reasons, and impose no sentence.`;

const initialJudges = [
  { name: 'Barak', decision: 'Awaiting decision', reasoning: 'The judicial opinion will appear here after deliberation.' },
  { name: 'Elon', decision: 'Awaiting decision', reasoning: 'The judicial opinion will appear here after deliberation.' },
  { name: 'Shamgar', decision: 'Awaiting decision', reasoning: 'The judicial opinion will appear here after deliberation.' }
];

const advocates = [
  { name: 'Jon Snow', side: 'Defense', argument: 'The defense argument will appear here after deliberation.' },
  { name: 'Tyrion Lannister', side: 'Defense', argument: 'The defense argument will appear here after deliberation.' },
  { name: 'Daenerys Targaryen', side: 'Prosecution', argument: 'The prosecution argument will appear here after deliberation.' },
  { name: 'Grey Worm', side: 'Prosecution', argument: 'The prosecution argument will appear here after deliberation.' }
];

function App() {
  const [modelMode, setModelMode] = useState('matrix');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState('');
  const [activeChargeSheet, setActiveChargeSheet] = useState(chargeSheet);
  const [judges, setJudges] = useState(initialJudges);
  const [advocateResults, setAdvocateResults] = useState(advocates);
  const [caseHistory, setCaseHistory] = useState([]);
  const [telemetry, setTelemetry] = useState({ promptTokens: 0, completionTokens: 0, cost: 0 });

  function restoreCase(tribunalCase) {
    setActiveChargeSheet(tribunalCase.chargeSheet);
    setJudges((currentJudges) => currentJudges.map((judge, index) => {
      const savedVerdict = tribunalCase.judgeVerdicts?.[index];
      return savedVerdict ? {
        name: savedVerdict.judge || judge.name,
        decision: savedVerdict.verdict || judge.decision,
        reasoning: savedVerdict.reasoning || judge.reasoning
      } : judge;
    }));
    setAdvocateResults(tribunalCase.advocateArguments || advocates);
    setTelemetry({
      promptTokens: tribunalCase.telemetry?.promptTokens || 0,
      completionTokens: tribunalCase.telemetry?.completionTokens || 0,
      cost: tribunalCase.telemetry?.totalRunCost || 0
    });
  }

  useEffect(() => {
    async function loadCaseHistory() {
      try {
        const response = await fetch('/api/cases');
        if (!response.ok) {
          throw new Error('History service unavailable');
        }

        const history = await response.json();
        setCaseHistory(Array.isArray(history) ? history : []);
      } catch (historyError) {
        setError(historyError.message);
      }
    }

    loadCaseHistory();
  }, []);

  async function commenceTribunal() {
    setIsLoading(true);
    setError('');

    try {
      // The selected orchestration mode travels with the case so the backend
      // can choose between one shared model and distinct model perspectives.
      const response = await fetch('/api/verdict', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          modelMode,
          chargeSheet: activeChargeSheet,
          advocates: advocateResults,
          judgePrompts: judges.map(({ name }) => ({ judge: name, prompt: activeChargeSheet }))
        })
      });

      if (!response.ok) {
        throw new Error('The tribunal could not complete its deliberation.');
      }

      const result = await response.json();
      const verdicts = result.judges || result.judgeVerdicts || [];
      setJudges((currentJudges) => currentJudges.map((judge, index) => ({
        ...judge,
        decision: verdicts[index]?.decision || verdicts[index]?.verdict || judge.decision,
        reasoning: verdicts[index]?.reasoning || judge.reasoning
      })));

      setAdvocateResults(result.advocates || advocateResults);
      const responseTelemetry = result.telemetry || {};
      const usage = verdicts.reduce((total, verdict) => ({
        promptTokens: total.promptTokens + (verdict.usage?.promptTokens || 0),
        completionTokens: total.completionTokens + (verdict.usage?.completionTokens || 0),
        cost: total.cost + (verdict.usage?.estimatedCost || 0)
      }), {
        promptTokens: responseTelemetry.promptTokens || 0,
        completionTokens: responseTelemetry.completionTokens || 0,
        cost: responseTelemetry.totalRunCost || 0
      });
      setTelemetry(usage);
    } catch (requestError) {
      setError(requestError.message);
    } finally {
      setIsLoading(false);
    }
  }

  return (
    <div className="page-layout">
      <aside className="history-sidebar" aria-label="Tribunal history">
        <div className="section-kicker">Archive / Previous runs</div>
        <h2>Tribunal History</h2>
        {caseHistory.length === 0 ? (
          <p className="history-empty">No previous tribunal cases.</p>
        ) : (
          <div className="history-list">
            {caseHistory.map((tribunalCase) => (
              <button
                className="history-item"
                key={tribunalCase._id}
                type="button"
                aria-label={`Restore ${tribunalCase._id}`}
                onClick={() => restoreCase(tribunalCase)}
              >
                <div className="history-case-id">{tribunalCase._id}</div>
                <h3>{tribunalCase.chargeSheet}</h3>
                {tribunalCase.judgeVerdicts?.map((verdict) => (
                  <p className="history-verdict" key={`${tribunalCase._id}-${verdict.judge}`}>
                    {verdict.judge} / {verdict.verdict}
                  </p>
                ))}
              </button>
            ))}
          </div>
        )}
      </aside>

      <main className="app-shell">
        <div className="top-rule" />
        <header className="masthead">
        <p className="eyebrow">CASE T-001 / THE REALM v. JON SNOW</p>
        <h1>The Tribunal: Case T-001</h1>
        <p className="subtitle">A recorded exercise in necessity, authority, and the limits of power.</p>
      </header>

      <section className="case-input">
        <div className="section-kicker">01 / The record</div>
        <h2 id="charge-sheet-heading">Charge Sheet</h2>
        <label className="sr-only" htmlFor="charge-sheet">Charge sheet</label>
        <textarea id="charge-sheet" value={activeChargeSheet} readOnly />
      </section>

      <section className="command-deck" aria-labelledby="command-heading">
        <div>
          <div className="section-kicker">02 / The protocol</div>
          <h2 id="command-heading">Commence the hearing</h2>
        </div>
        <fieldset className="model-toggle">
          <legend>Model configuration</legend>
          <label className={modelMode === 'unified' ? 'toggle-option selected' : 'toggle-option'}>
            <input
              type="radio"
              name="model-mode"
              value="unified"
              checked={modelMode === 'unified'}
              onChange={(event) => setModelMode(event.target.value)}
            />
            <span>Unified Model</span>
          </label>
          <label className={modelMode === 'matrix' ? 'toggle-option selected' : 'toggle-option'}>
            <input
              type="radio"
              name="model-mode"
              value="matrix"
              checked={modelMode === 'matrix'}
              onChange={(event) => setModelMode(event.target.value)}
            />
            <span>Multi-Model Matrix</span>
          </label>
        </fieldset>
        <button className="commence-button" type="button" onClick={commenceTribunal} disabled={isLoading}>
          {isLoading ? 'Deliberation in progress' : 'Commence Tribunal'}
          <span aria-hidden="true">↗</span>
        </button>
        {isLoading && <p className="loading-message" role="status">The Tribunal is deliberating...</p>}
      </section>

      {error && <div className="error-banner" role="alert">{error}</div>}

      <section className="protocol-section" aria-labelledby="judicial-panel-heading">
        <div className="section-kicker">03 / The opinions</div>
        <div className="section-title-row">
          <h2 id="judicial-panel-heading">Judicial Panel</h2>
          <span className="section-note">Three independent readings</span>
        </div>
        <div className="judge-grid">
          {judges.map((judge) => (
            <article className="judge-card" key={judge.name}>
              <div className="card-index">JUDICIAL OPINION</div>
              <h3>{judge.name}</h3>
              <div className="decision-label">Decision</div>
              <p className="decision">{judge.decision}</p>
              <div className="reasoning-label">Reasoning</div>
              <p className="reasoning">{judge.reasoning}</p>
            </article>
          ))}
        </div>
      </section>

      <section className="protocol-section advocates-section" aria-labelledby="advocate-arguments-heading">
        <div className="section-kicker">04 / The voices</div>
        <div className="section-title-row">
          <h2 id="advocate-arguments-heading">Advocate Arguments</h2>
          <span className="section-note">Four persuasive speeches</span>
        </div>
        <div className="advocate-grid">
          {advocateResults.map((advocate) => (
            <article className="advocate-card" key={advocate.name}>
              <div className="advocate-topline"><span>{advocate.side}</span><span>ARGUMENT</span></div>
              <h3>{advocate.name}</h3>
              <p>{advocate.argument}</p>
            </article>
          ))}
        </div>
      </section>

        <footer className="budget-footer" aria-label="Budget telemetry">
        <div className="budget-heading"><span className="section-kicker">05 / Telemetry</span><strong>Run budget</strong></div>
        <div className="metric"><span>Total Prompt Tokens</span><strong>{telemetry.promptTokens}</strong></div>
        <div className="metric"><span>Total Completion Tokens</span><strong>{telemetry.completionTokens}</strong></div>
        <div className="metric cost-metric"><span>Total Run Cost</span><strong>${telemetry.cost.toFixed(2)}</strong></div>
        </footer>
      </main>
    </div>
  );
}

export default App;
