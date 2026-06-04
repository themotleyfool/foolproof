const skeletonCls = 'rounded-[4px] bg-[linear-gradient(90deg,#EBEBEF_25%,#F5F5F7_50%,#EBEBEF_75%)] [background-size:200%_100%] animate-shimmer';

/**
 * Renders an animated placeholder card shown while knowledge base entries are loading.
 */
export function SkeletonCard() {
  return (
    <div className="bg-white border border-divider rounded-[8px] shadow-card px-4 py-[14px] flex flex-col gap-[10px]">
      <div className="flex justify-between items-center gap-3">
        <div className={`h-[14px] w-[55%] ${skeletonCls}`} />
        <div className={`h-[10px] w-[12%] ${skeletonCls}`} />
      </div>
      <div className={`h-[11px] w-full ${skeletonCls}`} />
      <div className={`h-[11px] w-[72%] ${skeletonCls}`} />
      <div className="flex gap-[5px] mt-[2px]">
        <div className={`h-[18px] w-[46px] rounded-full ${skeletonCls}`} />
        <div className={`h-[18px] w-[58px] rounded-full ${skeletonCls}`} />
        <div className={`h-[18px] w-[40px] rounded-full ${skeletonCls}`} />
      </div>
    </div>
  );
}
