'use client';

import React, { useEffect, useRef, useState } from 'react';
import QRCode from 'qrcode';
import { Download, Linkedin, Link2, Award, ChevronDown, Maximize2, X, ShieldCheck, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { formatDate, getCertificateTypeLabel } from '@/lib/utils';
import toast from 'react-hot-toast';

export interface BadgeOption {
  key: string;
  fullName: string;
  college: string;
  programTitle: string;
  batchName: string;
  studentCode: string;
  certificateId: string | null;
  certificateType: string | null;
  issueDate: string | null;
  label: string;
  sublabel: string;
}

const BADGE_SIZE = 720;
const SCALE = 2;

function roundRect(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number, r: number) {
  ctx.beginPath();
  ctx.moveTo(x + r, y);
  ctx.arcTo(x + w, y, x + w, y + h, r);
  ctx.arcTo(x + w, y + h, x, y + h, r);
  ctx.arcTo(x, y + h, x, y, r);
  ctx.arcTo(x, y, x + w, y, r);
  ctx.closePath();
}

function wrapText(ctx: CanvasRenderingContext2D, text: string, maxWidth: number): string[] {
  const words = text.split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const word of words) {
    const test = line ? `${line} ${word}` : word;
    if (ctx.measureText(test).width > maxWidth && line) {
      lines.push(line);
      line = word;
    } else {
      line = test;
    }
  }
  if (line) lines.push(line);
  return lines;
}

function loadImage(src: string): Promise<HTMLImageElement> {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.crossOrigin = 'anonymous';
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error('image load failed'));
    img.src = src;
  });
}

