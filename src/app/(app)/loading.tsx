export default function Loading() {
  return (
    <div className="flex flex-1 items-center justify-center p-12" role="status" aria-label="Loading">
      <div className="size-8 animate-spin rounded-full border-2 border-line border-t-ink" />
    </div>
  );
}
