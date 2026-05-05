export default function DevSettingsPage() {
  return (
    <main className="flex flex-1 flex-col gap-8 p-8 max-w-xl">
      <div>
        <h1 className="text-4xl font-medium">Ajustes</h1>
        <p className="text-sm text-muted-foreground mt-1">
          Preferencias de la cuenta.
        </p>
      </div>
      <div className="rounded-2xl border border-dashed border-border/70 bg-card/40 p-10 text-center">
        <p className="text-sm text-muted-foreground">
          Página de ajustes — solo visual en modo dev.
        </p>
      </div>
    </main>
  );
}
