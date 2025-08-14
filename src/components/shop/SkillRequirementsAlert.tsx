import { Alert, AlertDescription } from "@/components/ui/alert";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { UserCheck, AlertTriangle, Award } from "lucide-react";

interface SkillRequirement {
  required_certifications: string[];
  minimum_experience_years: number;
  description: string;
}

interface SkillRequirementsAlertProps {
  serviceType: string;
  damageType?: string;
  vehicleType?: string;
  shopHasQualified: boolean;
  skillRequirements?: SkillRequirement;
  qualifiedTechnicianCount?: number;
}

export const SkillRequirementsAlert = ({
  serviceType,
  damageType,
  vehicleType,
  shopHasQualified,
  skillRequirements,
  qualifiedTechnicianCount = 0
}: SkillRequirementsAlertProps) => {
  if (!skillRequirements) return null;

  const hasRequirements = skillRequirements.required_certifications.length > 0 || 
                         skillRequirements.minimum_experience_years > 0;

  if (!hasRequirements) return null;

  const formatCertification = (cert: string) => {
    return cert.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  return (
    <Card className={`border-l-4 ${shopHasQualified ? 'border-l-green-500' : 'border-l-orange-500'}`}>
      <CardHeader className="pb-3">
        <CardTitle className="flex items-center gap-2 text-base">
          {shopHasQualified ? (
            <UserCheck className="h-5 w-5 text-green-600" />
          ) : (
            <AlertTriangle className="h-5 w-5 text-orange-600" />
          )}
          Skill Requirements
        </CardTitle>
      </CardHeader>
      <CardContent className="pt-0">
        <div className="space-y-3">
          <p className="text-sm text-muted-foreground">
            {skillRequirements.description}
          </p>

          {skillRequirements.required_certifications.length > 0 && (
            <div>
              <div className="flex items-center gap-2 mb-2">
                <Award className="h-4 w-4 text-blue-600" />
                <span className="text-sm font-medium">Required Certifications</span>
              </div>
              <div className="flex flex-wrap gap-2">
                {skillRequirements.required_certifications.map((cert, idx) => (
                  <Badge key={idx} variant="outline" className="text-xs">
                    {formatCertification(cert)}
                  </Badge>
                ))}
              </div>
            </div>
          )}

          {skillRequirements.minimum_experience_years > 0 && (
            <div className="text-sm">
              <span className="font-medium">Minimum Experience:</span>{' '}
              {skillRequirements.minimum_experience_years} years
            </div>
          )}

          <Alert className={shopHasQualified ? "border-green-200 bg-green-50" : "border-orange-200 bg-orange-50"}>
            <AlertDescription className={shopHasQualified ? "text-green-800" : "text-orange-800"}>
              {shopHasQualified ? (
                <span>
                  ✓ Your shop has {qualifiedTechnicianCount} qualified technician{qualifiedTechnicianCount !== 1 ? 's' : ''} for this job
                </span>
              ) : (
                <span>
                  ⚠️ Your shop currently has no qualified technicians for this job. 
                  Add certified technicians to receive skill-matched jobs.
                </span>
              )}
            </AlertDescription>
          </Alert>
        </div>
      </CardContent>
    </Card>
  );
};