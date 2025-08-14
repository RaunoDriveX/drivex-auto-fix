import { Calendar, MapPin, Clock, DollarSign, Settings } from "lucide-react";
import {
  Sidebar,
  SidebarContent,
  SidebarGroup,
  SidebarGroupContent,
  SidebarGroupLabel,
  SidebarMenu,
  SidebarMenuButton,
  SidebarMenuItem,
  useSidebar,
} from "@/components/ui/sidebar";

interface ShopSidebarProps {
  activeSection: string;
  onSectionChange: (section: string) => void;
  shopData: any;
}

const navigationItems = [
  { id: "calendar", title: "Calendar", icon: Calendar },
  { id: "location", title: "Location", icon: MapPin },
  { id: "availability", title: "Availability", icon: Clock },
  { id: "pricing", title: "Pricing", icon: DollarSign },
  { id: "services", title: "Services", icon: Settings },
];

export function ShopSidebar({ activeSection, onSectionChange, shopData }: ShopSidebarProps) {
  const { state } = useSidebar();

  return (
    <Sidebar collapsible="icon">
      <SidebarContent>
        <SidebarGroup>
          <SidebarGroupLabel>Shop Management</SidebarGroupLabel>
          <SidebarGroupContent>
            <SidebarMenu>
              {navigationItems.map((item) => {
                // For setup flow, hide calendar if no shop data
                if (item.id === "calendar" && !shopData) return null;
                
                const isActive = activeSection === item.id;
                
                return (
                  <SidebarMenuItem key={item.id}>
                    <SidebarMenuButton 
                      onClick={() => onSectionChange(item.id)}
                      className={isActive ? "bg-primary/10 text-primary font-medium" : "hover:bg-muted/50"}
                    >
                      <item.icon className="h-4 w-4" />
                      {state !== "collapsed" && <span>{item.title}</span>}
                    </SidebarMenuButton>
                  </SidebarMenuItem>
                );
              })}
            </SidebarMenu>
          </SidebarGroupContent>
        </SidebarGroup>
      </SidebarContent>
    </Sidebar>
  );
}