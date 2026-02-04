import React, { useState } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog';
import { FileText, Check, X, Clock, Package, Wrench, Info } from 'lucide-react';
import { toast } from 'sonner';
import type { MockCostEstimate } from '@/lib/mockData';

interface CostApprovalCardProps {
  estimate: MockCostEstimate;
  shopName?: string;
  onApprove: () => Promise<void>;
  onRequestRevision?: () => void;
  isLoading?: boolean;
  isMockMode?: boolean;
}

export function CostApprovalCard({
  estimate,
  shopName,
  onApprove,
  onRequestRevision,
  isLoading,
  isMockMode,
}: CostApprovalCardProps) {
  const { t } = useTranslation('common');
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleApprove = async () => {
    setSubmitting(true);
    try {
      await onApprove();
      if (isMockMode) {
        toast.success(t('customer_confirmation.mock_mode_notice', 'Mock Mode - Approval saved locally'));
      } else {
        toast.success(t('customer_confirmation.cost_approved', 'Cost estimate approved'));
      }
      setApprovalDialogOpen(false);
    } catch (error) {
      toast.error(t('customer_confirmation.error_approving', 'Failed to approve estimate'));
    } finally {
      setSubmitting(false);
    }
  };

  if (isLoading) {
    return (
      <Card className="border-primary/20 bg-primary/5">
        <CardHeader>
          <div className="h-6 w-48 bg-muted animate-pulse rounded" />
          <div className="h-4 w-64 bg-muted animate-pulse rounded mt-2" />
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="h-40 bg-muted animate-pulse rounded-lg" />
        </CardContent>
      </Card>
    );
  }

  return (
    <>
      <Card className="border-primary/20 bg-gradient-to-br from-primary/5 to-background">
        <CardHeader>
          <div className="flex items-center gap-2">
            <div className="p-2 bg-primary/10 rounded-lg">
              <FileText className="h-5 w-5 text-primary" />
            </div>
            <div>
              <CardTitle className="text-lg">
                {t('customer_confirmation.approve_cost_title', 'Review Cost Estimate')}
              </CardTitle>
              <CardDescription>
                {t('customer_confirmation.approve_cost_description', 'Please review and approve the repair cost')}
              </CardDescription>
            </div>
          </div>
          <div className="flex flex-wrap gap-2 mt-2">
            {isMockMode && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">
                Mock Mode
              </Badge>
            )}
            {shopName && (
              <Badge variant="secondary">
                <Wrench className="h-3 w-3 mr-1" />
                {shopName}
              </Badge>
            )}
          </div>
        </CardHeader>
        
        <CardContent className="space-y-4">
          {/* Parts Section */}
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              {t('customer_confirmation.parts_materials', 'Parts & Materials')}
            </div>
            <div className="bg-card rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-3 font-medium">
                      {t('customer_confirmation.item', 'Item')}
                    </th>
                    <th className="text-center p-3 font-medium w-16">
                      {t('customer_confirmation.qty', 'Qty')}
                    </th>
                    <th className="text-right p-3 font-medium w-24">
                      {t('customer_confirmation.price', 'Price')}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.line_items.map((item, index) => (
                    <tr key={item.id} className={index !== estimate.line_items.length - 1 ? 'border-b' : ''}>
                      <td className="p-3">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </td>
                      <td className="text-center p-3">{item.quantity}</td>
                      <td className="text-right p-3">€{(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>

          {/* Cost Summary */}
          <div className="bg-muted/50 rounded-lg p-4 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('customer_confirmation.parts_subtotal', 'Parts Subtotal')}
              </span>
              <span>€{estimate.parts_cost.toFixed(2)}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">
                {t('customer_confirmation.labor', 'Labor')}
              </span>
              <span>€{estimate.labor_cost.toFixed(2)}</span>
            </div>
            <Separator className="my-2" />
            <div className="flex justify-between font-bold text-lg">
              <span>{t('customer_confirmation.total', 'Total')}</span>
              <span className="text-primary">€{estimate.total_cost.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          {estimate.notes && (
            <div className="flex gap-2 p-3 bg-blue-500/10 rounded-lg border border-blue-200">
              <Info className="h-4 w-4 text-blue-600 shrink-0 mt-0.5" />
              <p className="text-sm text-blue-800">{estimate.notes}</p>
            </div>
          )}
        </CardContent>

        <CardFooter className="flex flex-col sm:flex-row gap-3 pt-4">
          {onRequestRevision && (
            <Button
              variant="outline"
              onClick={onRequestRevision}
              className="w-full sm:w-auto"
            >
              <X className="h-4 w-4 mr-2" />
              {t('customer_confirmation.request_revision', 'Request Revision')}
            </Button>
          )}
          <Button
            onClick={() => setApprovalDialogOpen(true)}
            className="w-full sm:flex-1"
          >
            <Check className="h-4 w-4 mr-2" />
            {t('customer_confirmation.approve_estimate', 'Approve Estimate')}
          </Button>
        </CardFooter>
      </Card>

      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>
              {t('customer_confirmation.confirm_approval_title', 'Confirm Cost Approval')}
            </AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>
                  {t('customer_confirmation.confirm_approval_message', 'You are about to approve the following cost estimate:')}
                </p>
                <div className="p-3 bg-muted rounded-lg mt-2">
                  <div className="flex justify-between">
                    <span>{t('customer_confirmation.parts_materials', 'Parts & Materials')}</span>
                    <span>€{estimate.parts_cost.toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>{t('customer_confirmation.labor', 'Labor')}</span>
                    <span>€{estimate.labor_cost.toFixed(2)}</span>
                  </div>
                  <Separator className="my-2" />
                  <div className="flex justify-between font-bold">
                    <span>{t('customer_confirmation.total', 'Total')}</span>
                    <span>€{estimate.total_cost.toFixed(2)}</span>
                  </div>
                </div>
                <p className="text-sm mt-3">
                  {t('customer_confirmation.confirm_approval_note', 'Once approved, the repair shop will proceed with the work. You will receive updates on the repair progress.')}
                </p>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={submitting}>
              {t('buttons.cancel', 'Cancel')}
            </AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={submitting}>
              {submitting ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              {t('customer_confirmation.approve', 'Approve')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </>
  );
}
