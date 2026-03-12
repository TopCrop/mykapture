import { useState } from "react";
import { motion } from "framer-motion";
import { Plus, Trash2, Pencil, Loader2, GripVertical, Check, X } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { useOrgSolutionOptions, useCreateSolutionOption, useUpdateSolutionOption, useDeleteSolutionOption } from "@/hooks/useData";
import { toast } from "sonner";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";

const DEFAULT_OPTIONS = ["automation", "integration", "analytics", "reporting", "marketing", "security", "compliance", "other"];

interface SolutionOptionsManagerProps {
  orgId: string;
  orgName?: string;
}

export function SolutionOptionsManager({ orgId, orgName }: SolutionOptionsManagerProps) {
  const { data: options = [], isLoading } = useOrgSolutionOptions(orgId);
  const createOption = useCreateSolutionOption();
  const updateOption = useUpdateSolutionOption();
  const deleteOption = useDeleteSolutionOption();

  const [newLabel, setNewLabel] = useState("");
  const [editingId, setEditingId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const hasCustomOptions = options.length > 0;
  const displayOptions = hasCustomOptions ? options : DEFAULT_OPTIONS.map((label, i) => ({ id: `default-${i}`, label, sort_order: i, org_id: orgId, created_at: "" }));

  const handleAdd = async () => {
    if (!newLabel.trim()) return;
    try {
      await createOption.mutateAsync({ org_id: orgId, label: newLabel.trim(), sort_order: options.length });
      setNewLabel("");
      toast.success("Solution option added");
    } catch (err: any) {
      toast.error(err.message || "Failed to add option");
    }
  };

  const handleUpdate = async (id: string) => {
    if (!editLabel.trim()) return;
    try {
      await updateOption.mutateAsync({ id, label: editLabel.trim(), org_id: orgId });
      setEditingId(null);
      toast.success("Option updated");
    } catch (err: any) {
      toast.error(err.message || "Failed to update option");
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await deleteOption.mutateAsync({ id, org_id: orgId });
      toast.success("Option removed");
    } catch (err: any) {
      toast.error(err.message || "Failed to delete option");
    }
  };

  const handleInitializeDefaults = async () => {
    try {
      for (let i = 0; i < DEFAULT_OPTIONS.length; i++) {
        await createOption.mutateAsync({ org_id: orgId, label: DEFAULT_OPTIONS[i], sort_order: i });
      }
      toast.success("Default solutions initialized — you can now customize them");
    } catch (err: any) {
      toast.error(err.message || "Failed to initialize defaults");
    }
  };

  return (
    <motion.div initial={{ opacity: 0, y: 12 }} animate={{ opacity: 1, y: 0 }} className="glass-card overflow-hidden">
      <div className="p-5 pb-3">
        <h3 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Solutions / Needs Options {orgName && <span className="normal-case">— {orgName}</span>}
        </h3>
        <p className="text-[11px] text-muted-foreground mt-1">
          {hasCustomOptions
            ? "These options appear as checkboxes during lead qualification."
            : "Using default options. Click \"Customize\" to create your own set."}
        </p>
      </div>
      <div className="mx-5 brand-line" />

      {isLoading ? (
        <div className="p-10 text-center"><Loader2 className="h-5 w-5 animate-spin mx-auto text-muted-foreground" /></div>
      ) : (
        <div className="p-5 space-y-3">
          {/* Option list */}
          <div className="space-y-1.5">
            {displayOptions.map((opt) => (
              <div key={opt.id} className="flex items-center gap-2 group">
                <GripVertical className="h-3.5 w-3.5 text-muted-foreground/40 shrink-0" />
                {editingId === opt.id ? (
                  <>
                    <Input
                      value={editLabel}
                      onChange={(e) => setEditLabel(e.target.value)}
                      className="h-8 text-xs flex-1"
                      autoFocus
                      onKeyDown={(e) => { if (e.key === "Enter") handleUpdate(opt.id); if (e.key === "Escape") setEditingId(null); }}
                    />
                    <Button variant="ghost" size="icon" className="h-7 w-7 text-emerald-400" onClick={() => handleUpdate(opt.id)}>
                      <Check className="h-3.5 w-3.5" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => setEditingId(null)}>
                      <X className="h-3.5 w-3.5" />
                    </Button>
                  </>
                ) : (
                  <>
                    <span className="text-sm flex-1 capitalize">{opt.label}</span>
                    {hasCustomOptions && (
                      <div className="flex items-center gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                        <Button
                          variant="ghost"
                          size="icon"
                          className="h-7 w-7 text-muted-foreground hover:text-foreground"
                          onClick={() => { setEditingId(opt.id); setEditLabel(opt.label); }}
                        >
                          <Pencil className="h-3 w-3" />
                        </Button>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button variant="ghost" size="icon" className="h-7 w-7 text-muted-foreground hover:text-destructive">
                              <Trash2 className="h-3 w-3" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle>Remove "{opt.label}"?</AlertDialogTitle>
                              <AlertDialogDescription>This option will no longer appear during lead capture. Existing leads with this option won't be affected.</AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel>Cancel</AlertDialogCancel>
                              <AlertDialogAction onClick={() => handleDelete(opt.id)} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">Remove</AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    )}
                  </>
                )}
              </div>
            ))}
          </div>

          {/* Add new / Initialize */}
          {hasCustomOptions ? (
            <div className="flex gap-2 pt-2 border-t border-border">
              <Input
                value={newLabel}
                onChange={(e) => setNewLabel(e.target.value)}
                placeholder="Add new solution option..."
                className="h-8 text-xs flex-1"
                onKeyDown={(e) => { if (e.key === "Enter") handleAdd(); }}
              />
              <Button size="sm" className="h-8 gap-1 text-xs" onClick={handleAdd} disabled={!newLabel.trim() || createOption.isPending}>
                {createOption.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Plus className="h-3 w-3" />}
                Add
              </Button>
            </div>
          ) : (
            <div className="pt-2 border-t border-border">
              <Button size="sm" variant="outline" className="gap-1.5 text-xs" onClick={handleInitializeDefaults} disabled={createOption.isPending}>
                {createOption.isPending ? <Loader2 className="h-3 w-3 animate-spin" /> : <Pencil className="h-3 w-3" />}
                Customize Solutions
              </Button>
              <p className="text-[10px] text-muted-foreground mt-1.5">
                This will copy the defaults into editable options you can add, rename, or remove.
              </p>
            </div>
          )}
        </div>
      )}
    </motion.div>
  );
}
