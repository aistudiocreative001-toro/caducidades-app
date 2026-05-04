'use client';

import { Shield } from 'lucide-react';
import Link from 'next/link';

export default function AppBar({ showAdmin = false }: { showAdmin?: boolean }) {
  return (
    <header className="bg-white shadow-sm border-b border-[#E2E8F0] sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Link href="/" className="text-xl font-bold text-[#0F172A] hover:text-[#1565C0] transition-colors">
            CadFZ
          </Link>
        </div>
        
        {showAdmin && (
          <Link
            href="/admin"
            className="inline-flex items-center gap-2 px-4 py-2 border border-[#CBD5E1] rounded-lg text-sm font-medium text-[#475569] hover:bg-[#F1F5F9] transition-colors"
          >
            <Shield className="w-4 h-4" />
            Administración
          </Link>
        )}
      </div>
    </header>
  );
}