export default function ShareBadgeCard({
  options,
  profileUrl,
}: {
  options: BadgeOption[];
  profileUrl: string;
}) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [selected, setSelected] = useState(0);
  const [ready, setReady] = useState(false);
  const [preview, setPreview] = useState<string | null>(null);

  const data = options[Math.min(selected, options.length - 1)];

  useEffect(() => {
    setReady(false);
    let cancelled = false;
    const draw = async () => {
      const canvas = canvasRef.current;
      if (!canvas || !data) return;
      canvas.width = BADGE_SIZE * SCALE;
      canvas.height = BADGE_SIZE * SCALE;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;
      ctx.scale(SCALE, SCALE);

      const S = BADGE_SIZE;
      const W = S;
      const H = S;

      // ---- Background ----
      const bg = ctx.createLinearGradient(0, 0, 0, H);
      bg.addColorStop(0, '#0B1120');
      bg.addColorStop(1, '#05080F');
      ctx.fillStyle = bg;
      ctx.fillRect(0, 0, W, H);

      // subtle grid
      ctx.strokeStyle = 'rgba(59,130,246,0.05)';
      ctx.lineWidth = 1;
      for (let x = 0; x < W; x += 36) {
        ctx.beginPath(); ctx.moveTo(x, 0); ctx.lineTo(x, H); ctx.stroke();
      }
      for (let y = 0; y < H; y += 36) {
        ctx.beginPath(); ctx.moveTo(0, y); ctx.lineTo(W, y); ctx.stroke();
      }

      // top accent bar
      const topGrad = ctx.createLinearGradient(0, 0, W, 0);
      topGrad.addColorStop(0, '#3B82F6');
      topGrad.addColorStop(0.5, '#F97316');
      topGrad.addColorStop(1, '#3B82F6');
      ctx.fillStyle = topGrad;
      ctx.fillRect(0, 0, W, 6);

      // corner glow
      const glow = ctx.createRadialGradient(W - 120, 100, 10, W - 120, 100, 260);
      glow.addColorStop(0, 'rgba(59,130,246,0.14)');
      glow.addColorStop(1, 'rgba(59,130,246,0)');
      ctx.fillStyle = glow;
      ctx.fillRect(0, 0, W, H);

      // ---- Logo + brand ----
      try {
        const img = await loadImage('/ujjwalitlogo.png');
        if (cancelled) return;
        const logoSize = 72;
        ctx.drawImage(img, W / 2 - logoSize / 2, 64, logoSize, logoSize);
      } catch {
        if (cancelled) return;
        ctx.fillStyle = '#3B82F6';
        ctx.beginPath();
        ctx.arc(W / 2, 100, 36, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = '900 40px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('U', W / 2, 115);
      }

      ctx.textAlign = 'center';
      ctx.fillStyle = '#F5F5F5';
      ctx.font = '900 30px sans-serif';
      ctx.fillText('UJJWALIT', W / 2, 182);

      ctx.fillStyle = '#F97316';
      ctx.font = '700 15px sans-serif';
      ctx.fillText('DEVELOPERS PROGRAM', W / 2, 206);

      // divider
      ctx.strokeStyle = 'rgba(255,255,255,0.08)';
      ctx.lineWidth = 1;
      ctx.beginPath();
      ctx.moveTo(W / 2 - 120, 226);
      ctx.lineTo(W / 2 + 120, 226);
      ctx.stroke();

      // ---- Credential ----
      ctx.fillStyle = 'rgba(148,163,184,0.9)';
      ctx.font = '700 13px sans-serif';
      ctx.fillText('VERIFIED CREDENTIAL', W / 2, 262);

      const nameLines = wrapText(ctx, data.fullName, W - 160);
      ctx.fillStyle = '#F5F5F5';
      ctx.font = '800 34px sans-serif';
      const nameY = 292;
      nameLines.forEach((line, i) => ctx.fillText(line, W / 2, nameY + i * 40));
      const afterNameY = nameY + nameLines.length * 40;

      ctx.fillStyle = '#94A3B8';
      ctx.font = '600 15px sans-serif';
      let y = afterNameY + 8;
      if (data.college) {
        const lines = wrapText(ctx, data.college, W - 160);
        lines.forEach((line) => { ctx.fillText(line, W / 2, y); y += 22; });
      }
      if (data.programTitle) {
        ctx.fillStyle = '#60A5FA';
        ctx.font = '700 18px sans-serif';
        const lines = wrapText(ctx, data.programTitle, W - 160);
        lines.forEach((line) => { ctx.fillText(line, W / 2, y); y += 26; });
        ctx.fillStyle = '#94A3B8';
        ctx.font = '600 15px sans-serif';
      }
      if (data.batchName) {
        ctx.fillStyle = '#64748B';
        ctx.font = '600 14px sans-serif';
        ctx.fillText(`Batch ${data.batchName}`, W / 2, y + 4);
      }

      // ---- Certificate box ----
      const boxY = 480;
      const boxH = 118;
      roundRect(ctx, 80, boxY, W - 160, boxH, 16);
      ctx.fillStyle = 'rgba(148,163,184,0.06)';
      ctx.fill();
      roundRect(ctx, 80, boxY, W - 160, boxH, 16);
      ctx.strokeStyle = 'rgba(59,130,246,0.35)';
      ctx.lineWidth = 1;
      ctx.stroke();

      ctx.textAlign = 'left';
      ctx.fillStyle = '#64748B';
      ctx.font = '700 11px sans-serif';
      ctx.fillText('CERTIFICATE ID', 110, boxY + 34);

      ctx.fillStyle = '#E2E8F0';
      ctx.font = '700 20px monospace';
      ctx.fillText(data.certificateId || '—', 110, boxY + 62);

      ctx.fillStyle = '#64748B';
      ctx.font = '500 11px sans-serif';
      ctx.fillText(`Issued ${data.issueDate ? formatDate(data.issueDate) : '—'} · ${data.studentCode}`, 110, boxY + 86);

      // QR code on the right
      try {
        const qrCanvas = document.createElement('canvas');
        await QRCode.toCanvas(qrCanvas, profileUrl, { width: 84, margin: 1, color: { dark: '#0B1120', light: '#F8FAFC' } });
        if (cancelled) return;
        ctx.drawImage(qrCanvas, W - 80 - 90, boxY + 17, 84, 84);
      } catch {
        // QR optional
      }

      // ---- Verify URL + footer ----
      ctx.textAlign = 'center';
      ctx.fillStyle = '#60A5FA';
      ctx.font = '600 14px monospace';
      ctx.fillText(profileUrl.replace('https://', ''), W / 2, H - 96);

      ctx.fillStyle = 'rgba(148,163,184,0.6)';
      ctx.font = '500 12px sans-serif';
      ctx.fillText('Secure credential verification by Ujjwalit Technologies', W / 2, H - 62);
      ctx.fillStyle = 'rgba(148,163,184,0.4)';
      ctx.font = '500 11px sans-serif';
      ctx.fillText('verify.ujjwalit.co.in', W / 2, H - 42);

      if (!cancelled) setReady(true);
    };
    draw();
    return () => {
      cancelled = true;
    };
  }, [data, profileUrl]);

  const handleDownload = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    canvas.toBlob((blob) => {
      if (!blob) {
        toast.error('Could not generate image');
        return;
      }
      const url = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = `ujjwalit-badge-${(data?.fullName || 'student').toLowerCase().replace(/[^a-z0-9]+/g, '-')}.png`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
      toast.success('Badge downloaded as PNG');
    }, 'image/png');
  };

  const handleOpenPreview = () => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    setPreview(canvas.toDataURL('image/png'));
  };

  const handleLinkedIn = () => {
    const url = `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(profileUrl)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  };

  const handleCopyLink = () => {
    navigator.clipboard.writeText(profileUrl);
    toast.success('Profile link copied');
  };

  return (
    <div className="space-y-5">
      {/* Achievement / cohort selector */}
      {options.length > 1 && (
        <div className="flex flex-col items-center gap-1.5">
          <label className="text-[10px] font-bold uppercase tracking-widest text-stone-600 flex items-center gap-1.5">
            <Sparkles size={11} className="text-amber-500/70" /> Badge achievement
          </label>
          <div className="relative w-full max-w-sm">
            <Award size={13} className="absolute left-3 top-1/2 -translate-y-1/2 text-blue-400 pointer-events-none" />
            <select
              value={selected}
              onChange={(e) => { setSelected(Number(e.target.value)); }}
              className="w-full appearance-none rounded-xl border border-stone-800 bg-stone-950 py-2.5 pl-9 pr-9 text-xs font-semibold text-stone-200 focus:outline-none focus:border-blue-500/50 cursor-pointer hover:border-stone-700 transition-colors"
            >
              {options.map((opt, i) => (
                <option key={opt.key} value={i}>
                  {opt.label}{opt.sublabel ? ` — ${opt.sublabel}` : ''}{opt.certificateId ? ` · ${opt.certificateId}` : ''}
                </option>
              ))}
            </select>
            <ChevronDown size={13} className="absolute right-3 top-1/2 -translate-y-1/2 text-stone-500 pointer-events-none" />
          </div>
        </div>
      )}

      <div className="flex flex-col items-center gap-5">
        {/* Badge frame — clickable to enlarge */}
        <div className="relative">
          <div className="absolute -inset-1.5 rounded-3xl bg-gradient-to-br from-blue-500/30 via-stone-800/20 to-orange-500/30 blur-xl" />
          <div className="relative rounded-3xl p-1.5 bg-gradient-to-br from-blue-500/40 via-stone-800 to-orange-500/40">
            <div className="relative rounded-[20px] overflow-hidden">
              <canvas
                ref={canvasRef}
                className="w-full max-w-sm block cursor-zoom-in"
                style={{ display: ready ? 'block' : 'none' }}
                onClick={handleOpenPreview}
                title="Click to enlarge"
              />
              {!ready && (
                <div className="flex items-center justify-center p-10 text-xs text-stone-500 w-full max-w-sm">
                  <span className="animate-spin rounded-full h-5 w-5 border-t-2 border-blue-500 border-r-2 mr-2" />
                  Rendering badge…
                </div>
              )}
              {ready && (
                <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-0 hover:opacity-100 transition-opacity duration-300 bg-black/40">
                  <span className="flex items-center gap-1.5 rounded-full border border-white/20 bg-black/50 px-3 py-1.5 text-[11px] font-bold text-white backdrop-blur-sm">
                    <Maximize2 size={12} /> Click to enlarge
                  </span>
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-center gap-2">
          <Button variant="primary" size="sm" onClick={handleDownload} disabled={!ready} className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border-transparent text-xs">
            <Download size={12} /> Download PNG
          </Button>
          <Button variant="outline" size="sm" onClick={handleLinkedIn} className="gap-1.5 text-xs">
            <Linkedin size={12} className="text-sky-400" /> Share on LinkedIn
          </Button>
          <Button variant="outline" size="sm" onClick={handleCopyLink} className="gap-1.5 text-xs">
            <Link2 size={12} /> Copy Link
          </Button>
        </div>

        <div className="flex items-start gap-2 text-[11px] text-stone-600 leading-relaxed max-w-sm text-center">
          <ShieldCheck size={12} className="text-teal-500/70 shrink-0 mt-0.5" />
          <span>
            Tap the badge to enlarge it, then download the high-res PNG to post on LinkedIn, your portfolio, or anywhere online. Employers can scan the QR to verify instantly.
          </span>
        </div>
      </div>

      {/* Enlarged lightbox */}
      {preview && (
        <div className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm" onClick={() => setPreview(null)}>
          <div className="relative max-w-lg w-full" onClick={(e) => e.stopPropagation()}>
            <div className="absolute -inset-2 rounded-3xl bg-gradient-to-br from-blue-500/40 via-transparent to-orange-500/40 blur-2xl" />
            <div className="relative rounded-3xl p-1.5 bg-gradient-to-br from-blue-500/50 via-stone-800 to-orange-500/50">
              <div className="rounded-[20px] overflow-hidden">
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img src={preview} alt="Ujjwalit verified badge" className="w-full h-auto block" />
              </div>
            </div>
            <button
              onClick={() => setPreview(null)}
              className="absolute -top-3 -right-3 flex h-8 w-8 items-center justify-center rounded-full bg-stone-900 border border-stone-700 text-stone-300 hover:text-white hover:bg-stone-800 transition-colors cursor-pointer"
            >
              <X size={15} />
            </button>
            <div className="mt-4 flex justify-center">
              <Button size="sm" onClick={handleDownload} className="gap-1.5 bg-blue-600 hover:bg-blue-500 text-white border-transparent text-xs">
                <Download size={12} /> Download High-Res PNG
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}