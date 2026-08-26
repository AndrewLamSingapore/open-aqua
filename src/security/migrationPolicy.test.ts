import { readFileSync } from 'node:fs';
import { resolve } from 'node:path';
import { describe, expect, it } from 'vitest';

const sql = readFileSync(resolve(process.cwd(), 'supabase/migrations/202608130001_velyqua_cloud.sql'), 'utf8');

describe('database security migration', () => {
  it('enables and forces RLS with owner checks', () => {
    expect(sql).toContain('enable row level security');
    expect(sql).toContain('force row level security');
    expect(sql.match(/\(select auth\.uid\(\)\) = user_id/g)?.length).toBeGreaterThanOrEqual(4);
    expect(sql).toContain('revoke all on public.tank_documents from anon');
  });

  it('uses a guarded revision write instead of blind overwrites', () => {
    expect(sql).toContain('save_tank_document');
    expect(sql).toContain('and revision = p_expected_revision');
    expect(sql).toContain("errcode = '40001'");
  });
});
