interface AnswerExplanationProps {
  correctAnswers: Array<{ label: string; text: string }>;
  explanation?: string | null;
}

/** Render only within an authorized staff or completed-exam review. */
export function AnswerExplanation({ correctAnswers, explanation }: AnswerExplanationProps) {
  return (
    <div className="bg-[#F6F8FA] rounded-lg border border-[#E2E8F0] p-3.5 text-sm space-y-1">
      <p className="text-[#234E35]">
        <strong>Correct answer: </strong>
        {correctAnswers.map(answer => `${answer.label}. ${answer.text}`).join('; ')}
      </p>
      {explanation?.trim() && <p className="text-[#475569] whitespace-normal"><strong>Explanation: </strong>{explanation}</p>}
    </div>
  );
}
