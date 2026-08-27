const mongoose = require('mongoose');

const advocateArgumentSchema = new mongoose.Schema({
  role: { type: String, required: true },
  argument: { type: String, required: true }
}, { _id: false });

const judgeVerdictSchema = new mongoose.Schema({
  judge: { type: String, required: true },
  verdict: { type: String, required: true },
  reasoning: { type: String, required: true }
}, { _id: false });

// The case stores every advocate and judge opinion independently so the
// tribunal can preserve the required multi-perspective record without merging
// the judicial decisions into a single verdict.
const tribunalCaseSchema = new mongoose.Schema({
  chargeSheet: { type: String, required: true },
  advocateArguments: { type: [advocateArgumentSchema], default: [] },
  judgeVerdicts: { type: [judgeVerdictSchema], default: [] }
});

module.exports = mongoose.model('TribunalCase', tribunalCaseSchema);