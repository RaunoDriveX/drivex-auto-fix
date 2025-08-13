import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogFooter, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Progress } from "@/components/ui/progress";
import { useNavigate } from "react-router-dom";
import { useToast } from "@/components/ui/use-toast";
import { Phone, UserCheck } from "lucide-react";

export type CallCenterCTAProps = {
  token?: string;
  decision?: "repair" | "replacement";
  phoneNumber?: string; // override if needed
  size?: "default" | "sm" | "lg" | "icon";
  variant?: "default" | "secondary" | "outline" | "ghost" | "link" | "destructive";
};

const DEFAULT_NUMBER = "+372 58528824";
const telHref = "tel:+37258528824";

export default function CallCenterCTA({ token, decision, phoneNumber = DEFAULT_NUMBER, size = "lg", variant = "outline" }: CallCenterCTAProps) {
  const [open, setOpen] = useState(false);
  const [status, setStatus] = useState<"idle" | "connecting" | "in-call" | "ended">("idle");
  const navigate = useNavigate();
  const { toast } = useToast();

  // auto-advance from connecting -> in-call
  useEffect(() => {
    if (status === "connecting") {
      const t = setTimeout(() => setStatus("in-call"), 1200);
      return () => clearTimeout(t);
    }
  }, [status]);

  const subtitle = useMemo(() => {
    const parts = [] as string[];
    if (decision) parts.push(`decision: ${decision}`);
    if (token) parts.push(`token: ${token.slice(0, 6)}…`);
    return parts.join(" · ");
  }, [decision, token]);

  const startMock = () => setStatus("connecting");
  const endCall = () => {
    setStatus("ended");
    toast({ title: "Call ended (mock)", description: "We’ll guide you to select a repair shop next." });
    setOpen(false);
    // Navigate to lead form section
    navigate("/#lead-form");
  };

  return (
    <>
      <div 
        className="flex items-center gap-3 cursor-pointer hover:opacity-80 transition-opacity"
        onClick={() => { setOpen(true); setStatus("idle"); }}
      >
        <UserCheck className="h-6 w-6 text-white" />
        <div className="flex items-center gap-2">
          <Phone className="h-5 w-5 text-white" />
          <span className="text-2xl font-bold text-white">{phoneNumber}</span>
        </div>
      </div>

      <Dialog open={open} onOpenChange={setOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Talk to AI assistant</DialogTitle>
            <DialogDescription>
              Call our AI assistant to explain your assessment in simple terms.
              {subtitle ? ` (${subtitle})` : ""}
            </DialogDescription>
          </DialogHeader>

          <div className="space-y-4">
            {status === "idle" && (
              <div className="space-y-3">
                <p className="text-sm text-muted-foreground">Choose how to start:</p>
                <div className="flex flex-wrap gap-3">
                  <Button asChild>
                    <a href={telHref}>Dial {phoneNumber}</a>
                  </Button>
                  <Button variant="secondary" onClick={startMock}>Start mock call</Button>
                </div>
                <p className="text-xs text-muted-foreground">You can use the mock flow if you’re on desktop or can’t place calls from this device.</p>
              </div>
            )}

            {status === "connecting" && (
              <div className="space-y-2">
                <p className="text-sm text-muted-foreground">Connecting to AI assistant…</p>
                <Progress value={45} />
              </div>
            )}

            {status === "in-call" && (
              <div className="space-y-2 p-3 rounded-md border">
                <p className="text-sm">In call with AI assistant</p>
                <p className="text-xs text-muted-foreground">Explaining your {decision || "assessment"}. Ask follow-up questions.</p>
              </div>
            )}

            {status === "ended" && (
              <div className="space-y-2 p-3 rounded-md border">
                <p className="text-sm">Call ended</p>
                <p className="text-xs text-muted-foreground">Proceeding to shop selection…</p>
              </div>
            )}
          </div>

          <DialogFooter className="flex justify-between">
            {status === "in-call" ? (
              <Button onClick={endCall}>End call and continue</Button>
            ) : status === "connecting" ? (
              <Button variant="secondary" onClick={() => setStatus("in-call")}>Join call</Button>
            ) : (
              <Button variant="ghost" onClick={() => setOpen(false)}>Close</Button>
            )}
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </>
  );
}
