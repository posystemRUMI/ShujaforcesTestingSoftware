export function QuestionStatement({ stem, sourceLabel }: { stem: string; sourceLabel?: string | null }) {
  const lc159 = sourceLabel?.startsWith('LC-159 · ');
  return <>{stem}{sourceLabel && <> {lc159 ? <><span className="inline-block rounded border border-[#C6A15B]/40 bg-[#C6A15B]/10 px-1.5 py-0.5 align-baseline text-[11px] font-semibold text-[#785B28]">LC-159</span> <span className="text-[11px] font-normal text-[#65758A]">{sourceLabel.slice('LC-159 · '.length)}</span></> : <span className="text-[11px] font-normal text-[#64748B]">{sourceLabel}</span>}</>}</>;
}
