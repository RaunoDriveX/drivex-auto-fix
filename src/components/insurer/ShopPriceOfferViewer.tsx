import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
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
import { Check, CheckCircle, Clock, DollarSign, Package, Wrench, Store, X } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface LineItem {
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface CostEstimate {
  id: string;
  line_items: LineItem[];
  labor_cost: number;
  parts_cost: number;
  total_cost: number;
  notes?: string;
  created_at: string;
  created_by?: string;
}

interface ShopPriceOfferViewerProps {
  appointmentId: string;
  shopName?: string;
  onApproved?: () => void;
  onRejected?: () => void;
  isApproved?: boolean;
  isCustomerApproved?: boolean;
  workflowStage?: string;
}

export function ShopPriceOfferViewer({
  appointmentId,
  shopName,
  onApproved,
  onRejected,
  isApproved = false,
  isCustomerApproved = false,
  workflowStage,
}: ShopPriceOfferViewerProps) {
  const { t } = useTranslation('insurer');
  const [estimate, setEstimate] = useState<CostEstimate | null>(null);
  const [loading, setLoading] = useState(true);
  const [approving, setApproving] = useState(false);
  const [rejecting, setRejecting] = useState(false);
  const [approvalDialogOpen, setApprovalDialogOpen] = useState(false);
  const [rejectDialogOpen, setRejectDialogOpen] = useState(false);

  useEffect(() => {
    fetchEstimate();
  }, [appointmentId]);

  const fetchEstimate = async () => {
    try {
      const { data, error } = await supabase
        .from('insurer_cost_estimates')
        .select('*')
        .eq('appointment_id', appointmentId)
        .order('created_at', { ascending: false })
        .limit(1)
        .single();

      if (error && error.code !== 'PGRST116') {
        throw error;
      }

      if (data) {
        setEstimate({
          ...data,
          line_items: (data.line_items as unknown as LineItem[]) || [],
        });
      }
    } catch (error) {
      console.error('Error fetching cost estimate:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleApprove = async () => {
    setApproving(true);
    try {
      // Update appointment to move to cost_approval stage
      const { error } = await supabase
        .from('appointments')
        .update({
          workflow_stage: 'cost_approval',
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Send notification to customer
      try {
        await supabase.functions.invoke('send-customer-notification', {
          body: {
            appointmentId,
            notificationType: 'cost_approval',
          },
        });
      } catch (notifError) {
        console.error('Failed to send notification:', notifError);
      }

      toast.success(t('shop_offer.approved_success', 'Price offer approved and sent to customer'));
      setApprovalDialogOpen(false);
      onApproved?.();
    } catch (error) {
      console.error('Error approving price offer:', error);
      toast.error(t('shop_offer.error_approving', 'Failed to approve price offer'));
    } finally {
      setApproving(false);
    }
  };

  const handleReject = async () => {
    setRejecting(true);
    try {
      // Move back to customer_handover stage for shop to revise
      const { error } = await supabase
        .from('appointments')
        .update({
          workflow_stage: 'customer_handover',
        })
        .eq('id', appointmentId);

      if (error) throw error;

      // Delete the cost estimate
      await supabase
        .from('insurer_cost_estimates')
        .delete()
        .eq('appointment_id', appointmentId);

      toast.success(t('shop_offer.rejected_success', 'Price offer rejected - shop will be notified'));
      setRejectDialogOpen(false);
      onRejected?.();
    } catch (error) {
      console.error('Error rejecting price offer:', error);
      toast.error(t('shop_offer.error_rejecting', 'Failed to reject price offer'));
    } finally {
      setRejecting(false);
    }
  };

  if (loading) {
    return (
      <div className="animate-pulse space-y-2 p-4 bg-muted/50 rounded-lg">
        <div className="h-4 bg-muted rounded w-1/3"></div>
        <div className="h-8 bg-muted rounded w-full"></div>
      </div>
    );
  }

  if (!estimate) {
    // If in damage_report stage but no estimate, this shouldn't happen with the new flow
    // But keep as fallback - check if appointment has total_cost directly
    if (workflowStage === 'damage_report') {
      return (
        <div className="flex items-center gap-2 py-4 px-3 text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg">
          <Clock className="h-4 w-4 animate-pulse" />
          {t('shop_offer.awaiting_shop_price', 'Shop has submitted a price - loading details...')}
        </div>
      );
    }
    // If in customer_handover stage, shop hasn't submitted their price yet
    if (workflowStage === 'customer_handover') {
      return (
        <div className="flex items-center gap-2 py-4 px-3 text-sm text-blue-700 bg-blue-50 border border-blue-200 rounded-lg">
          <Clock className="h-4 w-4" />
          {t('shop_offer.shop_preparing', 'Waiting for shop to submit their price offer')}
        </div>
      );
    }
    return (
      <div className="text-center py-4 text-sm text-muted-foreground border border-dashed rounded-lg">
        {t('shop_offer.no_offer', 'No price offer submitted yet')}
      </div>
    );
  }

  // Check if this is in damage_report stage - shop has submitted but insurer hasn't approved yet
  const isPendingInsurerApproval = !isApproved && !isCustomerApproved;

  return (
    <Card className={isCustomerApproved ? "border-green-300 bg-green-100/50" : (isApproved ? "border-green-200 bg-green-50/50" : "border-amber-200 bg-amber-50/50")}>
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardTitle className="text-base flex items-center gap-2">
            <Store className="h-4 w-4 text-amber-600" />
            {t('shop_offer.title', "Shop's Price Offer")}
          </CardTitle>
          <div className="flex items-center gap-2">
            {isPendingInsurerApproval && (
              <Badge variant="outline" className="text-xs bg-amber-100 text-amber-800 border-amber-300">
                <Clock className="h-3 w-3 mr-1" />
                {t('shop_offer.awaiting_approval', 'Awaiting Your Approval')}
              </Badge>
            )}
            {shopName && (
              <Badge variant="secondary" className="text-xs">
                {shopName}
              </Badge>
            )}
          </div>
        </div>
      </CardHeader>
      <CardContent className="space-y-4">
        {/* Line Items */}
        {estimate.line_items.length > 0 && (
          <div className="space-y-2">
            <div className="flex items-center gap-2 text-sm font-medium text-muted-foreground">
              <Package className="h-4 w-4" />
              {t('shop_offer.parts_materials', 'Parts & Materials')}
            </div>
            <div className="bg-background rounded-lg border">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b bg-muted/50">
                    <th className="text-left p-2 font-medium">Item</th>
                    <th className="text-center p-2 font-medium w-12">Qty</th>
                    <th className="text-right p-2 font-medium w-20">Price</th>
                  </tr>
                </thead>
                <tbody>
                  {estimate.line_items.map((item, index) => (
                    <tr key={index} className={index !== estimate.line_items.length - 1 ? 'border-b' : ''}>
                      <td className="p-2">
                        <p className="font-medium">{item.name}</p>
                        {item.description && (
                          <p className="text-xs text-muted-foreground">{item.description}</p>
                        )}
                      </td>
                      <td className="text-center p-2">{item.quantity}</td>
                      <td className="text-right p-2">€{(item.quantity * item.unit_price).toFixed(2)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Cost Summary */}
        <div className="bg-background rounded-lg p-3 space-y-1">
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground">Parts & Materials</span>
            <span>€{estimate.parts_cost.toFixed(2)}</span>
          </div>
          <div className="flex justify-between text-sm">
            <span className="text-muted-foreground flex items-center gap-1">
              <Wrench className="h-3 w-3" />
              Labor
            </span>
            <span>€{estimate.labor_cost.toFixed(2)}</span>
          </div>
          <Separator className="my-2" />
          <div className="flex justify-between font-bold">
            <span>Total</span>
            <span className="text-primary text-lg">€{estimate.total_cost.toFixed(2)}</span>
          </div>
        </div>

        {/* Notes */}
        {estimate.notes && (
          <div className="text-sm p-2 bg-background rounded border">
            <p className="text-muted-foreground text-xs mb-1">Shop Notes:</p>
            <p>{estimate.notes}</p>
          </div>
        )}

        {/* Action Buttons or Approved State */}
        {isCustomerApproved ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-100 border border-green-300 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-700" />
            <span className="font-medium text-green-800">
              {t('shop_offer.customer_approved_status', 'Customer approved - job is scheduled')}
            </span>
          </div>
        ) : isApproved ? (
          <div className="flex items-center justify-center gap-2 p-3 bg-green-50 border border-green-200 rounded-lg">
            <CheckCircle className="h-5 w-5 text-green-600" />
            <span className="font-medium text-green-700">
              {t('shop_offer.approved_status', 'Price approved - awaiting customer confirmation')}
            </span>
          </div>
        ) : (
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              size="sm"
              className="flex-1"
              onClick={() => setRejectDialogOpen(true)}
            >
              <X className="h-4 w-4 mr-1" />
              {t('shop_offer.reject', 'Reject')}
            </Button>
            <Button
              size="sm"
              className="flex-1"
              onClick={() => setApprovalDialogOpen(true)}
            >
              <Check className="h-4 w-4 mr-1" />
              {t('shop_offer.approve', 'Approve & Send to Customer')}
            </Button>
          </div>
        )}
      </CardContent>

      {/* Approval Dialog */}
      <AlertDialog open={approvalDialogOpen} onOpenChange={setApprovalDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shop_offer.confirm_approval_title', 'Approve Price Offer')}</AlertDialogTitle>
            <AlertDialogDescription asChild>
              <div className="space-y-2">
                <p>{t('shop_offer.confirm_approval_message', 'Approving this offer will send it to the customer for final confirmation.')}</p>
                <div className="p-3 bg-muted rounded-lg mt-2">
                  <div className="flex justify-between font-medium">
                    <span>Total Cost</span>
                    <span className="text-primary">€{estimate.total_cost.toFixed(2)}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={approving}>Cancel</AlertDialogCancel>
            <AlertDialogAction onClick={handleApprove} disabled={approving}>
              {approving ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Check className="h-4 w-4 mr-2" />
              )}
              Approve
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Reject Dialog */}
      <AlertDialog open={rejectDialogOpen} onOpenChange={setRejectDialogOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('shop_offer.confirm_reject_title', 'Reject Price Offer')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('shop_offer.confirm_reject_message', 'Rejecting this offer will notify the shop to revise their pricing.')}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={rejecting}>Cancel</AlertDialogCancel>
            <AlertDialogAction 
              onClick={handleReject} 
              disabled={rejecting}
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
            >
              {rejecting ? (
                <Clock className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <X className="h-4 w-4 mr-2" />
              )}
              Reject
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
