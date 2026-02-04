import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { de } from 'date-fns/locale';
import { cn } from '@/lib/utils';
import { DamageReportDialog } from './DamageReportDialog';

interface DamageReportViewerProps {
  appointmentId: string;
  damageType?: string | null;
  className?: string;
}

// Helper to format damage type for display
const formatDamageType = (damageType: string | null | undefined): string => {
  if (!damageType) return 'Unknown';
  const damageMap: Record<string, string> = {
    'chip': 'Stone chip',
    'stone_chip': 'Stone chip',
    'crack': 'Crack',
    'shattered': 'Shattered',
    'scratch': 'Scratch'
  };
  return damageMap[damageType.toLowerCase()] || damageType;
};

// Generate damage report data based on appointment
// Always shows the report with actual damage type from customer submission
export const getMockDamageReport = (appointmentId: string, damageType?: string | null) => {
  // Generate consistent mock data based on appointment ID
  const hash = appointmentId.split('').reduce((acc, char) => acc + char.charCodeAt(0), 0);
  
  const reportDate = new Date();
  reportDate.setDate(reportDate.getDate() - (hash % 5)); // 0-4 days ago
  
  return {
    id: `report-${appointmentId.substring(0, 8)}`,
    fileName: `Schadensbericht_${appointmentId.substring(0, 8).toUpperCase()}.pdf`,
    fileSize: 245000 + (hash % 100000), // ~245-345 KB
    createdAt: reportDate.toISOString(),
    status: 'completed' as const,
    damageType: formatDamageType(damageType),
    recommendation: 'Repair', // Based on AI assessment
    confidenceScore: 85 + (hash % 15), // 85-99%
  };
};

const formatFileSize = (bytes: number): string => {
  if (bytes < 1024) return `${bytes} B`;
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`;
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`;
};

export const DamageReportViewer: React.FC<DamageReportViewerProps> = ({ 
  appointmentId, 
  damageType,
  className 
}) => {
  const { t, i18n } = useTranslation('insurer');
  const [dialogOpen, setDialogOpen] = useState(false);
  const isGerman = i18n.language === 'de';
  
  const report = getMockDamageReport(appointmentId, damageType);
  
  const handleDownload = () => {
    // Download the actual PDF file
    const link = document.createElement('a');
    link.href = '/damage-assessment-report.pdf';
    link.download = report.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  return (
    <>
      <Card className={cn("bg-accent/30 border-primary/20", className)}>
        <CardHeader className="py-3 px-4">
          <CardTitle className="text-sm font-medium flex items-center gap-2">
            <FileText className="h-4 w-4 text-primary" />
            {t('damage_report.title', 'Damage Report')}
            <Badge variant="secondary" className="ml-auto bg-green-100 text-green-700 border-green-300">
              <CheckCircle className="h-3 w-3 mr-1" />
              {t('damage_report.available', 'Available')}
            </Badge>
          </CardTitle>
        </CardHeader>
        <CardContent className="py-3 px-4 pt-0 space-y-3">
          {/* File Info */}
          <div className="flex items-center gap-3 p-2 bg-background rounded-md border">
            <div className="p-2 bg-destructive/10 rounded">
              <FileText className="h-5 w-5 text-destructive" />
            </div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-medium truncate">{report.fileName}</p>
              <p className="text-xs text-muted-foreground">
                {formatFileSize(report.fileSize)} • {format(
                  new Date(report.createdAt), 
                  isGerman ? 'd. MMM yyyy, HH:mm' : 'MMM d, yyyy, h:mm a',
                  isGerman ? { locale: de } : undefined
                )}
              </p>
            </div>
          </div>
          
          {/* AI Assessment Summary */}
          <div className="grid grid-cols-2 gap-2 text-xs">
            <div className="p-2 bg-background rounded border">
              <span className="text-muted-foreground">{t('damage_report.damage_type', 'Damage Type')}</span>
              <p className="font-medium capitalize">{report.damageType}</p>
            </div>
            <div className="p-2 bg-background rounded border">
              <span className="text-muted-foreground">{t('damage_report.recommendation', 'Recommendation')}</span>
              <p className="font-medium capitalize">{report.recommendation}</p>
            </div>
            <div className="col-span-2 p-2 bg-background rounded border">
              <span className="text-muted-foreground">{t('damage_report.confidence', 'AI Confidence')}</span>
              <div className="flex items-center gap-2 mt-1">
                <div className="flex-1 h-2 bg-muted rounded-full overflow-hidden">
                  <div 
                    className="h-full bg-green-500 rounded-full"
                    style={{ width: `${report.confidenceScore}%` }}
                  />
                </div>
                <span className="font-medium">{report.confidenceScore}%</span>
              </div>
            </div>
          </div>
          
          {/* Action Buttons */}
          <div className="flex gap-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setDialogOpen(true)}
            >
              <Eye className="h-4 w-4 mr-2" />
              {t('damage_report.view', 'View')}
            </Button>
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={handleDownload}
            >
              <Download className="h-4 w-4 mr-2" />
              {t('damage_report.download', 'Download')}
            </Button>
          </div>
        </CardContent>
      </Card>
      
      <DamageReportDialog
        open={dialogOpen}
        onOpenChange={setDialogOpen}
        appointmentId={appointmentId}
      />
    </>
  );
};
