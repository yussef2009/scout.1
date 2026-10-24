'use client';

import React from 'react';
import { GlassButton } from '../ui/GlassButton';
import { FileText, Download } from 'lucide-react';
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
  const handleDownload = () => {
    const url = apiClient.getReportPdfUrl(slug);
    window.open(url, '_blank');
  };

  return (
    <GlassButton variant={variant} size="md" icon={<FileText className="w-4 h-4" />} onClick={handleDownload}>
      {label}
    </GlassButton>
  );
};
