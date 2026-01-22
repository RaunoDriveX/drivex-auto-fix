import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { ScrollArea } from '@/components/ui/scroll-area';

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
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 pt-4">
            {/* Use the same static damage assessment image from the customer flow */}
            <div className="rounded-md border overflow-hidden">
              <img
                src="/lovable-uploads/c1b17908-3759-47aa-8be9-2ca25b318c3d.png"
                alt="AI windshield inspection: reference images and detected chip damage — recommended repair"
                className="w-full h-auto"
                loading="lazy"
                decoding="async"
              />
            </div>
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
