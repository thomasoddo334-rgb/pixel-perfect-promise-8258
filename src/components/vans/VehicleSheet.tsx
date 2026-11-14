import { useMemo, useState, type ReactNode } from "react";
import { Link, useNavigate } from "@tanstack/react-router";
import { AlertCircle, Check, ChevronDown, ChevronLeft, Megaphone, Trash2 } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { cn } from "@/lib/utils";
import {
  BOITES,
  CARBURANTS,
  COUCHAGES,
  DISPONIBILITES,
  EQUIPEMENTS,
  MARQUES,
  PLACES,
  PHOTO_COUNT,
  REMARQUE_MAX,
  WOF_LABEL,
  computeProgress,
  formatNumber,
  type Vehicle,
} from "@/lib/vans/model";
import { deleteVehicle, setPublication, syncNow, updateVehicle, useVans } from "@/lib/vans/store";
import { PhotoGrid } from "./PhotoGrid";
import { Segmented, ToggleChip } from "./Segmented";
import { SocialDialog } from "./SocialDialog";
import { StatusPill } from "./StatusPill";
import { SyncIndicator } from "./SyncIndicator";

function digits(value: string, max = 9): number | null {
  const d = value.replace(/\D/g, "").slice(0, max);
  return d ? Number(d) : null;
}

function Section({ title, children, aside }: { title: string; children: ReactNode; aside?: ReactNode }) {
  return (
    <section className="rounded-2xl bg-card p-4 shadow-card">
      <div className="mb-3 flex items-center justify-between">
        <h2 className="text-[13px] font-bold uppercase tracking-wider text-muted-foreground">{title}</h2>
        {aside}
      </div>
      <div className="grid gap-4">{children}</div>
    </section>
  );
}

function Field({ label, htmlFor, children, missing }: { label: string; htmlFor?: string; children: ReactNode; missing?: boolean }) {
  return (
    <div className="grid gap-1.5">
      <label htmlFor={htmlFor} className="flex items-center gap-1.5 text-[14px] font-semibold">
        {label}
        {missing && <span className="size-1.5 rounded-full bg-status-progress" aria-label="à renseigner" />}
      </label>
      {children}
    </div>
  );
}

const inputClass = "h-12 rounded-xl bg-card text-[16px]";

function SaveButton({ onSave, className }: { onSave: () => void; className?: string }) {
  return (
    <Button size="xl" className={cn("w-full", className)} onClick={onSave}>
      <Check strokeWidth={2.5} />
      Enregistrer et retourner au stock
    </Button>
  );
}

export function VehicleSheet({ id }: { id: string }) {
  const { vehicles, loaded } = useVans();
  const v = vehicles.find((x) => x.id === id);
  if (!loaded) return null;
  if (!v) {
    return (
      <div className="pt-safe flex min-h-dvh flex-col items-center justify-center px-6 text-center">
        <p className="text-lg font-semibold">Fiche introuvable</p>
        <p className="mt-1 text-sm text-muted-foreground">Elle a peut-être été supprimée.</p>
        <Button asChild size="lg" className="mt-6">
          <Link to="/">Retour au stock</Link>
        </Button>
      </div>
    );
  }
  return <VehicleForm v={v} />;
}

