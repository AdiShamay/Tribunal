const TribunalCase = require('../models/tribunal-case.model');

describe('TribunalCase model', () => {
  it('should define the charge sheet, advocate arguments, and judge verdicts fields', () => {
    expect(TribunalCase.modelName).toBe('TribunalCase');
    expect(TribunalCase.schema.path('chargeSheet')).toBeDefined();
    expect(TribunalCase.schema.path('chargeSheet').isRequired).toBe(true);
    expect(TribunalCase.schema.path('advocateArguments').instance).toBe('Array');
    expect(TribunalCase.schema.path('judgeVerdicts').instance).toBe('Array');
    expect(TribunalCase.schema.path('telemetry.promptTokens')).toBeDefined();
    expect(TribunalCase.schema.path('telemetry.completionTokens')).toBeDefined();
    expect(TribunalCase.schema.path('telemetry.cost')).toBeDefined();
  });

  it('should validate a complete tribunal case without a database connection', () => {
    const tribunalCase = new TribunalCase({
      chargeSheet: 'The Realm v. Jon Snow',
      advocateArguments: [
        { role: 'Jon Snow defense', argument: 'The killing prevented imminent harm.' }
      ],
      judgeVerdicts: [
        { judge: 'Judge Barak', verdict: 'Justified', reasoning: 'Necessary defense of others.' }
      ]
    });

    expect(tribunalCase.validateSync()).toBeUndefined();
  });

  it('should reject a case without a charge sheet', () => {
    const tribunalCase = new TribunalCase({
      advocateArguments: [],
      judgeVerdicts: []
    });

    expect(tribunalCase.validateSync().errors.chargeSheet).toBeDefined();
  });
});
