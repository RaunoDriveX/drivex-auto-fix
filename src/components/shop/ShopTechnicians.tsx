import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Checkbox } from "@/components/ui/checkbox";
import { useToast } from "@/components/ui/use-toast";
import { Plus, UserCheck, Award, Trash2, Calendar, Phone, Mail } from "lucide-react";

interface Technician {
  id: string;
  name: string;
  email?: string;
  phone?: string;
  years_experience: number;
  is_active: boolean;
  hire_date?: string;
  certifications?: TechnicianCertification[];
}

interface TechnicianCertification {
  certification_type: string;
  certified_date: string;
  expires_date?: string;
  certifying_body?: string;
  certificate_number?: string;
}

interface CertificationType {
  certification_type: string;
  name: string;
  description: string;
}

interface ShopTechniciansProps {
  shopId: string;
}

const ShopTechnicians = ({ shopId }: ShopTechniciansProps) => {
  const [technicians, setTechnicians] = useState<Technician[]>([]);
  const [certificationTypes, setCertificationTypes] = useState<CertificationType[]>([]);
  const [loading, setLoading] = useState(true);
  const [isAddingTechnician, setIsAddingTechnician] = useState(false);
  const [selectedTechnician, setSelectedTechnician] = useState<Technician | null>(null);
  const [newTechnician, setNewTechnician] = useState({
    name: '',
    email: '',
    phone: '',
    years_experience: 0,
    hire_date: ''
  });
  const [selectedCertifications, setSelectedCertifications] = useState<string[]>([]);
  const { toast } = useToast();

  useEffect(() => {
    fetchTechnicians();
    fetchCertificationTypes();
  }, [shopId]);

  const fetchTechnicians = async () => {
    try {
      const { data: techData, error: techError } = await supabase
        .from('shop_technicians')
        .select('*')
        .eq('shop_id', shopId)
        .eq('is_active', true)
        .order('name');

      if (techError) throw techError;

      // Fetch certifications for each technician
      const techniciansWithCerts = await Promise.all(
        (techData || []).map(async (tech) => {
          const { data: certData } = await supabase
            .from('shop_technician_certifications')
            .select('*')
            .eq('technician_id', tech.id);

          return {
            ...tech,
            certifications: certData || []
          };
        })
      );

      setTechnicians(techniciansWithCerts);
    } catch (error: any) {
      console.error('Error fetching technicians:', error);
      toast({
        title: "Error",
        description: "Failed to load technicians",
        variant: "destructive"
      });
    } finally {
      setLoading(false);
    }
  };

  const fetchCertificationTypes = async () => {
    try {
      const { data, error } = await supabase
        .from('technician_certifications')
        .select('certification_type, name, description')
        .order('name');

      if (error) throw error;
      setCertificationTypes(data || []);
    } catch (error: any) {
      console.error('Error fetching certification types:', error);
    }
  };

  const handleAddTechnician = async () => {
    if (!newTechnician.name.trim()) {
      toast({
        title: "Error",
        description: "Technician name is required",
        variant: "destructive"
      });
      return;
    }

    try {
      const { data: techData, error: techError } = await supabase
        .from('shop_technicians')
        .insert({
          shop_id: shopId,
          name: newTechnician.name,
          email: newTechnician.email || null,
          phone: newTechnician.phone || null,
          years_experience: newTechnician.years_experience,
          hire_date: newTechnician.hire_date || null
        })
        .select()
        .single();

      if (techError) throw techError;

      // Add selected certifications
      if (selectedCertifications.length > 0) {
        const certifications = selectedCertifications.map(certType => ({
          technician_id: techData.id,
          certification_type: certType as any,
          certified_date: new Date().toISOString().split('T')[0]
        }));

        const { error: certError } = await supabase
          .from('shop_technician_certifications')
          .insert(certifications);

        if (certError) throw certError;
      }

      toast({
        title: "Success",
        description: "Technician added successfully"
      });

      setNewTechnician({ name: '', email: '', phone: '', years_experience: 0, hire_date: '' });
      setSelectedCertifications([]);
      setIsAddingTechnician(false);
      fetchTechnicians();
    } catch (error: any) {
      console.error('Error adding technician:', error);
      toast({
        title: "Error",
        description: "Failed to add technician",
        variant: "destructive"
      });
    }
  };

  const handleDeactivateTechnician = async (technicianId: string) => {
    try {
      const { error } = await supabase
        .from('shop_technicians')
        .update({ is_active: false })
        .eq('id', technicianId);

      if (error) throw error;

      toast({
        title: "Success",
        description: "Technician deactivated"
      });

      fetchTechnicians();
    } catch (error: any) {
      console.error('Error deactivating technician:', error);
      toast({
        title: "Error",
        description: "Failed to deactivate technician",
        variant: "destructive"
      });
    }
  };

  const getCertificationName = (certType: string) => {
    const cert = certificationTypes.find(c => c.certification_type === certType);
    return cert?.name || certType.replace(/_/g, ' ').replace(/\b\w/g, l => l.toUpperCase());
  };

  if (loading) {
    return (
      <Card>
        <CardContent className="py-6">
          <div className="text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="mt-2 text-muted-foreground">Loading technicians...</p>
          </div>
        </CardContent>
      </Card>
    );
  }

  return (
    <div className="space-y-6">
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <UserCheck className="h-5 w-5" />
                Shop Technicians
              </CardTitle>
              <CardDescription>
                Manage your team and their certifications for skill-based job routing
              </CardDescription>
            </div>
            <Dialog open={isAddingTechnician} onOpenChange={setIsAddingTechnician}>
              <DialogTrigger asChild>
                <Button>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Technician
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-md">
                <DialogHeader>
                  <DialogTitle>Add New Technician</DialogTitle>
                  <DialogDescription>
                    Add a technician to your team and assign their certifications
                  </DialogDescription>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="name">Name *</Label>
                    <Input
                      id="name"
                      value={newTechnician.name}
                      onChange={(e) => setNewTechnician(prev => ({ ...prev, name: e.target.value }))}
                      placeholder="John Doe"
                    />
                  </div>
                  <div>
                    <Label htmlFor="email">Email</Label>
                    <Input
                      id="email"
                      type="email"
                      value={newTechnician.email}
                      onChange={(e) => setNewTechnician(prev => ({ ...prev, email: e.target.value }))}
                      placeholder="john@example.com"
                    />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone</Label>
                    <Input
                      id="phone"
                      type="tel"
                      value={newTechnician.phone}
                      onChange={(e) => setNewTechnician(prev => ({ ...prev, phone: e.target.value }))}
                      placeholder="+1-555-0123"
                    />
                  </div>
                  <div>
                    <Label htmlFor="experience">Years of Experience</Label>
                    <Input
                      id="experience"
                      type="number"
                      min="0"
                      value={newTechnician.years_experience}
                      onChange={(e) => setNewTechnician(prev => ({ ...prev, years_experience: parseInt(e.target.value) || 0 }))}
                    />
                  </div>
                  <div>
                    <Label htmlFor="hire_date">Hire Date</Label>
                    <Input
                      id="hire_date"
                      type="date"
                      value={newTechnician.hire_date}
                      onChange={(e) => setNewTechnician(prev => ({ ...prev, hire_date: e.target.value }))}
                    />
                  </div>
                  <div>
                    <Label>Certifications</Label>
                    <div className="space-y-2 max-h-32 overflow-y-auto">
                      {certificationTypes.map((cert) => (
                        <div key={cert.certification_type} className="flex items-center space-x-2">
                          <Checkbox
                            id={cert.certification_type}
                            checked={selectedCertifications.includes(cert.certification_type)}
                            onCheckedChange={(checked) => {
                              if (checked) {
                                setSelectedCertifications(prev => [...prev, cert.certification_type]);
                              } else {
                                setSelectedCertifications(prev => prev.filter(c => c !== cert.certification_type));
                              }
                            }}
                          />
                          <Label htmlFor={cert.certification_type} className="text-sm">
                            {cert.name}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                <DialogFooter>
                  <Button variant="outline" onClick={() => setIsAddingTechnician(false)}>
                    Cancel
                  </Button>
                  <Button onClick={handleAddTechnician}>Add Technician</Button>
                </DialogFooter>
              </DialogContent>
            </Dialog>
          </div>
        </CardHeader>
        <CardContent>
          {technicians.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <UserCheck className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p className="text-lg font-medium">No technicians added yet</p>
              <p className="text-sm">Add your first technician to enable skill-based job routing</p>
            </div>
          ) : (
            <div className="grid gap-4">
              {technicians.map((technician) => (
                <div key={technician.id} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <h3 className="font-semibold text-lg">{technician.name}</h3>
                        <Badge variant="secondary">
                          {technician.years_experience} years exp.
                        </Badge>
                      </div>
                      
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3 text-sm text-muted-foreground">
                        {technician.email && (
                          <div className="flex items-center gap-2">
                            <Mail className="h-4 w-4" />
                            {technician.email}
                          </div>
                        )}
                        {technician.phone && (
                          <div className="flex items-center gap-2">
                            <Phone className="h-4 w-4" />
                            {technician.phone}
                          </div>
                        )}
                        {technician.hire_date && (
                          <div className="flex items-center gap-2">
                            <Calendar className="h-4 w-4" />
                            Hired: {new Date(technician.hire_date).toLocaleDateString()}
                          </div>
                        )}
                      </div>

                      <div>
                        <div className="flex items-center gap-2 mb-2">
                          <Award className="h-4 w-4" />
                          <span className="text-sm font-medium">Certifications</span>
                        </div>
                        <div className="flex flex-wrap gap-2">
                          {technician.certifications && technician.certifications.length > 0 ? (
                            technician.certifications.map((cert, idx) => (
                              <Badge key={idx} variant="outline" className="text-xs">
                                {getCertificationName(cert.certification_type)}
                              </Badge>
                            ))
                          ) : (
                            <span className="text-sm text-muted-foreground">No certifications</span>
                          )}
                        </div>
                      </div>
                    </div>
                    
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleDeactivateTechnician(technician.id)}
                      className="text-destructive hover:text-destructive"
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
};

export default ShopTechnicians;