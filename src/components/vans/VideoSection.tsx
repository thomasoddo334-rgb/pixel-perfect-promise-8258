import { useEffect, useRef, useState } from "react";
import { Loader2, Trash2, Video } from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Progress } from "@/components/ui/progress";
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
import { MAX_VIDEOS, normalizeVideos, videoFileError, type Vehicle, type VideoRef } from "@/lib/vans/model";
import { VIDEO_OFFLINE_MESSAGE, addVideo, getVideoUrl, removeVideo, useVans } from "@/lib/vans/store";

function VideoPreview({ vehicleId, video, index, onDelete }: { vehicleId: string; video: VideoRef; index: number; onDelete: () => void }) {
  const [url, setUrl] = useState<string | null>(null);
  const [failed, setFailed] = useState(false);
  useEffect(() => {
    let alive = true;
    setFailed(false);
    getVideoUrl(vehicleId, video)
      .then((u) => alive && (u ? setUrl(u) : setFailed(true)))
      .catch(() => alive && setFailed(true));
    return () => {
      alive = false;
    };
  }, [vehicleId, video]);
  return (
    <li className="overflow-hidden rounded-xl border bg-muted/40">
      <div className="flex aspect-video items-center justify-center bg-muted">
        {url ? (
          <video src={url} controls playsInline preload="metadata" className="h-full w-full bg-foreground/90 object-contain" />
        ) : failed ? (
          <p className="px-4 text-center text-sm text-muted-foreground">Aperçu indisponible hors ligne</p>
        ) : (
          <Loader2 className="size-5 animate-spin text-muted-foreground" />
        )}
      </div>
      <div className="flex items-center justify-between gap-2 px-3 py-2">
        <span className="text-sm font-semibold">Vidéo {index + 1}</span>
        <Button variant="ghost" size="sm" className="text-destructive" onClick={onDelete} aria-label={`Supprimer la vidéo ${index + 1}`}>
          <Trash2 /> Supprimer
        </Button>
      </div>
    </li>
  );
}

export function VideoSection({ v }: { v: Vehicle }) {
  const videos = normalizeVideos(v.videos);
  const { sync } = useVans();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState<number | null>(null);
  const [toDelete, setToDelete] = useState<VideoRef | null>(null);
  const full = videos.length >= MAX_VIDEOS;

  function pick() {
    if (!navigator.onLine) {
      toast.error(VIDEO_OFFLINE_MESSAGE);
      return;
    }
    inputRef.current?.click();
  }

  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file) return;
    const invalid = videoFileError(file, videos.length);
    if (invalid) {
      toast.error(invalid);
      return;
    }
    setProgress(0);
    try {
      await addVideo(v.id, file, setProgress);
      toast.success("Vidéo ajoutée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "L'envoi de la vidéo a échoué.");
    } finally {
      setProgress(null);
    }
  }

  async function confirmDelete() {
    const video = toDelete;
    setToDelete(null);
    if (!video) return;
    try {
      await removeVideo(v.id, video.id);
      toast.success("Vidéo supprimée");
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Suppression impossible.");
    }
  }

  return (
    <div className="grid gap-3">
      <p className="text-[13px] text-muted-foreground">
        Facultatives : {MAX_VIDEOS} vidéos maximum, 50 Mo chacune. Elles ne comptent pas dans l'avancement.
      </p>
      <input ref={inputRef} type="file" accept="video/*" className="hidden" onChange={onPick} />
      {progress !== null ? (
        <div className="grid gap-2 rounded-xl bg-muted/60 p-3">
          <div className="flex items-center justify-between text-sm font-medium">
            <span className="flex items-center gap-2">
              <Loader2 className="size-4 animate-spin" /> Envoi de la vidéo…
            </span>
            <span className="tabular-nums">{Math.round(progress * 100)} %</span>
          </div>
          <Progress value={progress * 100} />
        </div>
      ) : (
        <Button variant="soft" size="lg" className="w-full" disabled={full} onClick={pick}>
          <Video />
          {full ? `Maximum ${MAX_VIDEOS} vidéos atteint` : "Ajouter une vidéo"}
        </Button>
      )}
      {!sync.online && !full && progress === null && <p className="text-center text-xs text-muted-foreground">{VIDEO_OFFLINE_MESSAGE}</p>}
      {videos.length > 0 && (
        <ul className="grid gap-3">
          {videos.map((video, i) => (
            <VideoPreview key={video.id} vehicleId={v.id} video={video} index={i} onDelete={() => setToDelete(video)} />
          ))}
        </ul>
      )}
      <AlertDialog open={toDelete !== null} onOpenChange={(open) => !open && setToDelete(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Supprimer cette vidéo ?</AlertDialogTitle>
            <AlertDialogDescription>Elle sera retirée de la fiche et du catalogue visiteur.</AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>Annuler</AlertDialogCancel>
            <AlertDialogAction onClick={() => void confirmDelete()} className="bg-destructive text-destructive-foreground hover:bg-destructive/90">
              Supprimer
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}
