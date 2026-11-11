import { useMemo, useState } from "react";
import { Link } from "@tanstack/react-router";
import { ChevronLeft, FileJson, FileSpreadsheet, FolderArchive, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { computeProgress } from "@/lib/vans/model";
import { buildWixCsv } from "@/lib/vans/exports";
import { buildPhotosZip, downloadBlob, todayStamp } from "@/lib/vans/export-files";
import { useVans } from "@/lib/vans/store";
import { Segmented } from "./Segmented";
import { SyncIndicator } from "./SyncIndicator";

type Scope = "pret" | "all";

export function ExportsScreen() {
  const { vehicles } = useVans();
  const [scope, setScope] = useState<Scope>("pret");
  const [zipProgress, setZipProgress] = useState<string | null>(null);
  const ready = useMemo(() => vehicles.filter((v) => computeProgress(v).status === "pret"), [vehicles]);
  const selected = useMemo(
    () => [...(scope === "pret" ? ready : vehicles)].sort((a, b) => a.reference.localeCompare(b.reference)),
    [scope, ready, vehicles],
  );

  function exportCsv() {
    if (!selected.length) {
      toast.error("Aucun véhicule à exporter.");
      return;
    }
    const csv = buildWixCsv(selected);
    downloadBlob(`vans-wix-${todayStamp()}.csv`, new Blob([csv], { type: "text/csv;charset=utf-8" }));
  }

  async function exportZip() {
    if (!selected.length) {
      toast.error("Aucun véhicule à exporter.");
      return;
    }
    setZipProgress("Préparation…");
    try {
      const { blob, count, missing } = await buildPhotosZip(selected, (d, t) => setZipProgress(`${d}/${t} photos`));
      if (!count) {
        toast.error("Aucune photo disponible.");
        return;
      }
      downloadBlob(`vans-photos-${todayStamp()}.zip`, blob);
      if (missing) toast.message(`${missing} photo${missing > 1 ? "s" : ""} manquante${missing > 1 ? "s" : ""}`, { description: "Connectez-vous à internet pour les récupérer." });
    } catch {
      toast.error("Le ZIP n'a pas pu être créé.");
    } finally {
      setZipProgress(null);
    }
  }

  function exportJson() {
    const data = {
      application: "Fiches Vans",
      exporte_le: new Date().toISOString(),
      vehicules: vehicles.map(({ _dirty, ...v }) => {
        void _dirty;
        return { ...v, statut: computeProgress(v).status };
      }),
    };
    downloadBlob(`vans-sauvegarde-${todayStamp()}.json`, new Blob([JSON.stringify(data, null, 2)], { type: "application/json" }));
  }

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center justify-between gap-2 px-2">
          <Button asChild variant="ghost" className="h-11 gap-1 px-2 text-[15px] font-semibold text-primary">
            <Link to="/">
              <ChevronLeft className="size-5" strokeWidth={2.5} /> Stock
            </Link>
          </Button>
          <SyncIndicator className="mr-2" />
        </div>
      </header>
      <main className="pb-safe mx-auto grid max-w-3xl gap-4 px-4 pt-4">
        <h1 className="text-[26px] font-extrabold tracking-tight">Exporter</h1>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <p className="mb-3 text-[13px] font-bold uppercase tracking-wider text-muted-foreground">Véhicules</p>
          <Segmented
            ariaLabel="Véhicules à exporter"
            options={[
              { value: "pret", label: `Prêts à publier (${ready.length})` },
              { value: "all", label: `Tous (${vehicles.length})` },
            ]}
            value={scope}
            onChange={(s) => s && setScope(s)}
            allowDeselect={false}
          />
        </section>

        <section className="grid gap-3 rounded-2xl bg-card p-4 shadow-card">
          <ExportRow
            icon={<FileSpreadsheet />}
            title="CSV pour Wix"
            text="Une ligne par van, prêt à importer dans Wix."
            action={<Button size="lg" onClick={exportCsv} disabled={!selected.length}>Exporter</Button>}
          />
          <div className="h-px bg-border" />
          <ExportRow
            icon={<FolderArchive />}
            title="ZIP des photos"
            text={zipProgress ?? "Un dossier par van, photos nommées dans l'ordre."}
            action={
              <Button size="lg" onClick={() => void exportZip()} disabled={!selected.length || zipProgress !== null}>
                {zipProgress !== null ? <Loader2 className="animate-spin" /> : null}
                Exporter
              </Button>
            }
          />
        </section>

        <section className="rounded-2xl bg-card p-4 shadow-card">
          <ExportRow
            icon={<FileJson />}
            title="Sauvegarde complète"
            text={`Toutes les données des ${vehicles.length} fiches, en JSON.`}
            action={<Button size="lg" variant="outline" onClick={exportJson} disabled={!vehicles.length}>Exporter</Button>}
          />
        </section>
      </main>
    </div>
  );
}

function ExportRow({ icon, title, text, action }: { icon: React.ReactNode; title: string; text: string; action: React.ReactNode }) {
  return (
    <div className="flex items-center gap-3">
      <div className="flex size-11 shrink-0 items-center justify-center rounded-xl bg-primary-soft text-primary [&_svg]:size-5">{icon}</div>
      <div className="min-w-0 flex-1">
        <p className="font-bold">{title}</p>
        <p className="text-[13px] text-muted-foreground">{text}</p>
      </div>
      {action}
    </div>
  );
}