function VehicleForm({ v }: { v: Vehicle }) {
  const navigate = useNavigate();
  const progress = useMemo(() => computeProgress(v), [v]);
  const [showMissing, setShowMissing] = useState(false);
  const [marqueFocus, setMarqueFocus] = useState(false);
  const [socialOpen, setSocialOpen] = useState(false);
  const [confirmDelete, setConfirmDelete] = useState(false);
  const set = (patch: Partial<Vehicle>) => updateVehicle(v.id, patch);
  const missingField = (label: string) => progress.missingFields.includes(label);

  const marqueSuggestions = useMemo(() => {
    const q = v.marque.trim().toLowerCase();
    const list = MARQUES.filter((m) => !q || m.toLowerCase().startsWith(q) || m.toLowerCase().includes(q));
    return list.filter((m) => m !== v.marque);
  }, [v.marque]);

  function save() {
    void syncNow();
    toast.success("Fiche enregistrée", { duration: 1500 });
    void navigate({ to: "/" });
  }

  const eq = new Set(v.equipements);
  const toggleEq = (key: string) => {
    const next = new Set(eq);
    if (next.has(key)) next.delete(key);
    else next.add(key);
    // Keep any retired option (e.g. old "chauffage") stored as-is: it is hidden, never deleted.
    const known = new Set<string>(EQUIPEMENTS.map((e) => e.key));
    set({ equipements: [...EQUIPEMENTS.map((e) => e.key).filter((k) => next.has(k)), ...v.equipements.filter((k) => !known.has(k))] });
  };

  return (
    <div className="min-h-dvh bg-background">
      <header className="pt-safe sticky top-0 z-30 border-b bg-background/90 backdrop-blur-xl">
        <div className="mx-auto flex h-14 max-w-3xl items-center gap-2 px-2">
          <Button variant="ghost" className="h-11 gap-1 px-2 text-[15px] font-semibold text-primary" onClick={save}>
            <ChevronLeft className="size-5" strokeWidth={2.5} />
            Enregistrer et retourner au stock
          </Button>
        </div>
      </header>

      <main className="pb-safe mx-auto grid max-w-3xl gap-4 px-4 pt-4">
        {/* Summary + progress */}
        <section className="rounded-2xl bg-card p-4 shadow-card">
          <div className="flex items-start justify-between gap-3">
            <div className="min-w-0">
              <p className="text-xs font-bold tracking-wider text-muted-foreground">{v.reference}</p>
              <p className="truncate text-xl font-extrabold leading-tight">
                {[v.marque, v.modele].filter((x) => x.trim()).join(" ") || "Nouveau véhicule"}
              </p>
            </div>
            <StatusPill status={progress.status} className="mt-1" />
          </div>
          <div className="mt-4 flex items-center gap-3">
            <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-muted">
              <div
                className={cn(
                  "h-full rounded-full transition-all duration-500",
                  progress.isComplete ? "bg-status-ready" : "bg-primary",
                )}
                style={{ width: `${progress.percent}%` }}
              />
            </div>
            <span className="w-11 text-right text-sm font-bold tabular-nums">{progress.percent}%</span>
          </div>
          <div className="mt-3 flex items-center justify-between gap-2">
            {progress.isComplete ? (
              <p className="flex items-center gap-1.5 text-sm font-semibold text-status-ready">
                <Check className="size-4" strokeWidth={3} /> Fiche complète
              </p>
            ) : (
              <button
                type="button"
                onClick={() => setShowMissing((s) => !s)}
                className="flex items-center gap-1 text-sm font-semibold text-status-progress"
                aria-expanded={showMissing}
              >
                <AlertCircle className="size-4" />
                {progress.missingFields.length + progress.missingPhotos.length} élément
                {progress.missingFields.length + progress.missingPhotos.length > 1 ? "s" : ""} manquant
                {progress.missingFields.length + progress.missingPhotos.length > 1 ? "s" : ""}
                <ChevronDown className={cn("size-4 transition-transform", showMissing && "rotate-180")} />
              </button>
            )}
            <SyncIndicator />
          </div>
          {showMissing && !progress.isComplete && (
            <div className="mt-3 grid gap-3 rounded-xl bg-muted/60 p-3 text-sm">
              {progress.missingFields.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Champs</p>
                  <p className="text-muted-foreground">{progress.missingFields.join(", ")}</p>
                </div>
              )}
              {progress.missingPhotos.length > 0 && (
                <div>
                  <p className="mb-1 font-semibold">Photos</p>
                  <p className="text-muted-foreground">{progress.missingPhotos.join(", ")}</p>
                </div>
              )}
            </div>
          )}
        </section>

        <Section title="Véhicule">
          <Field label="Marque" htmlFor="marque" missing={missingField("Marque")}>
            <Input
              id="marque"
              value={v.marque}
              onChange={(e) => set({ marque: e.target.value })}
              onFocus={() => setMarqueFocus(true)}
              onBlur={() => setTimeout(() => setMarqueFocus(false), 150)}
              placeholder="ex. Toyota"
              autoComplete="off"
              autoCapitalize="words"
              className={inputClass}
            />
            {(marqueFocus || !v.marque) && marqueSuggestions.length > 0 && (
              <div className="no-scrollbar -mx-4 flex gap-2 overflow-x-auto px-4 pt-1">
                {marqueSuggestions.map((m) => (
                  <button
                    key={m}
                    type="button"
                    onMouseDown={(e) => e.preventDefault()}
                    onClick={() => {
                      set({ marque: m });
                      setMarqueFocus(false);
                    }}
                    className="h-9 shrink-0 rounded-full border border-input bg-card px-3.5 text-sm font-medium active:bg-accent"
                  >
                    {m}
                  </button>
                ))}
              </div>
            )}
          </Field>
          <Field label="Modèle" htmlFor="modele" missing={missingField("Modèle")}>
            <Input
              id="modele"
              value={v.modele}
              onChange={(e) => set({ modele: e.target.value })}
              placeholder="ex. Hiace"
              autoCapitalize="words"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label="Plaque d’immatriculation" htmlFor="plaque">
            <Input
              id="plaque"
              value={v.plaque}
              onChange={(e) => set({ plaque: e.target.value.toUpperCase() })}
              placeholder="ex. AB-123-CD"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <div className="grid grid-cols-2 gap-3">
            <Field label="Année" htmlFor="annee" missing={missingField("Année")}>
              <Input
                id="annee"
                inputMode="numeric"
                value={v.annee ?? ""}
                onChange={(e) => set({ annee: digits(e.target.value, 4) })}
                placeholder="ex. 2014"
                className={inputClass}
              />
            </Field>
            <Field label="Kilométrage" htmlFor="km" missing={missingField("Kilométrage")}>
              <div className="relative">
                <Input
                  id="km"
                  inputMode="numeric"
                  value={formatNumber(v.kilometrage)}
                  onChange={(e) => set({ kilometrage: digits(e.target.value, 7) })}
                  placeholder="ex. 185 000"
                  className={cn(inputClass, "pr-11")}
                />
                <span className="pointer-events-none absolute right-3.5 top-3.5 text-sm text-muted-foreground">km</span>
              </div>
            </Field>
          </div>
          <Field label="Motorisation" htmlFor="moteur" missing={missingField("Motorisation")}>
            <Input
              id="moteur"
              value={v.motorisation}
              onChange={(e) => set({ motorisation: e.target.value })}
              placeholder="ex. 3.0 L turbo diesel"
              autoComplete="off"
              className={inputClass}
            />
          </Field>
          <Field label="Boîte" missing={missingField("Boîte")}>
            <Segmented
              ariaLabel="Boîte"
              options={BOITES.map((b) => ({ value: b, label: b }))}
              value={v.boite}
              onChange={(b) => set({ boite: b })}
            />
          </Field>
          <Field label="Carburant" missing={missingField("Carburant")}>
            <Segmented
              ariaLabel="Carburant"
              options={CARBURANTS.map((c) => ({ value: c, label: c }))}
              value={v.carburant}
              onChange={(c) => set({ carburant: c })}
              columns={3}
            />
          </Field>
        </Section>

        <Section title="Capacité">
          <Field label="Nombre de places (carte grise)" missing={missingField("Nombre de places")}>
            <Segmented
              ariaLabel="Nombre de places"
              options={PLACES.map((n) => ({ value: n, label: String(n) }))}
              value={v.places}
              onChange={(n) => set({ places: n })}
              columns={4}
            />
          </Field>
          <Field label="Nombre de couchages" missing={missingField("Nombre de couchages")}>
            <Segmented
              ariaLabel="Nombre de couchages"
              options={COUCHAGES.map((n) => ({ value: n, label: String(n) }))}
              value={v.couchages}
              onChange={(n) => set({ couchages: n })}
              columns={6}
            />
          </Field>
        </Section>

        <Section title="Équipements">
          <div className="grid grid-cols-2 gap-2">
            {EQUIPEMENTS.map((e) => (
              <ToggleChip key={e.key} active={eq.has(e.key)} onClick={() => toggleEq(e.key)}>
                {e.label}
              </ToggleChip>
            ))}
          </div>
          <ToggleChip active={v.wof} onClick={() => set({ wof: !v.wof })}>
            {WOF_LABEL}
          </ToggleChip>
        </Section>

        <Section title="Prix et disponibilité">
          <Field label="Prix (NZD)" htmlFor="prix" missing={missingField("Prix")}>
            <div className="relative">
              <span className="pointer-events-none absolute left-3.5 top-3 text-[17px] font-semibold text-muted-foreground">$</span>
              <Input
                id="prix"
                inputMode="numeric"
                value={formatNumber(v.prix)}
                onChange={(e) => set({ prix: digits(e.target.value, 8) })}
                placeholder="ex. 24 500"
                className={cn(inputClass, "pl-8 text-[17px] font-semibold")}
              />
            </div>
          </Field>
          <Field label="Disponibilité">
            <Segmented
              ariaLabel="Disponibilité"
              options={DISPONIBILITES.map((d) => ({ value: d, label: d }))}
              value={v.disponibilite}
              onChange={(d) => set({ disponibilite: d ?? "Disponible" })}
              allowDeselect={false}
            />
          </Field>
        </Section>

        <Section
          title="Photos"
          aside={
            <span className="text-sm font-bold tabular-nums text-muted-foreground">
              {progress.photosDone}/{PHOTO_COUNT}
            </span>
          }
        >
          <PhotoGrid v={v} />
        </Section>

        <Section
          title="Remarque"
          aside={
            <span className="text-xs tabular-nums text-muted-foreground">
              {v.remarque.length}/{REMARQUE_MAX}
            </span>
          }
        >
          <textarea
            value={v.remarque}
            maxLength={REMARQUE_MAX}
            onChange={(e) => set({ remarque: e.target.value.slice(0, REMARQUE_MAX) })}
            rows={4}
            placeholder="Facultatif"
            aria-label="Remarque"
            className="w-full resize-none rounded-xl border border-input bg-card p-3 text-[16px] focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring"
          />
        </Section>

        <Section title="Publication">
          {progress.isComplete ? (
            <Segmented
              ariaLabel="Publication"
              options={[
                { value: "pret", label: "Prêt à publier" },
                { value: "publie", label: "Publié" },
              ]}
              value={v.publication}
              onChange={(p) => setPublication(v.id, (p as "pret" | "publie" | null) ?? null)}
            />
          ) : (
            <p className="text-sm text-muted-foreground">
              « Prêt à publier » et « Publié » seront proposés quand la fiche sera complète.
            </p>
          )}
          <Button variant="outline" size="lg" onClick={() => setSocialOpen(true)}>
            <Megaphone />
            Facebook / Instagram
          </Button>
        </Section>

        <SaveButton onSave={save} className="mt-2" />

        <Button variant="ghost" className="mb-4 h-11 text-destructive" onClick={() => setConfirmDelete(true)}>
          <Trash2 /> Supprimer cette fiche
        </Button>
      </main>

      <SocialDialog v={v} open={socialOpen} onOpenChange={setSocialOpen} />
      <AlertDialog open={confirmDelete} onOpenChange={setConfirmDelete}>
        <AlertDialogContent className="rounded-2xl">
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer {v.reference} ?</AlertDialogTitle>
            <AlertDialogDescription>La fiche disparaîtra du stock pour vous deux.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction
              className="bg-destructive text-destructive-foreground hover:bg-destructive/90"
              onClick={() => {
                deleteVehicle(v.id);
                void navigate({ to: "/" });
              }}
            >
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}

