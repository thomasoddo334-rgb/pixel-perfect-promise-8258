import { useState } from "react";
import { Copy, Check, Download, Loader2, Share2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Dialog, DialogContent, DialogDescription, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { buildSocialPost } from "@/lib/vans/exports";
import { collectPhotoFiles, savePhotosToDevice } from "@/lib/vans/export-files";
import type { Vehicle } from "@/lib/vans/model";

export function SocialDialog({ v, open, onOpenChange }: { v: Vehicle; open: boolean; onOpenChange: (o: boolean) => void }) {
  const text = buildSocialPost(v);
  const [copied, setCopied] = useState(false);
  const [saving, setSaving] = useState(false);

  async function copy() {
    try {
      await navigator.clipboard.writeText(text);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast.error("Copie impossible. Sélectionnez le texte manuellement.");
    }
  }

  async function savePhotos() {
    setSaving(true);
    try {
      const { files, missing } = await collectPhotoFiles(v);
      if (!files.length) {
        toast.error("Aucune photo disponible.");
        return;
      }
      const res = await savePhotosToDevice(files);
      if (missing) toast.message(`${missing} photo${missing > 1 ? "s" : ""} pas encore disponible${missing > 1 ? "s" : ""} hors ligne.`);
      else if (res !== "cancelled") toast.success(`${files.length} photos prêtes, dans l'ordre.`);
    } finally {
      setSaving(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[90dvh] overflow-y-auto rounded-2xl">
        <DialogHeader className="text-left">
          <DialogTitle>Facebook / Instagram</DialogTitle>
          <DialogDescription>Texte prêt à coller et photos dans l'ordre.</DialogDescription>
        </DialogHeader>
        <textarea
          readOnly
          value={text}
          rows={12}
          className="w-full resize-none rounded-xl border border-input bg-muted/40 p-3 text-[15px] leading-relaxed"
        />
        <div className="grid gap-2">
          <Button size="lg" onClick={copy}>
            {copied ? <Check /> : <Copy />}
            {copied ? "Copié" : "Copier le texte"}
          </Button>
          <Button size="lg" variant="outline" onClick={savePhotos} disabled={saving}>
            {saving ? <Loader2 className="animate-spin" /> : typeof navigator !== "undefined" && "share" in navigator ? <Share2 /> : <Download />}
            Enregistrer les photos
          </Button>
          <p className="text-center text-xs text-muted-foreground">Sur iPhone, choisissez « Enregistrer les images ».</p>
        </div>
      </DialogContent>
    </Dialog>
  );
}
