import React, { useState, useRef } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Label } from '@/components/ui/label';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Camera, 
  Upload, 
  CheckCircle, 
  AlertCircle,
  X,
  FileIcon,
  ImageIcon
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { toast } from '@/components/ui/use-toast';
import { cn } from '@/lib/utils';

interface CompletionDocumentsUploadProps {
  appointmentId: string;
  shopId: string;
  onDocumentsUploaded: (data: { invoiceUrl: string; proofUrl: string }) => void;
  className?: string;
}

interface UploadFile {
  file: File;
  preview?: string;
  progress: number;
  error?: string;
  uploaded?: boolean;
}

export const CompletionDocumentsUpload: React.FC<CompletionDocumentsUploadProps> = ({
  appointmentId,
  shopId,
  onDocumentsUploaded,
  className
}) => {
  const [invoice, setInvoice] = useState<UploadFile | null>(null);
  const [proof, setProof] = useState<UploadFile | null>(null);
  const [uploading, setUploading] = useState(false);
  const [submitted, setSubmitted] = useState(false);
  
  const invoiceInputRef = useRef<HTMLInputElement>(null);
  const proofInputRef = useRef<HTMLInputElement>(null);

  const handleInvoiceSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (PDF only)
    if (file.type !== 'application/pdf') {
      toast({
        title: "Invalid File Type",
        description: "Invoice must be a PDF file",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 10MB)
    if (file.size > 10 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Invoice file must be less than 10MB",
        variant: "destructive"
      });
      return;
    }

    setInvoice({
      file,
      progress: 0,
      uploaded: false
    });
  };

  const handleProofSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // Validate file type (images only)
    if (!file.type.startsWith('image/')) {
      toast({
        title: "Invalid File Type",
        description: "Completion proof must be an image file (JPG, PNG, etc.)",
        variant: "destructive"
      });
      return;
    }

    // Validate file size (max 5MB)
    if (file.size > 5 * 1024 * 1024) {
      toast({
        title: "File Too Large",
        description: "Image file must be less than 5MB",
        variant: "destructive"
      });
      return;
    }

    // Create preview for images
    const reader = new FileReader();
    reader.onload = (e) => {
      setProof({
        file,
        preview: e.target?.result as string,
        progress: 0,
        uploaded: false
      });
    };
    reader.readAsDataURL(file);
  };

  const removeInvoice = () => {
    setInvoice(null);
    if (invoiceInputRef.current) {
      invoiceInputRef.current.value = '';
    }
  };

  const removeProof = () => {
    setProof(null);
    if (proofInputRef.current) {
      proofInputRef.current.value = '';
    }
  };

  const uploadFile = async (file: File, bucket: string, folder: string): Promise<string> => {
    const fileExt = file.name.split('.').pop();
    const fileName = `${appointmentId}-${shopId}-${Date.now()}.${fileExt}`;
    const filePath = `${folder}/${fileName}`;

    const { error: uploadError } = await supabase.storage
      .from(bucket)
      .upload(filePath, file, {
        cacheControl: '3600',
        upsert: false
      });

    if (uploadError) {
      throw uploadError;
    }

    return filePath;
  };

  const handleSubmit = async () => {
    if (!invoice || !proof) {
      toast({
        title: "Missing Documents",
        description: "Please upload both invoice and completion proof",
        variant: "destructive"
      });
      return;
    }

    setUploading(true);

    try {
      // Upload invoice
      setInvoice(prev => prev ? { ...prev, progress: 25 } : null);
      const invoiceFilePath = await uploadFile(invoice.file, 'invoices', 'job-invoices');
      
      setInvoice(prev => prev ? { ...prev, progress: 50, uploaded: true } : null);

      // Upload completion proof
      setProof(prev => prev ? { ...prev, progress: 25 } : null);
      const proofFilePath = await uploadFile(proof.file, 'completion-proofs', 'job-proofs');
      
      setProof(prev => prev ? { ...prev, progress: 50, uploaded: true } : null);

      // Create completion document record
      const { data: completionDoc, error: recordError } = await supabase
        .from('job_completion_documents')
        .insert({
          appointment_id: appointmentId,
          shop_id: shopId,
          invoice_file_path: invoiceFilePath,
          invoice_file_name: invoice.file.name,
          invoice_file_size: invoice.file.size,
          completion_proof_path: proofFilePath,
          completion_proof_file_name: proof.file.name,
          completion_proof_file_size: proof.file.size,
          notes: 'Uploaded via shop completion form'
        })
        .select()
        .single();

      if (recordError) {
        throw recordError;
      }

      // Update appointment with file paths and verification status
      const { error: appointmentError } = await supabase
        .from('appointments')
        .update({
          invoice_file_path: invoiceFilePath,
          completion_proof_path: proofFilePath,
          invoice_uploaded_at: new Date().toISOString(),
          completion_proof_uploaded_at: new Date().toISOString(),
          completion_documents_verified: true
        })
        .eq('id', appointmentId);

      if (appointmentError) {
        throw appointmentError;
      }

      // Complete progress
      setInvoice(prev => prev ? { ...prev, progress: 100 } : null);
      setProof(prev => prev ? { ...prev, progress: 100 } : null);

      // Send documents to insurer asynchronously
      supabase.functions.invoke('send-completion-documents', {
        body: { completionDocumentId: completionDoc.id }
      }).then(({ error }) => {
        if (error) {
          console.error('Error sending documents to insurer:', error);
        } else {
          console.log('Documents sent to insurer successfully');
        }
      });

      setSubmitted(true);
      
      toast({
        title: "Documents Uploaded",
        description: "Invoice and completion proof have been submitted successfully"
      });

      // Get signed URLs for immediate access
      const { data: invoiceUrl } = await supabase.storage
        .from('invoices')
        .createSignedUrl(invoiceFilePath, 3600);
        
      const { data: proofUrl } = await supabase.storage
        .from('completion-proofs')
        .createSignedUrl(proofFilePath, 3600);

      onDocumentsUploaded({
        invoiceUrl: invoiceUrl?.signedUrl || '',
        proofUrl: proofUrl?.signedUrl || ''
      });

    } catch (error: any) {
      console.error('Error uploading documents:', error);
      toast({
        title: "Upload Failed",
        description: error.message || "Failed to upload documents",
        variant: "destructive"
      });
      
      // Reset progress on error
      setInvoice(prev => prev ? { ...prev, progress: 0, error: error.message } : null);
      setProof(prev => prev ? { ...prev, progress: 0, error: error.message } : null);
    } finally {
      setUploading(false);
    }
  };

  if (submitted) {
    return (
      <Card className={cn("border-green-200 bg-green-50", className)}>
        <CardContent className="p-6">
          <div className="text-center">
            <CheckCircle className="h-12 w-12 text-green-600 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-green-900 mb-2">
              Documents Submitted Successfully
            </h3>
            <p className="text-green-700">
              Your invoice and completion proof have been uploaded and sent to the insurer.
            </p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className={className}>
      <CardHeader>
        <CardTitle className="flex items-center gap-2">
          <FileText className="h-5 w-5" />
          Upload Completion Documents
        </CardTitle>
        <CardDescription>
          Upload the invoice (PDF) and completion proof photo before marking the job as complete
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        {/* Invoice Upload */}
        <div className="space-y-2">
          <Label>Invoice (PDF Required)</Label>
          <input
            ref={invoiceInputRef}
            type="file"
            accept=".pdf,application/pdf"
            onChange={handleInvoiceSelect}
            className="hidden"
          />
          
          {!invoice ? (
            <div
              onClick={() => invoiceInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <div className="text-center">
                <FileText className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload invoice PDF
                </p>
                <p className="text-xs text-muted-foreground">
                  Maximum file size: 10MB
                </p>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <FileIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{invoice.file.name}</span>
                  {invoice.uploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeInvoice}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {invoice.progress > 0 && (
                <Progress value={invoice.progress} className="h-2" />
              )}
              {invoice.error && (
                <p className="text-xs text-red-600 mt-1">{invoice.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Completion Proof Upload */}
        <div className="space-y-2">
          <Label>Completion Proof Photo</Label>
          <input
            ref={proofInputRef}
            type="file"
            accept="image/*"
            onChange={handleProofSelect}
            className="hidden"
          />
          
          {!proof ? (
            <div
              onClick={() => proofInputRef.current?.click()}
              className="border-2 border-dashed border-muted-foreground/25 rounded-lg p-6 cursor-pointer hover:border-muted-foreground/50 transition-colors"
            >
              <div className="text-center">
                <Camera className="h-8 w-8 text-muted-foreground mx-auto mb-2" />
                <p className="text-sm text-muted-foreground mb-1">
                  Click to upload completion photo
                </p>
                <p className="text-xs text-muted-foreground">
                  JPG, PNG, or other image formats • Maximum file size: 5MB
                </p>
              </div>
            </div>
          ) : (
            <div className="border rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center gap-2">
                  <ImageIcon className="h-4 w-4" />
                  <span className="text-sm font-medium">{proof.file.name}</span>
                  {proof.uploaded && <CheckCircle className="h-4 w-4 text-green-600" />}
                </div>
                <Button
                  variant="ghost"
                  size="sm"
                  onClick={removeProof}
                  disabled={uploading}
                >
                  <X className="h-4 w-4" />
                </Button>
              </div>
              {proof.preview && (
                <div className="mt-2">
                  <img 
                    src={proof.preview} 
                    alt="Completion proof preview"
                    className="w-full max-w-sm h-32 object-cover rounded border"
                  />
                </div>
              )}
              {proof.progress > 0 && (
                <Progress value={proof.progress} className="h-2 mt-2" />
              )}
              {proof.error && (
                <p className="text-xs text-red-600 mt-1">{proof.error}</p>
              )}
            </div>
          )}
        </div>

        {/* Upload Button */}
        <div className="pt-4">
          <Button
            onClick={handleSubmit}
            disabled={!invoice || !proof || uploading}
            className="w-full"
          >
            {uploading ? (
              <>
                <Upload className="h-4 w-4 mr-2 animate-spin" />
                Uploading Documents...
              </>
            ) : (
              <>
                <Upload className="h-4 w-4 mr-2" />
                Upload Documents
              </>
            )}
          </Button>
          
          {(!invoice || !proof) && (
            <p className="text-xs text-muted-foreground text-center mt-2">
              Both invoice and completion proof are required
            </p>
          )}
        </div>
      </CardContent>
    </Card>
  );
};