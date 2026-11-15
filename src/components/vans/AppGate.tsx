import { useState, type ReactNode } from "react";
import { Loader2, ShieldAlert, WifiOff } from "lucide-react";
import { Link, useHydrated } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
import { BrandLogo } from "./PublicBrand";

function GoogleLogo() {
  return (
    <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" width="18" height="18" aria-hidden="true">
      <path fill="#4285F4" d="M23.49 12.27c0-.79-.07-1.54-.19-2.27H12v4.51h6.47c-.29 1.48-1.14 2.73-2.4 3.58v3h3.86c2.26-2.09 3.56-5.17 3.56-8.82z" />
      <path fill="#34A853" d="M12 24c3.24 0 5.95-1.08 7.93-2.91l-3.86-3c-1.08.72-2.45 1.16-4.07 1.16-3.13 0-5.78-2.11-6.73-4.96H1.29v3.09C3.26 21.3 7.31 24 12 24z" />
      <path fill="#FBBC05" d="M5.27 14.29c-.25-.72-.38-1.49-.38-2.29s.14-1.57.38-2.29V6.62H1.29C.47 8.24 0 10.06 0 12s.47 3.76 1.29 5.38l3.98-3.09z" />
      <path fill="#EA4335" d="M12 4.75c1.77 0 3.35.61 4.6 1.8l3.42-3.42C17.95 1.19 15.24 0 12 0 7.31 0 3.26 2.7 1.29 6.62l3.98 3.09c.95-2.85 3.6-4.96 6.73-4.96z" />
    </svg>
  );
}

function Centered({ children }: { children: ReactNode }) {
  return (
    <main className="pt-safe pb-safe flex min-h-dvh flex-col items-center justify-center bg-background px-6">
      <div className="w-full max-w-sm">{children}</div>
    </main>
  );
}

function Brand() {
  return (
    <div className="mb-8 flex flex-col items-center text-center">
      <BrandLogo eager className="mb-4 size-28" />
      <h1 className="text-2xl font-extrabold tracking-tight text-foreground">Fiches Vans</h1>
      <p className="mt-2 max-w-xs text-[15px] leading-6 text-muted-foreground">
        Préparez vos fiches véhicules avant publication sur le site.
      </p>
    </div>
  );
}

function SignInScreen() {
  const [busy, setBusy] = useState(false);
  async function signIn() {
    setBusy(true);
    const result = await lovable.auth.signInWithOAuth("google", {
      redirect_uri: window.location.origin,
      extraParams: { prompt: "select_account" },
    });
    if (result.error) {
      setBusy(false);
      toast.error("Connexion impossible", { description: "Vérifiez votre connexion internet et réessayez." });
    }
  }
  return (
    <Centered>
      <div className="rounded-3xl border border-border/70 bg-card p-6 shadow-card">
        <Brand />
        <Button size="xl" className="w-full rounded-2xl text-base font-semibold" onClick={signIn} disabled={busy}>
          {busy ? (
            <Loader2 className="size-5 animate-spin" />
          ) : (
            <span className="flex size-6 items-center justify-center rounded-full bg-white">
              <GoogleLogo />
            </span>
          )}
          Se connecter avec Google
        </Button>
        <p className="mt-3 text-center text-xs text-muted-foreground">Accès réservé à l'équipe JCC Campervans.</p>
        <div className="mt-6 border-t pt-4 text-center">
          <Link to="/public" className="text-sm font-medium text-foreground/80 underline-offset-4 hover:underline">
            Voir les vans à vendre (visiteur)
          </Link>
        </div>
      </div>
    </Centered>
  );
}

export function AppGate({ children }: { children: ReactNode }) {
  const hydrated = useHydrated();
  const auth = useAuth();

  if (!hydrated || auth.status === "loading" || auth.status === "checking") {
    return (
      <Centered>
        <div className="flex justify-center text-muted-foreground">
          <Loader2 className="size-6 animate-spin" />
        </div>
      </Centered>
    );
  }
  if (auth.status === "signedOut") return <SignInScreen />;
  if (auth.status === "needsNetwork") {
    return (
      <Centered>
        <Brand />
        <div className="rounded-2xl bg-card p-5 text-center shadow-card">
          <WifiOff className="mx-auto mb-3 size-6 text-muted-foreground" />
          <p className="font-semibold">Première vérification nécessaire</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Connectez-vous une fois à internet pour vérifier votre accès. Ensuite l'application fonctionne hors ligne.
          </p>
        </div>
      </Centered>
    );
  }
  if (auth.status === "denied") {
    return (
      <Centered>
        <Brand />
        <div className="rounded-2xl bg-card p-5 text-center shadow-card">
          <ShieldAlert className="mx-auto mb-3 size-6 text-destructive" />
          <p className="font-semibold">Accès non autorisé</p>
          <p className="mt-1 text-sm text-muted-foreground">
            Le compte {auth.email} n'a pas accès à cette application.
          </p>
          <Button variant="outline" size="lg" className="mt-4 w-full" onClick={() => void auth.signOut()}>
            Changer de compte
          </Button>
        </div>
        <Button asChild variant="link" className="mt-3 w-full">
          <Link to="/public">Voir les vans à vendre</Link>
        </Button>
      </Centered>
    );
  }
  return <>{children}</>;
}
