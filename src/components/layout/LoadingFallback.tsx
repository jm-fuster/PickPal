/**
 * Estado de carga genérico para páginas que mientras esperan a Convex
 * sólo muestran un mensaje. Usar skeletons específicos cuando la
 * estructura de la página lo justifique (ver /dashboard, /people).
 */
export function LoadingFallback({ label = "Cargando…" }: { label?: string }) {
  return (
    <main className="flex flex-1 items-center justify-center p-8">
      <div className="flex items-center gap-3 text-sm text-muted-foreground">
        <span
          className="size-2 animate-pulse rounded-full bg-muted-foreground/60"
          aria-hidden
        />
        <span>{label}</span>
      </div>
    </main>
  );
}
