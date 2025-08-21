import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { 
  FileText, 
  Download, 
  Eye, 
  CheckCircle, 
  Clock,
  AlertTriangle,
  ExternalLink
} from 'lucide-react';
import { supabase } from '@/integrations/supabase/client';
import { format } from 'date-fns';
import { cn } from '@/lib/utils';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';

interface CompletionDocumentsViewerProps {
  appointmentId: string;
  className?: string;
}

interface CompletionDocument {
  id: string;
  invoice_file_name: string;
  invoice_file_path: string;
  invoice_file_size: number;
  completion_proof_file_name: string;
  completion_proof_path: string;
  completion_proof_file_size: number;
  uploaded_at: string;
  sent_to_insurer_at?: string;
  insurer_delivery_method?: string;
  insurer_delivery_status: string;
  notes?: string;
}

const deliveryStatusConfig = {
  pending: { icon: Clock, color: 'bg-yellow-100 text-yellow-800', label: 'Pending' },
  sent: { icon: CheckCircle, color: 'bg-green-100 text-green-800', label: 'Delivered' },
  failed: { icon: AlertTriangle, color: 'bg-red-100 text-red-800', label: 'Failed' }
};

export const CompletionDocumentsViewer: React.FC<CompletionDocumentsViewerProps> = ({
  appointmentId,
  className
}) => {
  const [documents, setDocuments] = useState<CompletionDocument | null>(null);
  const [loading, setLoading] = useState(true);
  const [invoiceUrl, setInvoiceUrl] = useState<string>('');
  const [proofUrl, setProofUrl] = useState<string>('');

  useEffect(() => {
    fetchCompletionDocuments();
  }, [appointmentId]);

  const fetchCompletionDocuments = async () => {
    try {
      const { data, error } = await supabase
        .from('job_completion_documents')
        .select('*')
        .eq('appointment_id', appointmentId)
        .single();

      if (error && error.code !== 'PGRST116') { // PGRST116 = no rows returned
        console.error('Error fetching completion documents:', error);
        return;
      }

      if (data) {
        setDocuments(data);
        await fetchSignedUrls(data);
      }
    } catch (error) {
      console.error('Error fetching completion documents:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchSignedUrls = async (doc: CompletionDocument) => {
    try {
      // Get signed URL for invoice
      const { data: invoiceUrlData } = await supabase.storage
        .from('invoices')
        .createSignedUrl(doc.invoice_file_path, 3600); // 1 hour

      if (invoiceUrlData?.signedUrl) {
        setInvoiceUrl(invoiceUrlData.signedUrl);
      }

      // Get signed URL for completion proof
      const { data: proofUrlData } = await supabase.storage
        .from('completion-proofs')
        .createSignedUrl(doc.completion_proof_path, 3600); // 1 hour

      if (proofUrlData?.signedUrl) {
        setProofUrl(proofUrlData.signedUrl);
      }
    } catch (error) {
      console.error('Error creating signed URLs:', error);
    }
  };

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  const downloadFile = async (url: string, filename: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const downloadUrl = window.URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = downloadUrl;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      link.remove();
      window.URL.revokeObjectURL(downloadUrl);
    } catch (error) {
      console.error('Error downloading file:', error);
    }
  };

  if (loading) {
    return (
      <Card className={cn("animate-pulse", className)}>
        <CardHeader>
          <div className="h-4 bg-muted rounded w-1/3"></div>
          <div className="h-3 bg-muted rounded w-1/2"></div>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="h-16 bg-muted rounded"></div>
            <div className="h-16 bg-muted rounded"></div>
          </div>
        </CardContent>
      </Card>
    );
  }

  if (!documents) {
    return (
      <Card className={cn("border-muted", className)}>
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-muted-foreground">
            <FileText className="h-5 w-5" />
            Completion Documents
          </CardTitle>
          <CardDescription>
            No completion documents have been uploaded yet
          </CardDescription>
        </CardHeader>
      </Card>
    );
  }

  const deliveryConfig = deliveryStatusConfig[documents.insurer_delivery_status as keyof typeof deliveryStatusConfig];
  const DeliveryIcon = deliveryConfig?.icon || Clock;

  return (
    <Card className={className}>
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5" />
            Completion Documents
          </CardTitle>
          <Badge className={deliveryConfig?.color}>
            <DeliveryIcon className="h-3 w-3 mr-1" />
            {deliveryConfig?.label}
          </Badge>
        </div>
        <CardDescription>
          Invoice and completion proof uploaded on{' '}
          {format(new Date(documents.uploaded_at), 'MMM d, yyyy \'at\' HH:mm')}
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Delivery Status */}
        <div className="bg-muted/50 rounded-lg p-3">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm font-medium">Delivery Status</p>
              <p className="text-xs text-muted-foreground">
                {documents.sent_to_insurer_at 
                  ? `Sent via ${documents.insurer_delivery_method} on ${format(new Date(documents.sent_to_insurer_at), 'MMM d \'at\' HH:mm')}`
                  : 'Not yet delivered'
                }
              </p>
            </div>
          </div>
        </div>

        {/* Invoice */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Invoice</p>
                <p className="text-xs text-muted-foreground">
                  {documents.invoice_file_name} • {formatFileSize(documents.invoice_file_size)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {invoiceUrl && (
                <>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => window.open(invoiceUrl, '_blank')}
                  >
                    <Eye className="h-4 w-4 mr-1" />
                    View
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(invoiceUrl, documents.invoice_file_name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Completion Proof */}
        <div className="border rounded-lg p-4">
          <div className="flex items-center justify-between mb-2">
            <div className="flex items-center gap-2">
              <FileText className="h-4 w-4" />
              <div>
                <p className="text-sm font-medium">Completion Proof</p>
                <p className="text-xs text-muted-foreground">
                  {documents.completion_proof_file_name} • {formatFileSize(documents.completion_proof_file_size)}
                </p>
              </div>
            </div>
            <div className="flex gap-2">
              {proofUrl && (
                <>
                  <Dialog>
                    <DialogTrigger asChild>
                      <Button variant="outline" size="sm">
                        <Eye className="h-4 w-4 mr-1" />
                        View
                      </Button>
                    </DialogTrigger>
                    <DialogContent className="max-w-3xl">
                      <DialogHeader>
                        <DialogTitle>Completion Proof Photo</DialogTitle>
                        <DialogDescription>
                          Photo evidence of completed repair work
                        </DialogDescription>
                      </DialogHeader>
                      <div className="flex justify-center">
                        <img
                          src={proofUrl}
                          alt="Completion proof"
                          className="max-w-full max-h-96 object-contain rounded-lg"
                        />
                      </div>
                    </DialogContent>
                  </Dialog>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => downloadFile(proofUrl, documents.completion_proof_file_name)}
                  >
                    <Download className="h-4 w-4 mr-1" />
                    Download
                  </Button>
                </>
              )}
            </div>
          </div>
          {proofUrl && (
            <div className="mt-2">
              <img
                src={proofUrl}
                alt="Completion proof thumbnail"
                className="w-full h-24 object-cover rounded border"
              />
            </div>
          )}
        </div>

        {/* Notes */}
        {documents.notes && (
          <div className="text-sm">
            <p className="font-medium mb-1">Notes:</p>
            <p className="text-muted-foreground">{documents.notes}</p>
          </div>
        )}
      </CardContent>
    </Card>
  );
};