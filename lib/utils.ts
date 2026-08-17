import { type ClassValue, clsx } from 'clsx';
import type { CertificateType } from '@/lib/database.types';

// Utility for conditionally joining classNames
export function cn(...inputs: ClassValue[]) {
  return clsx(inputs);
}

// Generate student code: STU-{YEAR}-{NUMBER}
export function generateStudentCode(year: number, index: number): string {
  return `STU-${year}-${String(index).padStart(3, '0')}`;
}

// Generate student profile slug: UJP-{YEAR}-{NUMBER}
export function generateProfileSlug(year: number, index: number): string {
  return `UJP-${year}-${String(index).padStart(4, '0')}`;
}

// Derive a stable 2-letter track code from a track name or opportunity slug.
// internship_track is stored as the opportunity slug (e.g. 'web-development-internship'),
// so we normalize it instead of relying on an exact match.
export function getCertificateTrackCode(track: string): string {
  const normalized = (track || '').toLowerCase().replace(/[^a-z0-9]/g, '');
  if (normalized.includes('ai') && !normalized.includes('web')) return 'AI';
  if (normalized.includes('web') || normalized.startsWith('wd')) return 'WD';
  if (normalized.includes('data')) return 'DA';
  if (normalized.includes('ml')) return 'ML';
  if (normalized.includes('app')) return 'AP';
  return 'GEN';
}

// Generate certificate ID: UJ-{TRACK}-[{TYPE}-]{YEAR}-{NUMBER}
// e.g. UJ-WD-2026-001 (completion), UJ-WD-A-2026-001 (achievement), UJ-WD-P-2026-001 (participation)
export function generateCertificateId(
  track: string,
  year: number,
  index: number,
  type: CertificateType = 'completion'
): string {
  const typeCode = type === 'completion' ? '' : `-${type === 'achievement' ? 'A' : 'P'}`;
  return `UJ-${getCertificateTrackCode(track)}${typeCode}-${year}-${String(index).padStart(3, '0')}`;
}

// Human label for a certificate type
export function getCertificateTypeLabel(type: string): string {
  switch (type) {
    case 'completion':
      return 'Certificate of Completion';
    case 'achievement':
      return 'Statement of Achievement';
    case 'participation':
      return 'Certificate of Participation';
    case 'none':
      return 'Not Eligible';
    default:
      return type;
  }
}

// Format date for display
export function formatDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  });
}

// Format date for short display
export function formatShortDate(dateString: string): string {
  return new Date(dateString).toLocaleDateString('en-IN', {
    year: 'numeric',
    month: 'short',
    day: 'numeric',
  });
}

// Track label
export function getTrackLabel(track: string): string {
  switch (track) {
    case 'web-development':
    case 'web-development-internship':
      return 'Web Development Internship';
    case 'fullstack-ai':
    case 'full-stack-ai-internship':
      return 'Full Stack + AI Internship';
    default:
      return track;
  }
}

// Status color mapping
export function getStatusColor(status: string): string {
  switch (status) {
    case 'pending':
      return 'bg-yellow-500/10 text-yellow-400 border-yellow-500/20';
    case 'reviewing':
      return 'bg-blue-500/10 text-blue-400 border-blue-500/20';
    case 'accepted':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'rejected':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    case 'waitlisted':
      return 'bg-purple-500/10 text-purple-400 border-purple-500/20';
    case 'active':
      return 'bg-green-500/10 text-green-400 border-green-500/20';
    case 'revoked':
      return 'bg-red-500/10 text-red-400 border-red-500/20';
    default:
      return 'bg-gray-500/10 text-gray-400 border-gray-500/20';
  }
}

// Generate a random verification hash
export function generateVerificationHash(): string {
  const chars = 'ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789';
  let result = '';
  for (let i = 0; i < 32; i++) {
    result += chars.charAt(Math.floor(Math.random() * chars.length));
  }
  return result;
}

