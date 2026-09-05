import React, { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { mockService } from '@/lib/mock-service';
import { Question, SubjectCategory, MilitaryBranch, QuestionApprovalStatus, DifficultyLevel } from '@/types';
import { Save, Eye, ArrowLeft, Image as ImageIcon, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export const QuestionAuthorPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const editId = searchParams.get('id');

  // Form state
  const [code, setCode] = useState(`Q-${Math.floor(1000 + Math.random() * 9000)}`);
  const [stem, setStem] = useState('');
  const [subject, setSubject] = useState<SubjectCategory>('INTELLIGENCE_VERBAL');
  const [branch, setBranch] = useState<MilitaryBranch | 'TRI_SERVICE'>('TRI_SERVICE');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('MEDIUM');
  const [timeLimitSeconds, setTimeLimitSeconds] = useState<number>(45);
  const [status, setStatus] = useState<QuestionApprovalStatus>('APPROVED');
  const [explanation, setExplanation] = useState('');
  const [imageUrl, setImageUrl] = useState<string | undefined>(undefined);

  // 4 Options State
  const [options, setOptions] = useState([
    { id: 'opt-a', label: 'A' as const, text: '', imageUrl: undefined as string | undefined },
    { id: 'opt-b', label: 'B' as const, text: '', imageUrl: undefined as string | undefined },
    { id: 'opt-c', label: 'C' as const, text: '', imageUrl: undefined as string | undefined },
    { id: 'opt-d', label: 'D' as const, text: '', imageUrl: undefined as string | undefined },
  ]);
  const [correctOptionId, setCorrectOptionId] = useState<string>('opt-a');

  // Load question for edit if editId provided
  useEffect(() => {
    if (editId) {
      async function loadEditQuestion() {
        const q = (await mockService.getQuestions()).find((item) => item.id === editId);
        if (q) {
          setCode(q.code);
          setStem(q.stem);
          setSubject(q.subject);
          setBranch(q.branch);
          setDifficulty(q.difficulty);
          setTimeLimitSeconds(q.timeLimitSeconds);
          setStatus(q.status);
          setExplanation(q.explanation);
          setImageUrl(q.imageUrl);
          if (q.options && q.options.length === 4) {
            setOptions(q.options as typeof options);
          }
          setCorrectOptionId(q.correctOptionId);
        }
      }
      loadEditQuestion();
    }
  }, [editId]);

  const handleOptionTextChange = (id: string, text: string) => {
    setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, text } : opt)));
  };

  const handleQuestionImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setImageUrl(fakeUrl);
      toast.success('Question diagram image uploaded.');
    }
  };

  const handleOptionImageUpload = (id: string, e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const fakeUrl = URL.createObjectURL(file);
      setOptions((prev) => prev.map((opt) => (opt.id === id ? { ...opt, imageUrl: fakeUrl } : opt)));
      toast.success(`Option ${id.slice(-1).toUpperCase()} image uploaded.`);
    }
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!stem.trim()) {
      toast.error('Please enter a question stem.');
      return;
    }
    if (options.some((o) => !o.text.trim() && !o.imageUrl)) {
      toast.error('All 4 options must have text or an image choice.');
      return;
    }

    const questionData: Question = {
      id: editId || `q-${Date.now()}`,
      code,
      subject,
      branch,
      stem,
      options,
      correctOptionId,
      explanation,
      difficulty,
      timeLimitSeconds,
      status,
      imageUrl,
      authorName: 'Instructor Maj. Tariq',
      tags: [subject, branch, difficulty],
      updatedAt: new Date().toISOString(),
    };

    await mockService.addQuestion(questionData);
    toast.success(editId ? 'Question blueprint updated successfully!' : 'New question authored & published!');
    navigate('/admin/questions');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 bg-white p-6 rounded-md border border-[#D4D9DF] shadow-sm">
        <div className="flex items-center space-x-3">
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="p-2 border border-[#D4D9DF] rounded text-[#0E1B2A] hover:bg-[#EDF1F5]"
          >
            <ArrowLeft className="w-4 h-4" />
          </button>
          <div>
            <span className="text-[10px] font-mono font-bold text-[#C6A75E] uppercase tracking-wider">
              AUTHORING & CONTENT STUDIO
            </span>
            <h1 className="text-xl font-bold uppercase tracking-wider text-[#0E1B2A] mt-0.5">
              {editId ? `Edit Question Blueprint: ${code}` : 'Author New Question Item'}
            </h1>
          </div>
        </div>

        <div className="flex items-center space-x-2">
          <button
            type="button"
            onClick={() => navigate('/admin/questions')}
            className="px-4 py-2 border border-[#D4D9DF] text-xs font-semibold rounded text-[#64748B] hover:bg-[#EDF1F5]"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={handleSave}
            className="inline-flex items-center space-x-1.5 px-5 py-2 bg-[#0E1B2A] text-white text-xs font-bold uppercase tracking-wider rounded hover:bg-[#1A2C42] shadow-xs"
          >
            <Save className="w-4 h-4 text-[#C6A75E]" />
            <span>{editId ? 'Update Question' : 'Publish Question'}</span>
          </button>
        </div>
      </div>

      {/* Main 2-Column Authoring Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Authoring Form (7 Cols) */}
        <form onSubmit={handleSave} className="lg:col-span-7 bg-white border border-[#D4D9DF] rounded-md p-6 shadow-sm space-y-6">
          <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2">
            1. Item Metadata & Classification
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Item Ref Code</label>
              <input
                type="text"
                value={code}
                onChange={(e) => setCode(e.target.value)}
                className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none focus:border-[#0E1B2A]"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Subject Category</label>
              <select
                value={subject}
                onChange={(e) => setSubject(e.target.value as SubjectCategory)}
                className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
              >
                <option value="INTELLIGENCE_VERBAL">Intelligence (Verbal)</option>
                <option value="INTELLIGENCE_NON_VERBAL">Intelligence (Non-Verbal)</option>
                <option value="ACADEMIC_PHYSICS">Academic Physics</option>
                <option value="ACADEMIC_MATH">Academic Mathematics</option>
                <option value="ACADEMIC_ENGLISH">Academic English</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Target Force</label>
              <select
                value={branch}
                onChange={(e) => setBranch(e.target.value as MilitaryBranch | 'TRI_SERVICE')}
                className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
              >
                <option value="TRI_SERVICE">Tri-Service (Joint)</option>
                <option value="PAKISTAN_ARMY">Pakistan Army</option>
                <option value="PAKISTAN_AIR_FORCE">Pakistan Air Force</option>
                <option value="PAKISTAN_NAVY">Pakistan Navy</option>
              </select>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-4 text-xs font-mono">
            <div>
              <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Difficulty</label>
              <select
                value={difficulty}
                onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
              >
                <option value="EASY">Easy</option>
                <option value="MEDIUM">Medium</option>
                <option value="HARD">Hard</option>
              </select>
            </div>
            <div>
              <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Time Limit (Seconds)</label>
              <input
                type="number"
                value={timeLimitSeconds}
                onChange={(e) => setTimeLimitSeconds(Number(e.target.value))}
                className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
              />
            </div>
            <div>
              <label className="block font-semibold text-[#0E1B2A] mb-1 uppercase">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as QuestionApprovalStatus)}
                className="w-full bg-[#F6F8FA] border border-[#D4D9DF] rounded px-3 py-2 text-[#0E1B2A] font-bold focus:outline-none"
              >
                <option value="APPROVED">Approved</option>
                <option value="PENDING_REVIEW">Pending Review</option>
                <option value="DRAFT">Draft</option>
              </select>
            </div>
          </div>

          <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 pt-2">
            2. Question Prompt & Optional Diagram
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B2A] mb-1 uppercase">
              Question Statement Stem
            </label>
            <textarea
              rows={4}
              value={stem}
              onChange={(e) => setStem(e.target.value)}
              placeholder="Enter full question stem, problem scenario, or mathematical equation prompt..."
              className="w-full text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded p-3 text-[#1F2937] focus:outline-none focus:border-[#0E1B2A]"
            />
          </div>

          {/* Diagram Upload */}
          <div className="bg-[#F6F8FA] border border-[#D4D9DF] p-3 rounded text-xs space-y-2">
            <span className="font-semibold text-[#0E1B2A] uppercase block">Question Diagram / Image (Optional)</span>
            {imageUrl ? (
              <div className="flex items-center justify-between bg-white p-2 border rounded">
                <img src={imageUrl} alt="Uploaded Diagram" className="h-16 w-auto object-contain rounded" />
                <button
                  type="button"
                  onClick={() => setImageUrl(undefined)}
                  className="text-xs text-red-600 hover:underline flex items-center gap-1 font-mono"
                >
                  <Trash2 className="w-3.5 h-3.5" /> Remove Diagram
                </button>
              </div>
            ) : (
              <div className="flex items-center space-x-3">
                <label className="cursor-pointer inline-flex items-center space-x-1.5 bg-white border border-[#D4D9DF] px-3 py-1.5 rounded text-xs font-bold text-[#0E1B2A] hover:bg-[#EDF1F5]">
                  <ImageIcon className="w-4 h-4 text-[#C6A75E]" />
                  <span>Upload Question Image</span>
                  <input type="file" accept="image/*" onChange={handleQuestionImageUpload} className="hidden" />
                </label>
                <span className="text-[11px] text-[#64748B]">Supports SVG, PNG, JPG (Non-Verbal diagrams)</span>
              </div>
            )}
          </div>

          <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 pt-2">
            3. Four Alternatives (Select Radio Correct Key)
          </h2>

          <div className="space-y-3">
            {options.map((opt) => (
              <div
                key={opt.id}
                className={`p-3 rounded border transition-colors space-y-2 ${
                  correctOptionId === opt.id
                    ? 'bg-[#EDF6F0] border-[#88BE9B]'
                    : 'bg-[#F8FAFC] border-[#D4D9DF]'
                }`}
              >
                <div className="flex items-center space-x-3">
                  <input
                    type="radio"
                    name="correct_option"
                    checked={correctOptionId === opt.id}
                    onChange={() => setCorrectOptionId(opt.id)}
                    className="w-4 h-4 text-[#234E35] focus:ring-[#234E35]"
                  />
                  <span className="w-6 font-bold text-xs text-[#0E1B2A] font-mono">{opt.label}.</span>
                  <input
                    type="text"
                    value={opt.text}
                    onChange={(e) => handleOptionTextChange(opt.id, e.target.value)}
                    placeholder={`Option ${opt.label} choice text...`}
                    className="flex-1 text-xs bg-white border border-[#D4D9DF] rounded px-3 py-2 text-[#1F2937] focus:outline-none focus:border-[#0E1B2A]"
                  />
                  {correctOptionId === opt.id && (
                    <span className="text-[10px] font-mono font-bold bg-[#234E35] text-white px-2 py-0.5 rounded">
                      CORRECT KEY
                    </span>
                  )}
                </div>

                {/* Option Image Upload */}
                <div className="pl-9 flex items-center space-x-3 text-[11px]">
                  {opt.imageUrl ? (
                    <div className="flex items-center space-x-2">
                      <img src={opt.imageUrl} alt={`Opt ${opt.label}`} className="h-10 w-auto rounded border" />
                      <button
                        type="button"
                        onClick={() =>
                          setOptions((prev) => prev.map((o) => (o.id === opt.id ? { ...o, imageUrl: undefined } : o)))
                        }
                        className="text-red-600 hover:underline"
                      >
                        Remove
                      </button>
                    </div>
                  ) : (
                    <label className="cursor-pointer text-[#64748B] hover:text-[#0E1B2A] font-mono underline">
                      + Add Option Image (Optional)
                      <input
                        type="file"
                        accept="image/*"
                        onChange={(e) => handleOptionImageUpload(opt.id, e)}
                        className="hidden"
                      />
                    </label>
                  )}
                </div>
              </div>
            ))}
          </div>

          <h2 className="text-sm font-bold text-[#0E1B2A] uppercase tracking-wider border-b border-[#E2E6EB] pb-2 pt-2">
            4. Official Derivation & Rationale
          </h2>

          <div>
            <label className="block text-xs font-semibold text-[#0E1B2A] mb-1 uppercase">
              Step-by-Step Rationale (For Answer Key Review)
            </label>
            <textarea
              rows={3}
              value={explanation}
              onChange={(e) => setExplanation(e.target.value)}
              placeholder="Document step-by-step formula derivation, logic rule, or coaching rationale..."
              className="w-full text-xs bg-[#F6F8FA] border border-[#D4D9DF] rounded p-3 text-[#1F2937] focus:outline-none focus:border-[#0E1B2A]"
            />
          </div>
        </form>

        {/* Right Column: Live Candidate Exam Preview (5 Cols) */}
        <div className="lg:col-span-5 space-y-4 sticky top-6">
          <div className="bg-[#0E1B2A] text-white p-4 rounded-t-md flex items-center justify-between border-b border-[#1C2E42]">
            <div className="flex items-center space-x-2">
              <Eye className="w-4 h-4 text-[#C6A75E]" />
              <span className="text-xs font-bold uppercase tracking-wider font-mono">Live Candidate Exam Preview</span>
            </div>
            <span className="text-[10px] font-mono text-[#A0AEC0]">SIMULATED CBT RUNNER</span>
          </div>

          {/* Exam Runner Simulated Card */}
          <div className="bg-white border-2 border-[#0E1B2A] rounded-b-md p-6 shadow-md space-y-5">
            <div className="flex items-center justify-between border-b border-[#E2E6EB] pb-3 text-xs font-mono">
              <span className="font-bold text-[#0E1B2A] bg-[#EDF1F5] px-2 py-0.5 rounded border">
                QUESTION 01 OF 45
              </span>
              <span className="text-[#64748B]">TIME: {timeLimitSeconds}s</span>
            </div>

            {/* Stem */}
            <div>
              <h3 className="text-sm font-semibold text-[#0E1B2A] leading-relaxed">
                {stem || 'Question statement stem preview will render here in real time as you type...'}
              </h3>
              {imageUrl && (
                <div className="mt-3 p-2 border rounded bg-[#F6F8FA]">
                  <img src={imageUrl} alt="Preview" className="max-h-40 w-auto object-contain rounded mx-auto" />
                </div>
              )}
            </div>

            {/* Options Preview */}
            <div className="space-y-2">
              {options.map((opt) => {
                const isCorrect = opt.id === correctOptionId;

                return (
                  <div
                    key={opt.id}
                    className={`p-3 rounded border text-xs flex items-center space-x-3 ${
                      isCorrect
                        ? 'bg-[#EDF6F0] border-[#88BE9B] text-[#234E35] font-semibold'
                        : 'bg-[#F8FAFC] border-[#D4D9DF] text-[#1F2937]'
                    }`}
                  >
                    <span
                      className={`w-6 h-6 rounded flex items-center justify-center font-bold font-mono text-[11px] border ${
                        isCorrect ? 'bg-[#234E35] text-white border-[#234E35]' : 'bg-white text-[#0E1B2A]'
                      }`}
                    >
                      {opt.label}
                    </span>
                    <span className="flex-1">{opt.text || `Option ${opt.label} text...`}</span>
                    {isCorrect && (
                      <span className="text-[10px] font-mono bg-[#234E35] text-white px-1.5 py-0.5 rounded">
                        KEY
                      </span>
                    )}
                  </div>
                );
              })}
            </div>

            {/* Explanation Preview */}
            {explanation && (
              <div className="bg-[#FDF7EC] border border-[#DEC088] p-3 rounded text-[11px] text-[#7A5312] space-y-1">
                <span className="font-mono font-bold block uppercase">Rationale Preview:</span>
                <p>{explanation}</p>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default QuestionAuthorPage;
