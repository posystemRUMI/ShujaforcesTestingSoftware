export function QuestionStatement({ stem, sourceLabel }: { stem: string; sourceLabel?: string | null }) {
  return <>{stem}{sourceLabel && <> <span className="text-[11px] font-normal text-[#64748B]">{sourceLabel}</span></>}</>;
}
