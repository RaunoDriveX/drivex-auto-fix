import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { ScrollArea } from '@/components/ui/scroll-area';
import { FileText, Plus, Trash2, Check, Clock, Package, Wrench } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';
import { mockBomTemplates } from '@/lib/mockData';

interface LineItem {
  id: string;
  name: string;
  description: string;
  quantity: number;
  unit_price: number;
}

interface CostEstimationDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  serviceType?: string;
  requiresAdas?: boolean;
  onSuccess: () => void;
  isMockMode?: boolean;
}

export function CostEstimationDialog({
  open,
  onOpenChange,
  appointmentId,
  serviceType = 'replacement',
  requiresAdas = false,
  onSuccess,
  isMockMode = false,
}: CostEstimationDialogProps) {
  const { t } = useTranslation('insurer');
  const [lineItems, setLineItems] = useState<LineItem[]>([]);
  const [laborCost, setLaborCost] = useState<number>(0);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  // Calculate totals
  const partsTotal = lineItems.reduce((sum, item) => sum + (item.quantity * item.unit_price), 0);
  const totalCost = partsTotal + laborCost;

  useEffect(() => {
    if (open) {
      // Initialize with template items based on service type
      initializeFromTemplate();
    }
  }, [open, serviceType, requiresAdas]);

  const initializeFromTemplate = () => {
    const templateItems: LineItem[] = [];
    
    // Add service-specific items
    const serviceTemplate = serviceType === 'repair' 
      ? mockBomTemplates.repair 
      : mockBomTemplates.replacement;
    
    serviceTemplate.forEach((item, index) => {
      templateItems.push({
        id: `item-${Date.now()}-${index}`,
        name: item.name,
        description: item.description,
        quantity: 1,
        unit_price: item.unit_price,
      });
    });

    // Add ADAS items if required
    if (requiresAdas) {
      mockBomTemplates.adas.forEach((item, index) => {
        templateItems.push({
          id: `adas-${Date.now()}-${index}`,
          name: item.name,
          description: item.description,
          quantity: 1,
          unit_price: item.unit_price,
        });
      });
    }

    setLineItems(templateItems);
    setLaborCost(serviceType === 'repair' ? 45 : 120);
    setNotes(requiresAdas 
      ? 'Includes ADAS calibration due to camera-equipped windshield. 2-year warranty on installation.'
      : '2-year warranty on installation included.'
    );
  };

  const addLineItem = () => {
    const newItem: LineItem = {
      id: `item-${Date.now()}`,
      name: '',
      description: '',
      quantity: 1,
      unit_price: 0,
    };
    setLineItems([...lineItems, newItem]);
  };

  const updateLineItem = (id: string, field: keyof LineItem, value: string | number) => {
    setLineItems(items =>
      items.map(item =>
        item.id === id ? { ...item, [field]: value } : item
      )
    );
  };

  const removeLineItem = (id: string) => {
    setLineItems(items => items.filter(item => item.id !== id));
  };

  const handleSubmit = async () => {
    if (lineItems.length === 0) {
      toast.error(t('cost_estimation.error_no_items', 'Please add at least one line item'));
      return;
    }

    const hasEmptyItems = lineItems.some(item => !item.name || item.unit_price <= 0);
    if (hasEmptyItems) {
      toast.error(t('cost_estimation.error_incomplete', 'Please complete all line items'));
      return;
    }

    setSubmitting(true);
    try {
      if (isMockMode) {
        await new Promise(resolve => setTimeout(resolve, 1000));
        toast.success(t('cost_estimation.mock_success', 'Mock Mode - Estimate saved locally'));
      } else {
        // Insert cost estimate
        const { error: insertError } = await supabase
          .from('insurer_cost_estimates')
          .insert({
            appointment_id: appointmentId,
            line_items: lineItems.map(item => ({
              name: item.name,
              description: item.description,
              quantity: item.quantity,
              unit_price: item.unit_price,
            })),
            labor_cost: laborCost,
            parts_cost: partsTotal,
            total_cost: totalCost,
            notes,
          });

        if (insertError) throw insertError;

        // Update appointment
        const { error: updateError } = await supabase
          .from('appointments')
          .update({ 
            workflow_stage: 'cost_approval',
            total_cost: totalCost,
          })
          .eq('id', appointmentId);

        if (updateError) throw updateError;

        toast.success(t('cost_estimation.success', 'Cost estimate sent to customer'));
      }

      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error saving cost estimate:', error);
      toast.error(t('cost_estimation.error_saving', 'Failed to save cost estimate'));
    } finally {
      setSubmitting(false);
    }
  };

  const applyTemplate = (template: 'repair' | 'replacement' | 'adas') => {
    const items = mockBomTemplates[template].map((item, index) => ({
      id: `template-${Date.now()}-${index}`,
      name: item.name,
      description: item.description,
      quantity: 1,
      unit_price: item.unit_price,
    }));
    setLineItems([...lineItems, ...items]);
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-3xl max-h-[90vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <FileText className="h-5 w-5 text-primary" />
            {t('cost_estimation.title', 'Cost Estimation')}
          </DialogTitle>
          <DialogDescription>
            {t('cost_estimation.description', 'Create a bill of materials and cost breakdown for the customer')}
          </DialogDescription>
          <div className="flex gap-2 flex-wrap">
            {isMockMode && (
              <Badge variant="outline" className="bg-yellow-500/10 text-yellow-700 border-yellow-300">
                Mock Mode
              </Badge>
            )}
            {requiresAdas && (
              <Badge variant="outline" className="bg-blue-500/10 text-blue-700 border-blue-300">
                ADAS Required
              </Badge>
            )}
          </div>
        </DialogHeader>

        <ScrollArea className="max-h-[60vh] pr-4">
          <div className="space-y-6">
            {/* Quick Templates */}
            <div className="space-y-2">
              <Label>{t('cost_estimation.quick_add', 'Quick Add Templates')}</Label>
              <div className="flex gap-2 flex-wrap">
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate('repair')}
                >
                  <Package className="h-3 w-3 mr-1" />
                  {t('cost_estimation.repair_kit', 'Repair Kit')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate('replacement')}
                >
                  <Package className="h-3 w-3 mr-1" />
                  {t('cost_estimation.replacement_parts', 'Replacement Parts')}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => applyTemplate('adas')}
                >
                  <Wrench className="h-3 w-3 mr-1" />
                  {t('cost_estimation.adas_items', 'ADAS Items')}
                </Button>
              </div>
            </div>

            {/* Line Items */}
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <Label className="flex items-center gap-2">
                  <Package className="h-4 w-4" />
                  {t('cost_estimation.line_items', 'Parts & Materials')}
                </Label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addLineItem}
                >
                  <Plus className="h-4 w-4 mr-1" />
                  {t('cost_estimation.add_item', 'Add Item')}
                </Button>
              </div>

              <div className="space-y-3">
                {lineItems.map((item, index) => (
                  <div key={item.id} className="grid grid-cols-12 gap-2 items-start p-3 bg-muted/50 rounded-lg">
                    <div className="col-span-5">
                      <Input
                        placeholder={t('cost_estimation.item_name', 'Item name')}
                        value={item.name}
                        onChange={(e) => updateLineItem(item.id, 'name', e.target.value)}
                      />
                      <Input
                        placeholder={t('cost_estimation.description', 'Description (optional)')}
                        value={item.description}
                        onChange={(e) => updateLineItem(item.id, 'description', e.target.value)}
                        className="mt-1 text-sm"
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        min="1"
                        placeholder={t('cost_estimation.qty', 'Qty')}
                        value={item.quantity}
                        onChange={(e) => updateLineItem(item.id, 'quantity', parseInt(e.target.value) || 1)}
                      />
                    </div>
                    <div className="col-span-3">
                      <div className="relative">
                        <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                        <Input
                          type="number"
                          min="0"
                          step="0.01"
                          placeholder={t('cost_estimation.unit_price', 'Unit price')}
                          value={item.unit_price}
                          onChange={(e) => updateLineItem(item.id, 'unit_price', parseFloat(e.target.value) || 0)}
                          className="pl-7"
                        />
                      </div>
                    </div>
                    <div className="col-span-1 text-right font-medium pt-2">
                      €{(item.quantity * item.unit_price).toFixed(2)}
                    </div>
                    <div className="col-span-1 flex justify-end">
                      <Button
                        type="button"
                        variant="ghost"
                        size="icon"
                        onClick={() => removeLineItem(item.id)}
                        className="text-destructive hover:text-destructive"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                ))}

                {lineItems.length === 0 && (
                  <div className="text-center py-8 text-muted-foreground border-2 border-dashed rounded-lg">
                    <Package className="h-8 w-8 mx-auto mb-2 opacity-50" />
                    <p>{t('cost_estimation.no_items', 'No items added yet')}</p>
                    <Button
                      type="button"
                      variant="link"
                      onClick={addLineItem}
                      className="mt-2"
                    >
                      <Plus className="h-4 w-4 mr-1" />
                      {t('cost_estimation.add_first_item', 'Add your first item')}
                    </Button>
                  </div>
                )}
              </div>
            </div>

            {/* Labor Cost */}
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Wrench className="h-4 w-4" />
                {t('cost_estimation.labor_cost', 'Labor Cost')}
              </Label>
              <div className="relative max-w-xs">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={laborCost}
                  onChange={(e) => setLaborCost(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>

            {/* Notes */}
            <div className="space-y-2">
              <Label>{t('cost_estimation.notes', 'Notes (optional)')}</Label>
              <Textarea
                placeholder={t('cost_estimation.notes_placeholder', 'Add any notes for the customer...')}
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                rows={3}
              />
            </div>

            {/* Summary */}
            <div className="bg-muted/50 rounded-lg p-4 space-y-2">
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('cost_estimation.parts_subtotal', 'Parts Subtotal')}
                </span>
                <span>€{partsTotal.toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-sm">
                <span className="text-muted-foreground">
                  {t('cost_estimation.labor', 'Labor')}
                </span>
                <span>€{laborCost.toFixed(2)}</span>
              </div>
              <Separator />
              <div className="flex justify-between font-bold text-lg">
                <span>{t('cost_estimation.total', 'Total')}</span>
                <span className="text-primary">€{totalCost.toFixed(2)}</span>
              </div>
            </div>
          </div>
        </ScrollArea>

        <DialogFooter>
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('common:buttons.cancel', 'Cancel')}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting}>
            {submitting ? (
              <Clock className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Check className="h-4 w-4 mr-2" />
            )}
            {t('cost_estimation.send_to_customer', 'Send to Customer')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
