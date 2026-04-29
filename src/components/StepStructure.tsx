import { useState, useEffect } from 'react';
import { ProjectState, ScriptAct } from '../types';
import { generateScriptStructure } from '../services/ai';
import { ArrowRight, ArrowLeft, Loader2, ListTree } from 'lucide-react';

interface StepStructureProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

export default function StepStructure({ project, updateProject, onComplete, onPrev }: StepStructureProps) {
  const [loading, setLoading] = useState(false);
  const [acts, setActs] = useState<ScriptAct[]>(project.acts || []);

  useEffect(() => {
    if (acts.length === 0) {
      loadStructure();
    }
  }, []);

  async function loadStructure() {
    setLoading(true);
    try {
      const selectedBranch = project.branches.find(b => b.id === project.selectedBranchId);
      if (selectedBranch) {
        const result = await generateScriptStructure(project.genre, project.initialIdea, selectedBranch);
        setActs(result);
        updateProject({ acts: result });
      }
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">3-Act Structure</h2>
        <h3 className="text-xl font-medium text-white/50">Cấu trúc 3 hồi</h3>
        <p className="text-white/30 text-sm max-w-md mx-auto">Analyzing the plot and breaking it down into major dramatic beats.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-orange-500" size={48} />
          <p className="text-white/40 font-mono text-sm animate-pulse">STRUCTURING DRAMATIC BEATS...</p>
        </div>
      ) : (
        <div className="space-y-12">
          {acts.map((act, actIdx) => (
            <div key={actIdx} className="space-y-6">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 bg-white/5 rounded-xl flex items-center justify-center text-orange-500 font-bold border border-white/10">
                  {actIdx + 1}
                </div>
                <div>
                  <h3 className="text-xl font-bold">{act.title}</h3>
                  <p className="text-white/40 text-sm">{act.description}</p>
                </div>
              </div>

              <div className="grid md:grid-cols-2 gap-4 pl-16">
                {act.plotPoints.map((pp, ppIdx) => (
                  <div key={pp.id} className="p-6 bg-white/5 rounded-2xl border border-white/5 hover:border-orange-500/30 transition-all group">
                    <div className="text-[10px] font-mono text-white/30 mb-2 uppercase tracking-tighter">Plot Point {actIdx * 2 + ppIdx + 1}</div>
                    <h4 className="font-semibold mb-2 group-hover:text-orange-500 transition-colors">{pp.title}</h4>
                    <p className="text-xs text-white/50 leading-relaxed">{pp.description}</p>
                  </div>
                ))}
              </div>
            </div>
          ))}

          <div className="flex gap-4 max-w-lg mx-auto">
            <button
              onClick={onPrev}
              className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
            >
              <ArrowLeft size={20} /> Quay lại
            </button>
            <button
              onClick={onComplete}
              className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group"
            >
              Phê duyệt kế hoạch <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
