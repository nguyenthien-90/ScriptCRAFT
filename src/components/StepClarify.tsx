import { useState, useEffect } from 'react';
import { ProjectState, ClarificationQuestion } from '../types';
import { generateClarificationQuestions } from '../services/ai';
import { ArrowRight, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';

interface StepClarifyProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

export default function StepClarify({ project, updateProject, onComplete, onPrev }: StepClarifyProps) {
  const [loading, setLoading] = useState(false);
  const [questions, setQuestions] = useState<ClarificationQuestion[]>(project.questions || []);
  const [answers, setAnswers] = useState<Record<string, string>>(project.answers || {});

  useEffect(() => {
    if (questions.length === 0) {
      loadQuestions();
    }
  }, []);

  async function loadQuestions() {
    setLoading(true);
    try {
      const qs = await generateClarificationQuestions(project.genre, project.initialIdea, project.duration, project.extraContext);
      setQuestions(qs);
      updateProject({ questions: qs });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const handleAnswer = (questionId: string, option: string) => {
    const newAnswers = { ...answers, [questionId]: option };
    setAnswers(newAnswers);
    updateProject({ answers: newAnswers });
  };

  const isComplete = questions.length > 0 && Object.keys(answers).length >= questions.length;

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">Clarification</h2>
        <h3 className="text-xl font-medium text-white/50">Làm rõ chi tiết</h3>
        <p className="text-white/30 text-sm max-w-md mx-auto">AI is analyzing your idea to identify key elements that need more depth and focus.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-orange-500" size={48} />
          <p className="text-white/40 font-mono text-sm animate-pulse">ANALYZING PLOT HOLES...</p>
        </div>
      ) : (
        <div className="space-y-8">
          {questions.map((q, idx) => (
            <div key={q.id} className="bg-white/5 rounded-3xl p-8 border border-white/10 space-y-6 relative overflow-hidden group">
              <div className="absolute top-0 right-0 p-8 opacity-5 group-hover:opacity-10 transition-opacity">
                <span className="text-9xl font-black italic">{idx + 1}</span>
              </div>
              
              <h3 className="text-xl font-semibold relative z-10">{q.question}</h3>
              
              <div className="grid gap-3 relative z-10 text-left">
                {q.options.map((opt) => (
                  <button
                    key={opt}
                    onClick={() => handleAnswer(q.id, opt)}
                    className={`p-4 rounded-2xl text-sm transition-all flex items-center justify-between group/btn ${
                      answers[q.id] === opt
                        ? 'bg-orange-500 text-black border-transparent'
                        : 'bg-white/5 hover:bg-white/10 border border-white/10 text-white/70'
                    }`}
                  >
                    <span>{opt}</span>
                    {answers[q.id] === opt && <CheckCircle2 size={18} />}
                  </button>
                ))}
              </div>

              <div className="relative z-10 space-y-2 pt-4 border-t border-white/5">
                <label className="text-[10px] font-mono text-white/30 uppercase tracking-widest">Or provide your own idea / Hoặc tự nhập ý tưởng</label>
                <textarea
                  value={answers[q.id] || ''}
                  onChange={(e) => handleAnswer(q.id, e.target.value)}
                  placeholder="Type your own variation or additional details here..."
                  className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-sm text-white placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all min-h-[100px] resize-none"
                />
              </div>
            </div>
          ))}

          <div className="flex gap-4">
            <button
              onClick={onPrev}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft size={20} /> Quay lại
            </button>
            <button
              onClick={onComplete}
              disabled={!isComplete}
              className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group"
            >
              Tiếp tục <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
