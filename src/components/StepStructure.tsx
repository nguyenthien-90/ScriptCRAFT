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
  const [editingActIdx, setEditingActIdx] = useState<number | null>(null);
  const [editTitle, setEditTitle] = useState('');
  const [editDesc, setEditDesc] = useState('');

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

  const handleStartEdit = (idx: number, act: ScriptAct) => {
    setEditingActIdx(idx);
    setEditTitle(act.title);
    setEditDesc(act.description);
  };

  const handleSaveAct = (idx: number) => {
    if (!editTitle.trim()) {
      alert('Vui lòng nhập tiêu đề cho hồi kịch bản.');
      return;
    }
    if (!editDesc.trim()) {
      alert('Vui lòng nhập mô tả chi tiết diễn biến hồi kịch bản.');
      return;
    }

    const updated = acts.map((act, i) => {
      if (i === idx) {
        return {
          ...act,
          title: editTitle.trim(),
          description: editDesc.trim()
        };
      }
      return act;
    });

    setActs(updated);
    updateProject({ acts: updated });
    setEditingActIdx(null);
  };

  return (
    <div className="max-w-4xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">3-Act Structure</h2>
        <h3 className="text-xl font-medium text-white/50">Cấu trúc 3 hồi</h3>
        <p className="text-white/30 text-sm max-w-md mx-auto">Nhấp chuột trực tiếp vào bất kỳ hồi nào bên dưới để chỉnh sửa hoặc hoàn thiện nội dung.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-orange-500" size={48} />
          <p className="text-white/40 font-mono text-sm animate-pulse">STRUCTURING DRAMATIC BEATS...</p>
        </div>
      ) : (
        <div className="space-y-6">
          {acts.map((act, actIdx) => {
            const isEditing = editingActIdx === actIdx;

            if (isEditing) {
              return (
                <div key={actIdx} className="p-6 bg-orange-500/5 border border-orange-500/30 rounded-3xl space-y-4 transition-all">
                  <div className="flex items-center gap-3">
                    <div className="w-12 h-12 bg-orange-500/20 rounded-2xl flex items-center justify-center text-orange-400 font-bold border border-orange-500/20 text-lg shrink-0">
                      {actIdx + 1}
                    </div>
                    <div className="flex-1">
                      <span className="text-[10px] font-bold text-orange-400 font-mono uppercase">ĐANG SỬA ĐỔI DIỄN BIẾN HỒI {actIdx + 1}</span>
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="space-y-1">
                      <label className="text-xs text-white/50 font-medium font-mono uppercase">Tiêu đề Hồi kịch bản</label>
                      <input
                        type="text"
                        value={editTitle}
                        onChange={(e) => setEditTitle(e.target.value)}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white font-bold tracking-wide focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                      />
                    </div>

                    <div className="space-y-1">
                      <label className="text-xs text-white/50 font-medium font-mono uppercase">Mô tả cốt truyện & chi tiết diễn biến chính</label>
                      <textarea
                        value={editDesc}
                        onChange={(e) => setEditDesc(e.target.value)}
                        rows={6}
                        className="w-full bg-white/5 border border-white/10 rounded-xl p-3 text-sm text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none leading-relaxed"
                      />
                    </div>
                  </div>

                  <div className="flex justify-end gap-3 text-xs pt-2">
                    <button
                      type="button"
                      onClick={() => setEditingActIdx(null)}
                      className="px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl text-white font-medium transition-all"
                    >
                      Hủy bò
                    </button>
                    <button
                      type="button"
                      onClick={() => handleSaveAct(actIdx)}
                      className="px-4 py-2 bg-orange-500 hover:bg-orange-600 rounded-xl text-black font-extrabold shadow-lg shadow-orange-500/10 transition-all"
                    >
                      Lưu cập nhật
                    </button>
                  </div>
                </div>
              );
            }

            return (
              <div 
                key={actIdx} 
                onClick={() => handleStartEdit(actIdx, act)}
                className="p-6 bg-white/[0.02] border border-white/5 rounded-3xl hover:border-orange-500/40 hover:bg-white/[0.04] cursor-pointer transition-all flex gap-4 group"
                title="Nhấp vào để chỉnh sửa"
              >
                <div className="w-12 h-12 bg-orange-500/15 group-hover:bg-orange-500 group-hover:text-black rounded-2xl flex items-center justify-center text-orange-400 font-bold border border-orange-500/10 text-lg shrink-0 transition-all">
                  {actIdx + 1}
                </div>
                <div className="space-y-3 min-w-0 flex-1">
                  <div className="flex items-center justify-between">
                    <h3 className="text-xl font-bold text-white uppercase tracking-wide font-mono group-hover:text-orange-400 transition-colors">{act.title}</h3>
                    <span className="text-[10px] text-white/20 uppercase font-mono group-hover:text-orange-400/50 transition-colors">Nhấp để sửa ✎</span>
                  </div>
                  <p className="text-white/70 text-sm leading-relaxed whitespace-pre-line group-hover:text-white/95 transition-colors">{act.description}</p>
                </div>
              </div>
            );
          })}

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
