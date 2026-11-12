import { useState, type ReactNode } from "react";
import { Loader2, ShieldAlert, WifiOff } from "lucide-react";
import { Link, useHydrated } from "@tanstack/react-router";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { lovable } from "@/integrations/lovable";
import { useAuth } from "@/lib/auth";
const vanIcon = "/icons/icon-192.png";

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
    <div className="mb-10 flex flex-col items-center text-center">
      <div className="mb-5 rounded-[26px] border border-white/10 bg-white/5 p-3 shadow-[0_18px_40px_-24px_rgba(16,68,62,0.95)] backdrop-blur-sm">
        <img src={vanIcon} alt="" width={72} height={72} className="size-18 rounded-[20px]" />
      </div>
      <h1 className="text-3xl font-black tracking-[-0.06em] text-foreground">Fiches Vans</h1>
      <p className="mt-2 max-w-xs text-[15px] leading-6 text-muted-foreground">
        Préparez vos fiches véhicules avant publication sur le site.
      </p>
    </div>
  );
}

function VisitorAccess() {
  return (
    <Button
      asChild
      size="xl"
      className="w-full rounded-[20px] border-0 bg-[linear-gradient(135deg,#0f7c80_0%,#1d9a8a_50%,#2b8a73_100%)] text-base font-semibold text-white shadow-[0_20px_40px_-18px_rgba(14,89,80,0.85)] transition-all duration-200 hover:translate-y-[-1px] hover:shadow-[0_24px_42px_-18px_rgba(14,89,80,0.95)]"
    >
      <Link to="/public">Accéder en tant que visiteur</Link>
    </Button>
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
      <div className="relative overflow-hidden rounded-[32px] border border-border/70 bg-card/90 p-6 shadow-[0_20px_60px_-28px_rgba(0,0,0,0.4)] backdrop-blur-sm">
        <div className="pointer-events-none absolute inset-0 bg-[radial-gradient(circle_at_top,_rgba(33,128,118,0.22),_transparent_46%),radial-gradient(circle_at_bottom_right,_rgba(243,169,72,0.18),_transparent_34%)]" />
        <div className="relative">
          <Brand />
          <div className="space-y-4">
            <VisitorAccess />
            <div className="flex justify-end">
              <Button
                variant="outline"
                size="sm"
                className="rounded-full border-border/60 bg-white/80 px-3 py-2 text-[11px] font-medium tracking-[0.02em] text-foreground shadow-sm backdrop-blur-sm hover:bg-white"
                onClick={signIn}
                disabled={busy}
              >
                {busy ? <Loader2 className="size-4 animate-spin" /> : <GoogleLogo />}
                Google
              </Button>
            </div>
          </div>
          <p className="mt-5 text-center text-[11px] uppercase tracking-[0.12em] text-muted-foreground/80">
            Accès réservé aux administrateurs
          </p>
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
