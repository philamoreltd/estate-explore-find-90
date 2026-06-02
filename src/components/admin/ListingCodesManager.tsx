import { useEffect, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { supabase } from "@/integrations/supabase/client";
import { useAuth } from "@/contexts/AuthContext";
import { useToast } from "@/hooks/use-toast";
import { Loader2, Plus, Copy, Trash2, Power } from "lucide-react";

interface ListingCode {
  id: string;
  code: string;
  notes: string | null;
  active: boolean;
  created_at: string;
}

const generateCode = () =>
  "HV-" +
  Math.random().toString(36).slice(2, 6).toUpperCase() +
  "-" +
  Math.random().toString(36).slice(2, 6).toUpperCase();

export const ListingCodesManager = () => {
  const { user } = useAuth();
  const { toast } = useToast();
  const [codes, setCodes] = useState<ListingCode[]>([]);
  const [loading, setLoading] = useState(true);
  const [newCode, setNewCode] = useState(generateCode());
  const [notes, setNotes] = useState("");
  const [creating, setCreating] = useState(false);

  const fetchCodes = async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from("listing_fee_codes")
      .select("*")
      .order("created_at", { ascending: false });
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      setCodes(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchCodes();
  }, []);

  const createCode = async () => {
    if (!user || !newCode.trim()) return;
    setCreating(true);
    const { error } = await supabase.from("listing_fee_codes").insert({
      code: newCode.trim().toUpperCase(),
      notes: notes.trim() || null,
      created_by: user.id,
    });
    setCreating(false);
    if (error) {
      toast({ title: "Could not create code", description: error.message, variant: "destructive" });
      return;
    }
    toast({ title: "Code created", description: newCode });
    setNewCode(generateCode());
    setNotes("");
    fetchCodes();
  };

  const toggleActive = async (id: string, active: boolean) => {
    const { error } = await supabase
      .from("listing_fee_codes")
      .update({ active: !active })
      .eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchCodes();
    }
  };

  const remove = async (id: string) => {
    if (!confirm("Delete this code?")) return;
    const { error } = await supabase.from("listing_fee_codes").delete().eq("id", id);
    if (error) {
      toast({ title: "Error", description: error.message, variant: "destructive" });
    } else {
      fetchCodes();
    }
  };

  const copy = (code: string) => {
    navigator.clipboard.writeText(code);
    toast({ title: "Copied", description: code });
  };

  return (
    <Card>
      <CardHeader>
        <CardTitle>Listing Fee Codes</CardTitle>
        <CardDescription>
          Issue reusable codes that exempt a landlord from the 2% listing fee.
        </CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <div className="grid gap-2 md:grid-cols-[1fr_2fr_auto] items-end">
          <div className="space-y-1">
            <label className="text-xs font-medium">Code</label>
            <Input
              value={newCode}
              onChange={(e) => setNewCode(e.target.value.toUpperCase())}
              placeholder="HV-XXXX-XXXX"
            />
          </div>
          <div className="space-y-1">
            <label className="text-xs font-medium">Notes (optional)</label>
            <Input
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="e.g. Promo for partner landlords"
            />
          </div>
          <Button onClick={createCode} disabled={creating || !newCode.trim()}>
            {creating ? <Loader2 className="h-4 w-4 mr-2 animate-spin" /> : <Plus className="h-4 w-4 mr-2" />}
            Create
          </Button>
        </div>

        <div className="overflow-x-auto">
          {loading ? (
            <p className="text-sm text-muted-foreground p-4">Loading...</p>
          ) : codes.length === 0 ? (
            <p className="text-sm text-muted-foreground p-4">No codes yet.</p>
          ) : (
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b text-left">
                  <th className="p-2">Code</th>
                  <th className="p-2">Notes</th>
                  <th className="p-2">Status</th>
                  <th className="p-2">Created</th>
                  <th className="p-2 text-right">Actions</th>
                </tr>
              </thead>
              <tbody>
                {codes.map((c) => (
                  <tr key={c.id} className="border-b hover:bg-muted/50">
                    <td className="p-2 font-mono">{c.code}</td>
                    <td className="p-2 text-muted-foreground">{c.notes || "—"}</td>
                    <td className="p-2">
                      <Badge variant={c.active ? "default" : "secondary"}>
                        {c.active ? "Active" : "Revoked"}
                      </Badge>
                    </td>
                    <td className="p-2 text-muted-foreground">
                      {new Date(c.created_at).toLocaleDateString()}
                    </td>
                    <td className="p-2 text-right space-x-1">
                      <Button size="sm" variant="ghost" onClick={() => copy(c.code)}>
                        <Copy className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => toggleActive(c.id, c.active)}>
                        <Power className="h-4 w-4" />
                      </Button>
                      <Button size="sm" variant="ghost" onClick={() => remove(c.id)}>
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </CardContent>
    </Card>
  );
};
