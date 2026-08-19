import React from 'react';

export const dynamic = 'force-dynamic';

export default function EmbedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-transparent font-sans antialiased">
      {children}
    </div>
  );
}