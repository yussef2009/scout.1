'use client';

import React, { useState } from 'react';
import { GlassButton } from '../ui/GlassButton';
import { FileText, Download, Loader2, Check } from 'lucide-react';
import { apiClient } from '../../lib/api-client';

interface PdfReportExporterProps {
  slug: string;
  variant?: 'primary' | 'secondary' | 'emerald';
  label?: string;
}

export const PdfReportExporter: React.FC<PdfReportExporterProps> = ({
  slug,
  variant = 'primary',
  label = 'Download Dossier (PDF)',
}) => {
  const [isExporting, setIsExporting] = useState(false);
  const [downloaded, setDownloaded] = useState(false);

  const handleDownload = async () => {
    if (isExporting) return;
    try {
      setIsExporting(true);
      const url = apiClient.getReportPdfUrl(slug);
      
      // Fetch as blob to confirm delivery & trigger direct download
      const res = await fetch(url);
      if (!res.ok) {
        throw new Error(`PDF generation failed (${res.status})`);
      }
      const blob = await res.blob();
      const blobUrl = URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = blobUrl;
      a.download = `ScoutAI_Verified_Dossier_${slug}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(blobUrl);

      setDownloaded(true);
      setTimeout(() => setDownloaded(false), 3000);
    } catch (err) {
      console.error('PDF Export Error:', err);
      // Fallback direct window.open
      const fallbackUrl = apiClient.getReportPdfUrl(slug);
      window.open(fallbackUrl, '_blank');
    } finally {
      setIsExporting(false);
    }
  };

  return (
    <GlassButton
      variant={downloaded ? 'emerald' : variant}
      size="md"
      disabled={isExporting}
      icon={
        isExporting ? (
          <Loader2 className="w-4 h-4 animate-spin text-cyan-300" />
        ) : downloaded ? (
          <Check className="w-4 h-4 text-emerald-300" />
        ) : (
          <FileText className="w-4 h-4" />
        )
      }
      onClick={handleDownload}
    >
      {isExporting ? 'Generating PDF...' : downloaded ? 'Downloaded PDF!' : label}
    </GlassButton>
  );
};
