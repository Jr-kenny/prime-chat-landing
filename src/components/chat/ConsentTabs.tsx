import { Tabs, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Inbox, Ban, Bell } from "lucide-react";

export type ConsentFilter = "allowed" | "unknown" | "denied";

interface ConsentTabsProps {
  value: ConsentFilter;
  onChange: (value: ConsentFilter) => void;
  counts: {
    allowed: number;
    unknown: number;
    denied: number;
  };
}

export const ConsentTabs = ({ value, onChange, counts }: ConsentTabsProps) => {
  return (
    <Tabs value={value} onValueChange={(v) => onChange(v as ConsentFilter)} className="w-full">
      <TabsList className="w-full grid grid-cols-3 h-9">
        <TabsTrigger value="allowed" className="text-xs gap-1">
          <Inbox className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Inbox</span>
          {counts.allowed > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-primary/20 text-primary rounded-full text-[10px] font-medium">
              {counts.allowed}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="unknown" className="text-xs gap-1 relative">
          <Bell className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Requests</span>
          {counts.unknown > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-destructive text-destructive-foreground rounded-full text-[10px] font-medium animate-pulse">
              {counts.unknown}
            </span>
          )}
        </TabsTrigger>
        <TabsTrigger value="denied" className="text-xs gap-1">
          <Ban className="h-3.5 w-3.5" />
          <span className="hidden sm:inline">Blocked</span>
          {counts.denied > 0 && (
            <span className="ml-0.5 px-1.5 py-0.5 bg-muted text-muted-foreground rounded-full text-[10px] font-medium">
              {counts.denied}
            </span>
          )}
        </TabsTrigger>
      </TabsList>
    </Tabs>
  );
};
