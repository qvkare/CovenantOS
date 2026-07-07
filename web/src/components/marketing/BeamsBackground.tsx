export function BeamsBackground() {
  return (
    <div className="pointer-events-none fixed inset-0 z-0 overflow-hidden">
      <div className="absolute inset-0 grid-pattern opacity-80" />
      <div className="absolute -left-1/4 top-0 h-[600px] w-[600px] rounded-full bg-white/[0.03] blur-[120px]" />
      <div className="absolute -right-1/4 bottom-0 h-[500px] w-[500px] rounded-full bg-white/[0.04] blur-[100px]" />
      <div className="absolute inset-0 bg-gradient-to-b from-transparent via-black/20 to-black" />
    </div>
  );
}
