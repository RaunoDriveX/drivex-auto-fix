import { useState, useEffect } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Alert, AlertDescription } from "@/components/ui/alert";
import { Separator } from "@/components/ui/separator";
import { FileText, Camera, CheckCircle, Clock, AlertTriangle, Send } from "lucide-react";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "@/components/ui/use-toast";

interface ClaimSubmissionFormProps {
  appointmentId: string;
  damageData: {
    damageType: string;
    damageSeverity: string;
    damageLocation: string;
    aiConfidenceScore: number;
    aiAssessmentDetails: any;
    recommendedAction: 'repair' | 'replacement';
    estimatedCostMin: number;
    estimatedCostMax: number;
    damagePhotos: string[];
  };
  customerData: {
    name: string;
    email: string;
    phone?: string;
  };
}

const ClaimSubmissionForm = ({ appointmentId, damageData, customerData }: ClaimSubmissionFormProps) => {
  const [loading, setLoading] = useState(false);
  const [submissionStatus, setSubmissionStatus] = useState<'idle' | 'submitting' | 'success' | 'error'>('idle');
  const [claimNumber, setClaimNumber] = useState('');
  const [policyNumber, setPolicyNumber] = useState('');
  const [insurerName, setInsurerName] = useState('');
  const [submissionResult, setSubmissionResult] = useState<any>(null);

  // Generate claim number on component mount
  useEffect(() => {
    const generateClaimNumber = () => {
      const timestamp = Date.now().toString().slice(-8);
      const random = Math.random().toString(36).substring(2, 6).toUpperCase();
      return `DX-${timestamp}-${random}`;
    };
    
    setClaimNumber(generateClaimNumber());
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setSubmissionStatus('submitting');

    try {
      const claimPacket = {
        appointmentId,
        claimNumber,
        policyNumber,
        insurerName,
        customerName: customerData.name,
        customerEmail: customerData.email,
        customerPhone: customerData.phone,
        damageType: damageData.damageType,
        damageSeverity: damageData.damageSeverity,
        damageLocation: damageData.damageLocation,
        aiConfidenceScore: damageData.aiConfidenceScore,
        aiAssessmentDetails: damageData.aiAssessmentDetails,
        damagePhotos: damageData.damagePhotos,
        estimatedCostMin: damageData.estimatedCostMin,
        estimatedCostMax: damageData.estimatedCostMax,
        recommendedAction: damageData.recommendedAction
      };

      const { data, error } = await supabase.functions.invoke('submit-insurance-claim', {
        body: claimPacket
      });

      if (error) {
        throw error;
      }

      setSubmissionResult(data);
      setSubmissionStatus('success');
      toast({
        title: "Claim Submitted Successfully",
        description: `Your claim ${claimNumber} has been submitted to ${insurerName}`,
      });

    } catch (error: any) {
      console.error('Error submitting claim:', error);
      setSubmissionStatus('error');
      toast({
        title: "Submission Failed",
        description: error.message || "Failed to submit claim. Please try again.",
        variant: "destructive",
      });
    } finally {
      setLoading(false);
    }
  };

  if (submissionStatus === 'success') {
    return (
      <Card className="border-success/50 bg-success/5">
        <CardHeader>
          <div className="flex items-center gap-2">
            <CheckCircle className="h-6 w-6 text-success" />
            <CardTitle>Claim Submitted Successfully</CardTitle>
          </div>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="grid gap-2">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Claim Number:</span>
              <Badge variant="outline">{claimNumber}</Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Submission Method:</span>
              <Badge variant={submissionResult?.submissionMethod === 'api' ? 'default' : 'secondary'}>
                {submissionResult?.submissionMethod === 'api' ? 'Direct API' : 'Secure Email'}
              </Badge>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Insurance Company:</span>
              <span className="font-medium">{insurerName}</span>
            </div>
          </div>
          
          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              Your claim has been submitted to {insurerName}. You will receive updates via email as your claim is processed.
            </AlertDescription>
          </Alert>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Submit Insurance Claim
        </CardTitle>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Claim Summary */}
          <div className="space-y-4">
            <h3 className="font-semibold">Claim Package Summary</h3>
            <div className="grid md:grid-cols-2 gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Damage Type:</span>
                  <span className="font-medium">{damageData.damageType}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Severity:</span>
                  <Badge variant={damageData.damageSeverity === 'Minor' ? 'secondary' : 'destructive'} className="text-xs">
                    {damageData.damageSeverity}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Location:</span>
                  <span className="font-medium">{damageData.damageLocation}</span>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">AI Confidence:</span>
                  <span className="font-medium">{(damageData.aiConfidenceScore * 100).toFixed(0)}%</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Recommendation:</span>
                  <Badge variant="outline" className="text-xs">
                    {damageData.recommendedAction}
                  </Badge>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-muted-foreground">Cost Estimate:</span>
                  <span className="font-medium">€{damageData.estimatedCostMin} - €{damageData.estimatedCostMax}</span>
                </div>
              </div>
            </div>
            
            <div className="flex items-center gap-2 text-sm text-muted-foreground">
              <Camera className="h-4 w-4" />
              <span>{damageData.damagePhotos.length} damage photos included</span>
            </div>
          </div>

          <Separator />

          {/* Claim Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Insurance Information</h3>
            
            <div className="grid gap-4">
              <div className="grid gap-2">
                <Label htmlFor="claimNumber">Claim Number</Label>
                <Input 
                  id="claimNumber" 
                  value={claimNumber} 
                  readOnly 
                  className="bg-muted/50"
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="policyNumber">Policy Number *</Label>
                <Input 
                  id="policyNumber"
                  value={policyNumber}
                  onChange={(e) => setPolicyNumber(e.target.value)}
                  placeholder="Enter your policy number"
                  required
                />
              </div>
              
              <div className="grid gap-2">
                <Label htmlFor="insurerName">Insurance Company *</Label>
                <Select value={insurerName} onValueChange={setInsurerName} required>
                  <SelectTrigger>
                    <SelectValue placeholder="Select your insurance company" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="allianz">Allianz</SelectItem>
                    <SelectItem value="axa">AXA</SelectItem>
                    <SelectItem value="ing">ING</SelectItem>
                    <SelectItem value="aegon">Aegon</SelectItem>
                    <SelectItem value="nn">Nationale Nederlanden</SelectItem>
                    <SelectItem value="achmea">Achmea</SelectItem>
                    <SelectItem value="unive">Univé</SelectItem>
                    <SelectItem value="centraal-beheer">Centraal Beheer</SelectItem>
                    <SelectItem value="ohra">Ohra</SelectItem>
                    <SelectItem value="fbto">FBTO</SelectItem>
                    <SelectItem value="asr">ASR</SelectItem>
                    <SelectItem value="other">Other</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </div>

          <Separator />

          {/* Customer Information */}
          <div className="space-y-4">
            <h3 className="font-semibold">Customer Information</h3>
            <div className="grid gap-4 p-4 bg-muted/50 rounded-lg">
              <div className="flex justify-between">
                <span className="text-muted-foreground">Name:</span>
                <span className="font-medium">{customerData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-muted-foreground">Email:</span>
                <span className="font-medium">{customerData.email}</span>
              </div>
              {customerData.phone && (
                <div className="flex justify-between">
                  <span className="text-muted-foreground">Phone:</span>
                  <span className="font-medium">{customerData.phone}</span>
                </div>
              )}
            </div>
          </div>

          <Alert>
            <AlertTriangle className="h-4 w-4" />
            <AlertDescription>
              By submitting this claim, you confirm that all information is accurate and complete. 
              The claim will be sent directly to your insurance company's system or via secure email.
            </AlertDescription>
          </Alert>

          <Button 
            type="submit" 
            className="w-full" 
            disabled={loading || !policyNumber || !insurerName}
          >
            {loading ? (
              <>
                <Clock className="h-4 w-4 mr-2 animate-spin" />
                {submissionStatus === 'submitting' ? 'Submitting Claim...' : 'Processing...'}
              </>
            ) : (
              <>
                <Send className="h-4 w-4 mr-2" />
                Submit Claim Package
              </>
            )}
          </Button>
        </form>
      </CardContent>
    </Card>
  );
};

export default ClaimSubmissionForm;