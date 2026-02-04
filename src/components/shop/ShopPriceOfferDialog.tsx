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
import { RadioGroup, RadioGroupItem } from '@/components/ui/radio-group';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import { FileText, Check, Clock, DollarSign, Wrench, Package, Car, Zap, Send } from 'lucide-react';
import { toast } from 'sonner';
import { supabase } from '@/integrations/supabase/client';

interface PricingRule {
  id: string;
  service_type: string;
  damage_type: string;
  base_price: number;
  description: string | null;
  estimated_duration_minutes: number | null;
}

interface ShopPriceOfferDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  appointmentId: string;
  shopId: string;
  currentGlassType?: string;
  currentDamageType?: string;
  onSuccess: () => void;
}

const GLASS_TYPES = [
  { value: 'windshield', label: 'Front Windshield' },
  { value: 'rear_window', label: 'Rear Window' },
  { value: 'side_window_front_left', label: 'Side Window - Front Left' },
  { value: 'side_window_front_right', label: 'Side Window - Front Right' },
  { value: 'side_window_rear_left', label: 'Side Window - Rear Left' },
  { value: 'side_window_rear_right', label: 'Side Window - Rear Right' },
  { value: 'sunroof', label: 'Sunroof' },
];

const DAMAGE_TYPES = [
  { value: 'chip', label: 'Stone Chip' },
  { value: 'crack', label: 'Crack' },
  { value: 'shattered', label: 'Shattered' },
  { value: 'scratch', label: 'Scratch' },
  { value: 'stress_crack', label: 'Stress Crack' },
];

const REPAIR_ACTIONS = [
  { value: 'repair', label: 'Repair', description: 'Fix the existing glass - suitable for small chips and minor damage' },
  { value: 'replace', label: 'Replace', description: 'Full glass replacement - required for larger cracks or shattered glass' },
];

