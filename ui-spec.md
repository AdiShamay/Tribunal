# UI & Architecture Specification

## 1. Information Hierarchy & Layout
- **Container:** The application must be centered on the screen with a readable max-width (e.g., 1200px) and clean padding.
- **Header:** Title ("The Tribunal: Case T-001") centered at the top.
- **Visual Flow:** Top-to-bottom progression. Input at the top, Execution controls in the middle, Verdicts (The Protocol) below, and Telemetry at the absolute bottom.

## 2. Interaction Model & Input
- **Charge Sheet Area:** A prominent, disabled/read-only text area displaying the canonical facts of the Jon Snow case so the user knows what is being judged.
- **Model Toggle:** A clear switch or radio button group centered above the main action button.
  - Option A: "Unified Model" (Single LLM).
  - Option B: "Multi-Model Matrix" (Distinct LLMs).
- **Primary Action Button:** A large, distinctly styled, centered button labeled "Commence Tribunal".

## 3. The Protocol (Output Hierarchy)
The verdict must never be buried; it comes first.
- **The Judicial Panel (Top Output):** A 3-column grid layout displaying the verdicts from Barak, Elon, and Shamgar side-by-side.
  - Each column must clearly state the judge's name, the binary decision (Justified / Not Justified), and their reasoning. 
  - The verdicts MUST NOT be combined or summarized.
- **The Advocate Arguments (Bottom Output):** A 4-column grid (or 2x2 grid) placed below the judges, displaying the full persuasive speeches from Jon, Tyrion, Daenerys, and Grey Worm.

## 4. Feedback & Bad States
- **Loading State:** While waiting for the models (which can take several seconds), the primary button must disable, and a clear loading indicator (e.g., "The Tribunal is deliberating...") must appear.
- **Error State:** Silent failures are prohibited. If an OpenRouter API call fails or times out, display a visible red error message box above the protocol area.

## 5. Telemetry & Budget
- **Budget Footer:** A fixed or clearly separated footer element displaying:
  - Total Prompt Tokens
  - Total Completion Tokens
  - Total Run Cost (Must dynamically calculate and display $0.00 for free models).