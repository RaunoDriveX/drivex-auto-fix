import React from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';

interface DamageMarker {
  id: number;
  x: number; // percentage position
  y: number; // percentage position
  damageType: string;
  location: string;
  recommendation: string;
}

interface DamagePhoto {
  id: string;
  title: string;
  subtitle: string;
  imageUrl: string;
  aiComments: string | null;
  comments: string | null;
  markers: DamageMarker[];
}

interface DamageReportDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
}

// Mock data for damage report photos
const getMockDamageReportPhotos = (appointmentId: string): DamagePhoto[] => {
  // Use sample damage photos from public folder
  return [
    {
      id: '1',
      title: 'Windshield from outside',
      subtitle: 'Reference image',
      imageUrl: '/damage-photo-1.jpg',
      aiComments: null,
      comments: null,
      markers: [
        {
          id: 1,
          x: 35,
          y: 55,
          damageType: 'Chip',
          location: 'Windshield',
          recommendation: 'Repair'
        }
      ]
    },
    {
      id: '2',
      title: 'Close-up of damage',
      subtitle: 'Detail image',
      imageUrl: '/damage-photo-2.jpg',
      aiComments: 'Small stone chip detected. Diameter approximately 5mm. No cracks extending from impact point.',
      comments: null,
      markers: [
        {
          id: 1,
          x: 50,
          y: 45,
          damageType: 'Stone chip',
          location: 'Driver side',
          recommendation: 'Repair recommended'
        }
      ]
    }
  ];
};

const DamageMarkerPin: React.FC<{ number: number; x: number; y: number }> = ({ number, x, y }) => (
  <div 
    className="absolute w-6 h-6 -translate-x-1/2 -translate-y-1/2 cursor-pointer"
    style={{ left: `${x}%`, top: `${y}%` }}
  >
    <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold shadow-lg border-2 border-white">
      {number}
    </div>
  </div>
);

export const DamageReportDialog: React.FC<DamageReportDialogProps> = ({
  open,
  onOpenChange,
  appointmentId
}) => {
  const { t } = useTranslation('insurer');
  const photos = getMockDamageReportPhotos(appointmentId);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] p-0">
        <DialogHeader className="p-6 pb-0">
          <DialogTitle className="text-xl font-bold">
            {t('damage_report.title', 'Damage Report')}
          </DialogTitle>
        </DialogHeader>
        
        <ScrollArea className="max-h-[calc(90vh-80px)]">
          <div className="p-6 pt-4 space-y-8">
            {photos.map((photo, index) => (
              <div key={photo.id} className="space-y-4">
                {index > 0 && <Separator className="my-6" />}
                
                <div className="grid md:grid-cols-2 gap-6">
                  {/* Image with markers */}
                  <div className="relative rounded-lg overflow-hidden border bg-muted">
                    <img 
                      src={photo.imageUrl} 
                      alt={photo.title}
                      className="w-full h-auto object-cover aspect-[4/3]"
                      onError={(e) => {
                        // Fallback to placeholder if image doesn't exist
                        e.currentTarget.src = '/placeholder.svg';
                      }}
                    />
                    {/* Damage markers */}
                    {photo.markers.map((marker) => (
                      <DamageMarkerPin 
                        key={marker.id} 
                        number={marker.id} 
                        x={marker.x} 
                        y={marker.y} 
                      />
                    ))}
                  </div>
                  
                  {/* Details panel */}
                  <div className="space-y-4">
                    {/* Title */}
                    <div>
                      <h3 className="text-lg font-semibold">{photo.title}</h3>
                      <p className="text-sm text-muted-foreground">{photo.subtitle}</p>
                    </div>
                    
                    {/* AI Comments */}
                    <div>
                      <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        {t('damage_report.ai_comments', 'AI Comments')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {photo.aiComments || t('damage_report.no_ai_comments', 'No AI comments.')}
                      </p>
                    </div>
                    
                    {/* Comments */}
                    <div>
                      <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                        {t('damage_report.comments', 'Comments')}
                      </h4>
                      <p className="text-sm text-muted-foreground">
                        {photo.comments || t('damage_report.no_comments', 'No additional comments.')}
                      </p>
                    </div>
                    
                    {/* Damage markers details */}
                    {photo.markers.map((marker) => (
                      <div key={marker.id} className="space-y-2">
                        <div className="flex items-start gap-3">
                          <div className="w-6 h-6 bg-red-500 rounded-full flex items-center justify-center text-white text-xs font-bold flex-shrink-0">
                            {marker.id}
                          </div>
                          <div>
                            <p className="font-semibold">{marker.damageType}</p>
                            <p className="text-sm text-muted-foreground">{marker.location}</p>
                          </div>
                        </div>
                        
                        {/* AI recommendation for this marker */}
                        <div className="ml-9">
                          <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                            {t('damage_report.ai_comments', 'AI Comments')}
                          </h4>
                          <ul className="text-sm list-disc list-inside">
                            <li>{marker.recommendation}</li>
                          </ul>
                        </div>
                        
                        {/* Additional comments */}
                        <div className="ml-9">
                          <h4 className="text-xs font-semibold text-blue-600 uppercase tracking-wide mb-1">
                            {t('damage_report.comments', 'Comments')}
                          </h4>
                          <p className="text-sm text-muted-foreground">
                            {t('damage_report.no_comments', 'No additional comments.')}
                          </p>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
        </ScrollArea>
      </DialogContent>
    </Dialog>
  );
};
