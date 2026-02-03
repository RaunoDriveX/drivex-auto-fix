import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

interface DamageReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
}

export const DamageReportDialog: React.FC<DamageReportDialogProps> = ({
  open,
  onOpenChange,
  appointmentId
}) => {
  const { t } = useTranslation('insurer');

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            {t('damage_report.assessment_title', "Your car's damage assessment")}
          </DialogTitle>
        </DialogHeader>
        
        <div className="flex-1 min-h-0">
          <iframe
            src="/damage-assessment-report.pdf"
            className="w-full h-[calc(90vh-100px)]"
            title={t('damage_report.assessment_title', "Your car's damage assessment")}
          />
        </div>
      </DialogContent>
    </Dialog>
  );
};