export function ShopPriceOfferDialog({
  open,
  onOpenChange,
  appointmentId,
  shopId,
  currentGlassType,
  currentDamageType,
  onSuccess,
}: ShopPriceOfferDialogProps) {
  const { t } = useTranslation(['shop', 'common']);
  
  const [glassType, setGlassType] = useState(currentGlassType || 'windshield');
  const [damageType, setDamageType] = useState(currentDamageType || 'chip');
  const [repairAction, setRepairAction] = useState<'repair' | 'replace'>('repair');
  const [partsCost, setPartsCost] = useState<number>(0);
  const [laborCost, setLaborCost] = useState<number>(75);
  const [notes, setNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [pricingRules, setPricingRules] = useState<PricingRule[]>([]);
  const [loadingRules, setLoadingRules] = useState(false);
  const [selectedRule, setSelectedRule] = useState<string | null>(null);

  // Calculate total
  const totalCost = partsCost + laborCost;

  // Fetch pricing rules for this shop
  useEffect(() => {
    if (open && shopId) {
      fetchPricingRules();
    }
  }, [open, shopId]);

  const fetchPricingRules = async () => {
    setLoadingRules(true);
    try {
      const { data, error } = await supabase
        .from('service_pricing')
        .select('*')
        .eq('shop_id', shopId)
        .order('service_type', { ascending: true });
      
      if (error) throw error;
      setPricingRules(data || []);
    } catch (error) {
      console.error('Error fetching pricing rules:', error);
    } finally {
      setLoadingRules(false);
    }
  };

  // Apply pricing rule
  const applyPricingRule = (ruleId: string) => {
    const rule = pricingRules.find(r => r.id === ruleId);
    if (rule) {
      setSelectedRule(ruleId);
      setPartsCost(rule.base_price);
      // Set repair action based on service type
      if (rule.service_type.includes('repair')) {
        setRepairAction('repair');
      } else if (rule.service_type.includes('replacement')) {
        setRepairAction('replace');
      }
      // Estimate labor cost based on duration
      if (rule.estimated_duration_minutes) {
        const laborRate = 1.5; // €1.50 per minute
        setLaborCost(Math.round(rule.estimated_duration_minutes * laborRate));
      }
      if (rule.description) {
        setNotes(rule.description);
      }
    }
  };

  // Get matching rules for current damage type
  const getMatchingRules = () => {
    return pricingRules.filter(rule => 
      rule.damage_type.toLowerCase() === damageType.toLowerCase() ||
      rule.damage_type.toLowerCase().includes(damageType.toLowerCase())
    );
  };

  // Auto-adjust defaults based on damage type (fallback when no rules)
  useEffect(() => {
    if (selectedRule) return; // Don't override if a rule is selected
    
    if (damageType === 'shattered') {
      setRepairAction('replace');
      setPartsCost(350);
      setLaborCost(120);
    } else if (damageType === 'crack') {
      setRepairAction('replace');
      setPartsCost(280);
      setLaborCost(100);
    } else if (damageType === 'chip') {
      setRepairAction('repair');
      setPartsCost(25);
      setLaborCost(45);
    } else {
      setPartsCost(50);
      setLaborCost(60);
    }
  }, [damageType, selectedRule]);

  // Update glass type and damage type from props
  useEffect(() => {
    if (currentGlassType) {
      // Normalize glass type
      const normalizedGlass = currentGlassType.toLowerCase().includes('windshield') 
        ? 'windshield' 
        : currentGlassType.toLowerCase().includes('rear') 
          ? 'rear_window' 
          : currentGlassType.toLowerCase();
      setGlassType(normalizedGlass);
    }
    if (currentDamageType) {
      setDamageType(currentDamageType.toLowerCase());
    }
  }, [currentGlassType, currentDamageType]);

  const handleSubmit = async () => {
    if (totalCost <= 0) {
      toast.error(t('price_offer.error_no_price', 'Please enter a valid price'));
      return;
    }

    setSubmitting(true);
    try {
      // Create cost estimate from shop
      const lineItems = [
        {
          name: repairAction === 'repair' ? 'Repair Kit & Materials' : `${GLASS_TYPES.find(g => g.value === glassType)?.label || 'Glass'} Replacement`,
          description: `${DAMAGE_TYPES.find(d => d.value === damageType)?.label || damageType} - ${repairAction === 'repair' ? 'Repair' : 'Replacement'}`,
          quantity: 1,
          unit_price: partsCost,
        }
      ];

      // Insert into insurer_cost_estimates (shop's offer)
      // Note: created_by is uuid type, so we don't pass shopId (which is text)
      // RLS policy uses appointment.shop_id to verify shop ownership
      const { error: insertError } = await supabase
        .from('insurer_cost_estimates')
        .insert({
          appointment_id: appointmentId,
          line_items: lineItems,
          labor_cost: laborCost,
          parts_cost: partsCost,
          total_cost: totalCost,
          notes: notes || `${repairAction === 'repair' ? 'Repair' : 'Replacement'} recommended for ${DAMAGE_TYPES.find(d => d.value === damageType)?.label || damageType}`,
        });

      if (insertError) throw insertError;

      // Update appointment with the pricing (keep in damage_report stage for insurer review)
      const { error: updateError } = await supabase
        .from('appointments')
        .update({
          service_type: `${glassType}_${repairAction}`,
          damage_type: damageType,
          total_cost: totalCost,
          ai_recommended_repair: repairAction,
        })
        .eq('id', appointmentId);

      if (updateError) throw updateError;

      toast.success(t('price_offer.success', 'Price offer submitted for insurer review'));
      onSuccess();
      onOpenChange(false);
    } catch (error) {
      console.error('Error submitting price offer:', error);
      toast.error(t('price_offer.error_saving', 'Failed to submit price offer'));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-primary" />
            {t('price_offer.title', 'Offer Price')}
          </DialogTitle>
          <DialogDescription>
            {t('price_offer.description', 'Set the glass type, damage assessment, and your price offer')}
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-6 py-4 max-h-[60vh] overflow-y-auto">
          {/* Quick Apply from Pricing Rules */}
          {pricingRules.length > 0 && (
            <div className="space-y-2">
              <Label className="flex items-center gap-2">
                <Zap className="h-4 w-4 text-amber-500" />
                {t('price_offer.quick_apply', 'Quick Apply from Pricing Rules')}
              </Label>
              <div className="grid grid-cols-1 gap-2">
                {getMatchingRules().length > 0 ? (
                  getMatchingRules().map((rule) => (
                    <Button
                      key={rule.id}
                      variant={selectedRule === rule.id ? "default" : "outline"}
                      size="sm"
                      className="justify-between h-auto py-2"
                      onClick={() => applyPricingRule(rule.id)}
                    >
                      <span className="flex flex-col items-start">
                        <span className="font-medium">{rule.service_type} - {rule.damage_type}</span>
                        {rule.description && (
                          <span className="text-xs text-muted-foreground">{rule.description}</span>
                        )}
                      </span>
                      <Badge variant="secondary" className="ml-2">€{rule.base_price}</Badge>
                    </Button>
                  ))
                ) : (
                  <p className="text-sm text-muted-foreground">
                    {t('price_offer.no_matching_rules', 'No pricing rules match this damage type. You can add rules in Settings.')}
                  </p>
                )}
              </div>
              {pricingRules.length > getMatchingRules().length && (
                <details className="text-sm">
                  <summary className="cursor-pointer text-muted-foreground hover:text-foreground">
                    {t('price_offer.show_all_rules', 'Show all pricing rules')} ({pricingRules.length})
                  </summary>
                  <div className="grid grid-cols-1 gap-2 mt-2">
                    {pricingRules.filter(r => !getMatchingRules().includes(r)).map((rule) => (
                      <Button
                        key={rule.id}
                        variant="ghost"
                        size="sm"
                        className="justify-between h-auto py-2"
                        onClick={() => applyPricingRule(rule.id)}
                      >
                        <span className="flex flex-col items-start">
                          <span className="font-medium">{rule.service_type} - {rule.damage_type}</span>
                          {rule.description && (
                            <span className="text-xs text-muted-foreground">{rule.description}</span>
                          )}
                        </span>
                        <Badge variant="outline" className="ml-2">€{rule.base_price}</Badge>
                      </Button>
                    ))}
                  </div>
                </details>
              )}
              <Separator className="my-3" />
            </div>
          )}

          {/* Glass Type Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Car className="h-4 w-4" />
              {t('price_offer.glass_type', 'Glass Type')}
            </Label>
            <Select value={glassType} onValueChange={setGlassType}>
              <SelectTrigger>
                <SelectValue placeholder="Select glass type" />
              </SelectTrigger>
              <SelectContent>
                {GLASS_TYPES.map((glass) => (
                  <SelectItem key={glass.value} value={glass.value}>
                    {glass.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Damage Type Selection */}
          <div className="space-y-2">
            <Label className="flex items-center gap-2">
              <Package className="h-4 w-4" />
              {t('price_offer.damage_type', 'Damage Type')}
            </Label>
            <Select value={damageType} onValueChange={setDamageType}>
              <SelectTrigger>
                <SelectValue placeholder="Select damage type" />
              </SelectTrigger>
              <SelectContent>
                {DAMAGE_TYPES.map((damage) => (
                  <SelectItem key={damage.value} value={damage.value}>
                    {damage.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* Repair/Replace Action */}
          <div className="space-y-3">
            <Label className="flex items-center gap-2">
              <Wrench className="h-4 w-4" />
              {t('price_offer.recommended_action', 'Recommended Action')}
            </Label>
            <RadioGroup 
              value={repairAction} 
              onValueChange={(value) => setRepairAction(value as 'repair' | 'replace')}
              className="grid grid-cols-2 gap-3"
            >
              {REPAIR_ACTIONS.map((action) => (
                <div key={action.value} className="relative">
                  <RadioGroupItem
                    value={action.value}
                    id={action.value}
                    className="peer sr-only"
                  />
                  <Label
                    htmlFor={action.value}
                    className="flex flex-col items-center justify-center rounded-lg border-2 border-muted bg-popover p-4 hover:bg-accent hover:text-accent-foreground peer-data-[state=checked]:border-primary peer-data-[state=checked]:bg-primary/5 cursor-pointer transition-all"
                  >
                    <span className="text-sm font-semibold">{action.label}</span>
                    <span className="text-xs text-muted-foreground text-center mt-1">
                      {action.description}
                    </span>
                  </Label>
                </div>
              ))}
            </RadioGroup>
          </div>

          <Separator />

          {/* Pricing */}
          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-2">
              <Label>{t('price_offer.parts_cost', 'Parts & Materials')}</Label>
              <div className="relative">
                <span className="absolute left-3 top-1/2 -translate-y-1/2 text-muted-foreground">€</span>
                <Input
                  type="number"
                  min="0"
                  step="0.01"
                  value={partsCost}
                  onChange={(e) => setPartsCost(parseFloat(e.target.value) || 0)}
                  className="pl-7"
                />
              </div>
            </div>
            <div className="space-y-2">
              <Label>{t('price_offer.labor_cost', 'Labor Cost')}</Label>
              <div className="relative">
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
          </div>

          {/* Total */}
          <div className="bg-primary/5 rounded-lg p-4">
            <div className="flex justify-between items-center">
              <span className="font-semibold">{t('price_offer.total', 'Total Price')}</span>
              <span className="text-2xl font-bold text-primary">€{totalCost.toFixed(2)}</span>
            </div>
          </div>

          {/* Notes */}
          <div className="space-y-2">
            <Label>{t('price_offer.notes', 'Notes (optional)')}</Label>
            <Textarea
              placeholder={t('price_offer.notes_placeholder', 'Add any notes about the repair...')}
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              rows={2}
            />
          </div>

          {/* Confirmation Notice */}
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-3">
            <p className="text-sm text-blue-800">
              <strong>{t('price_offer.confirm_notice_title', 'Confirmation:')}</strong>{' '}
              {t('price_offer.confirm_notice', 'By submitting, this price offer will be sent to the insurer for review and approval.')}
            </p>
          </div>
        </div>

        <DialogFooter className="flex-col sm:flex-row gap-2">
          <Button variant="outline" onClick={() => onOpenChange(false)}>
            {t('cancel', { ns: 'common' })}
          </Button>
          <Button onClick={handleSubmit} disabled={submitting} className="gap-2">
            {submitting ? (
              <Clock className="h-4 w-4 animate-spin" />
            ) : (
              <Send className="h-4 w-4" />
            )}
            {t('price_offer.confirm_submit', 'Confirm & Send for Insurance Review')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
