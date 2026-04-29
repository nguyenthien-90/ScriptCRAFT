import { useState, useEffect } from 'react';
import { ProjectState, StoryBranch } from '../types';
import { generateStoryBranches } from '../services/ai';
import { ArrowRight, ArrowLeft, Loader2, Compass } from 'lucide-react';
import { motion } from 'motion/react';

interface StepBranchesProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

export default function StepBranches({ project, updateProject, onComplete, onPrev }: StepBranchesProps) {
  const [loading, setLoading] = useState(false);
  const [branches, setBranches] = useState<StoryBranch[]>(project.branches || []);

  useEffect(() => {
    if (branches.length === 0) {
      loadBranches();
    }
  }, []);

  async function loadBranches() {
    setLoading(true);
    try {
      const bs = await generateStoryBranches(project.genre, project.initialIdea, project.answers);
      setBranches(bs);
      updateProject({ branches: bs });
    } catch (error) {
      console.error(error);
    } finally {
      setLoading(false);
    }
  }

  const [customTitle, setCustomTitle] = useState('');
  const [customDesc, setCustomDesc] = useState('');

  const handleSelect = (branchId: string) => {
    updateProject({ selectedBranchId: branchId });
  };

  const handleAddCustom = () => {
    if (!customTitle || !customDesc) return;
    const newBranch: StoryBranch = {
      id: 'custom-' + Date.now(),
      title: customTitle,
      description: customDesc
    };
    const newBranches = [...branches, newBranch];
    setBranches(newBranches);
    updateProject({ 
      branches: newBranches,
      selectedBranchId: newBranch.id 
    });
    setCustomTitle('');
    setCustomDesc('');
  };

  return (
    <div className="max-w-6xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">Story Directions</h2>
        <h3 className="text-xl font-medium text-white/50">Lựa chọn ngã rẽ</h3>
        <p className="text-white/30 text-sm max-w-md mx-auto">Choose one of the potential directions or write your own to evolve your story.</p>
      </div>

      {loading ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <Loader2 className="animate-spin text-orange-500" size={48} />
          <p className="text-white/40 font-mono text-sm animate-pulse">EXPANDING MULTIVERSE...</p>
        </div>
      ) : (
        <div className="space-y-12">
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
            {branches.map((b) => (
              <button
                key={b.id}
                onClick={() => handleSelect(b.id)}
                className={`p-8 rounded-[2.5rem] border transition-all text-left group relative flex flex-col h-full ${
                  project.selectedBranchId === b.id
                    ? 'bg-white text-black border-transparent shadow-[0_20px_50px_rgba(255,255,255,0.1)] scale-[1.02]'
                    : 'bg-white/5 hover:bg-white/10 border-white/10 text-white/70'
                }`}
              >
                <div className={`mb-6 w-12 h-12 rounded-2xl flex items-center justify-center transition-colors ${
                  project.selectedBranchId === b.id ? 'bg-black text-white' : 'bg-white/5 text-white/30'
                }`}>
                  <Compass size={24} />
                </div>
                <h3 className="text-xl font-bold mb-4">{b.title}</h3>
                <p className={`text-sm leading-relaxed mb-8 flex-grow ${
                  project.selectedBranchId === b.id ? 'text-black/70' : 'text-white/40'
                }`}>
                  {b.description}
                </p>
                
                <div className={`mt-auto pt-6 border-t font-mono text-[10px] tracking-widest uppercase ${
                  project.selectedBranchId === b.id ? 'border-black/10' : 'border-white/5'
                }`}>
                  {project.selectedBranchId === b.id ? 'SELECTED PATH' : 'EXPLORE PATH'}
                </div>
              </button>
            ))}
          </div>

          <div className="max-w-2xl mx-auto bg-white/5 p-8 rounded-[2.5rem] border border-white/10 space-y-6">
            <div className="flex items-center gap-3 mb-2">
              <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500">
                <Compass size={20} />
              </div>
              <h4 className="font-bold uppercase tracking-widest text-sm">Create Your Own Path / Tự tạo hướng đi</h4>
            </div>

            <div className="space-y-4">
              <input
                type="text"
                placeholder="Tên hướng đi (e.g. Cuộc trốn chạy cuối cùng)"
                value={customTitle}
                onChange={(e) => setCustomTitle(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50"
              />
              <textarea
                placeholder="Mô tả chi tiết hướng đi của bạn..."
                value={customDesc}
                onChange={(e) => setCustomDesc(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-xl p-4 text-white text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/50 min-h-[100px] resize-none"
              />
              <button
                onClick={handleAddCustom}
                disabled={!customTitle || !customDesc}
                className="w-full py-3 bg-white/10 hover:bg-white text-orange-500 hover:text-black font-bold rounded-xl text-xs transition-all disabled:opacity-30 uppercase tracking-widest"
              >
                Use Custom Direction / Sử dụng hướng đi này
              </button>
            </div>
          </div>
        </div>
      )}

      {!loading && (
        <div className="flex gap-4 max-w-lg mx-auto">
          <button
            onClick={onPrev}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <button
            onClick={onComplete}
            disabled={!project.selectedBranchId}
            className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group"
          >
            Xác nhận cấu trúc <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      )}
    </div>
  );
}
