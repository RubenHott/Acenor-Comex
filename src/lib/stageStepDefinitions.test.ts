import { describe, it, expect } from 'vitest';
import {
  REVISION_CONTRATO_STEPS,
  getStageSteps,
  getStepDef,
  isStepConditional,
  getStepsToSkipByPaymentMode,
} from './stageStepDefinitions';

describe('REVISION_CONTRATO_STEPS', () => {
  it('has ordered steps starting from 1', () => {
    expect(REVISION_CONTRATO_STEPS[0].order).toBe(1);
    for (let i = 1; i < REVISION_CONTRATO_STEPS.length; i++) {
      expect(REVISION_CONTRATO_STEPS[i].order).toBeGreaterThan(
        REVISION_CONTRATO_STEPS[i - 1].order
      );
    }
  });

  it('all steps have unique keys', () => {
    const keys = REVISION_CONTRATO_STEPS.map((s) => s.key);
    expect(new Set(keys).size).toBe(keys.length);
  });

  it('includes cierre_proceso as last step', () => {
    const last = REVISION_CONTRATO_STEPS[REVISION_CONTRATO_STEPS.length - 1];
    expect(last.key).toBe('cierre_proceso');
  });
});

describe('getStageSteps', () => {
  it('returns steps for revision_contrato', () => {
    const steps = getStageSteps('revision_contrato');
    expect(steps.length).toBeGreaterThan(0);
    expect(steps[0].key).toBe('recepcion_cierre_compra');
  });

  it('returns empty array for unknown stage', () => {
    const steps = getStageSteps('nonexistent_stage');
    expect(steps).toEqual([]);
  });
});

describe('getStepDef', () => {
  it('returns step definition by key', () => {
    const step = getStepDef('revision_contrato', 'recepcion_cierre_compra');
    expect(step).toBeDefined();
    expect(step!.name).toContain('Recepción');
  });

  it('returns undefined for unknown step key', () => {
    const step = getStepDef('revision_contrato', 'nonexistent');
    expect(step).toBeUndefined();
  });
});

describe('isStepConditional', () => {
  it('identifies conditional steps', () => {
    expect(isStepConditional('revision_contrato', 'subsanacion_nc')).toBe(true);
  });

  it('identifies non-conditional steps', () => {
    expect(isStepConditional('revision_contrato', 'recepcion_cierre_compra')).toBe(false);
  });
});

describe('getStepsToSkipByPaymentMode', () => {
  it('returns steps to skip for a given payment mode', () => {
    const toSkip = getStepsToSkipByPaymentMode('revision_contrato', 'credito_directo');
    expect(Array.isArray(toSkip)).toBe(true);
  });

  it('returns empty array for unknown stage', () => {
    const toSkip = getStepsToSkipByPaymentMode('nonexistent', 'carta_credito');
    expect(toSkip).toEqual([]);
  });
});
