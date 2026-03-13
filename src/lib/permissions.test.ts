import { describe, it, expect } from 'vitest';
import { canDo, canDoAny } from './permissions';

describe('canDo', () => {
  it('returns false when role is undefined', () => {
    expect(canDo(undefined, 'view_pim')).toBe(false);
  });

  it('admin can do all actions', () => {
    expect(canDo('admin', 'view_pim')).toBe(true);
    expect(canDo('admin', 'delete_pim')).toBe(true);
    expect(canDo('admin', 'advance_stage')).toBe(true);
    expect(canDo('admin', 'split_pim')).toBe(true);
  });

  it('viewer can only view', () => {
    expect(canDo('viewer', 'view_pim')).toBe(true);
    expect(canDo('viewer', 'toggle_checklist')).toBe(false);
    expect(canDo('viewer', 'advance_stage')).toBe(false);
    expect(canDo('viewer', 'delete_pim')).toBe(false);
  });

  it('analista_comex has limited actions', () => {
    expect(canDo('analista_comex', 'view_pim')).toBe(true);
    expect(canDo('analista_comex', 'toggle_checklist')).toBe(true);
    expect(canDo('analista_comex', 'upload_document')).toBe(true);
    expect(canDo('analista_comex', 'add_note')).toBe(true);
    // Cannot do admin-level actions
    expect(canDo('analista_comex', 'delete_pim')).toBe(false);
    expect(canDo('analista_comex', 'advance_stage')).toBe(false);
    expect(canDo('analista_comex', 'split_pim')).toBe(false);
  });

  it('jefe_comex can do most actions', () => {
    expect(canDo('jefe_comex', 'view_pim')).toBe(true);
    expect(canDo('jefe_comex', 'advance_stage')).toBe(true);
    expect(canDo('jefe_comex', 'split_pim')).toBe(true);
    expect(canDo('jefe_comex', 'delete_pim')).toBe(true);
    expect(canDo('jefe_comex', 'assign_stage')).toBe(true);
  });

  it('gerente has same permissions as jefe', () => {
    expect(canDo('gerente', 'advance_stage')).toBe(true);
    expect(canDo('gerente', 'split_pim')).toBe(true);
    expect(canDo('gerente', 'delete_pim')).toBe(true);
  });
});

describe('canDoAny', () => {
  it('returns false when role is undefined', () => {
    expect(canDoAny(undefined, ['view_pim', 'advance_stage'])).toBe(false);
  });

  it('returns true when at least one action is allowed', () => {
    expect(canDoAny('viewer', ['view_pim', 'advance_stage'])).toBe(true);
  });

  it('returns false when no action is allowed', () => {
    expect(canDoAny('viewer', ['advance_stage', 'split_pim'])).toBe(false);
  });
});
