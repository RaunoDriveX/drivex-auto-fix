import React from 'react';
import { useTranslation } from 'react-i18next';
import { Check } from 'lucide-react';
import { cn } from '@/lib/utils';

export type DamageReportStep = 'reporting' | 'contact';

interface DamageReportStepperProps {
  currentStep: DamageReportStep;
}

const steps: { id: DamageReportStep; labelKey: string }[] = [
  { id: 'reporting', labelKey: 'stepper.reporting' },
  { id: 'contact', labelKey: 'stepper.contact_details' },
];

export const DamageReportStepper: React.FC<DamageReportStepperProps> = ({ currentStep }) => {
  const { t } = useTranslation('marketing');

  const currentIndex = steps.findIndex(s => s.id === currentStep);

  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, index) => {
        const isCompleted = index < currentIndex;
        const isCurrent = step.id === currentStep;
        const isLast = index === steps.length - 1;

        return (
          <div key={step.id} className="flex gap-3">
            {/* Icon column with connector line */}
            <div className="flex flex-col items-center">
              {/* Step circle */}
              <div
                className={cn(
                  "flex items-center justify-center w-8 h-8 rounded-full border-2 shrink-0 transition-colors",
                  isCompleted
                    ? "bg-primary border-primary text-primary-foreground"
                    : isCurrent
                    ? "border-primary bg-primary/10 text-primary"
                    : "border-muted bg-muted text-muted-foreground"
                )}
              >
                {isCompleted ? (
                  <Check className="h-4 w-4" />
                ) : (
                  <span className="text-sm font-medium">{index + 1}</span>
                )}
              </div>

              {/* Connector line */}
              {!isLast && (
                <div
                  className={cn(
                    "w-0.5 flex-1 min-h-8",
                    isCompleted ? "bg-primary" : "bg-muted"
                  )}
                />
              )}
            </div>

            {/* Step label */}
            <div className="flex-1 min-w-0 pb-6">
              <p
                className={cn(
                  "text-sm font-medium pt-1",
                  isCurrent && "text-primary",
                  isCompleted && "text-foreground",
                  !isCurrent && !isCompleted && "text-muted-foreground"
                )}
              >
                {t(step.labelKey, step.id === 'reporting' ? 'Reporting' : 'Contact Details')}
              </p>
            </div>
          </div>
        );
      })}
    </div>
  );
};
