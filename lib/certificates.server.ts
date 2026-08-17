import { getCertificateTrackCode } from '@/lib/utils';
import type { CertificateType } from '@/lib/database.types';

export function getCertificateIdPrefix(track: string, year: number, type: CertificateType): string {
  const typeCode = type === 'completion' ? '' : `-${type === 'achievement' ? 'A' : 'P'}`;
  return `UJ-${getCertificateTrackCode(track)}${typeCode}-${year}-`;
}

// Next sequential index for a track + year + type combination.
// Counts the highest existing trailing number for the exact prefix so web/AI
// tracks and completion/achievement/participation types never collide.
export async function getNextCertificateIndex(supabase: any, track: string, year: number, type: CertificateType): Promise<number> {
  const prefix = getCertificateIdPrefix(track, year, type);
  const { data } = await supabase
    .from('certificates')
    .select('certificate_id')
    .ilike('certificate_id', `${prefix}%`);

  let max = 0;
  for (const row of data || []) {
    const num = parseInt(row.certificate_id.slice(prefix.length), 10);
    if (!isNaN(num) && num > max) max = num;
  }
  return max + 1;
}