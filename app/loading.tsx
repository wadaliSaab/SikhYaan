export default function Loading() {
  return (
    <div role="status" className="flex min-h-[60vh] items-center justify-center gap-3 text-muted-foreground">
      <span className="h-5 w-5 animate-spin rounded-full border-2 border-premium/30 border-t-primary" />
      <span className="text-sm font-medium">Loading…</span>
    </div>
  );
}