import { ProjectState, ScriptSegment } from '../types';
import { Save, ArrowRight, ArrowLeft } from 'lucide-react';
import { saveProjectToStorage } from '../lib/storage';

interface StepSaveProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

export default function StepSave({ project, updateProject, onComplete, onPrev }: StepSaveProps) {
  const handleStartWriting = () => {
    // Initialize segments based on plot points
    const segments: ScriptSegment[] = project.acts.flatMap(act => 
      act.plotPoints.map(pp => ({
        id: crypto.randomUUID(),
        title: pp.title,
        contentVi: '',
        contentEn: '',
        contentZh: '',
        plotPointId: pp.id
      }))
    );
    const finalProject = { ...project, segments };
    saveProjectToStorage(finalProject);
    updateProject({ segments });
    onComplete();
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8">
      <div className="text-center space-y-2">
        <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">Finalize Setup</h2>
        <h3 className="text-xl font-medium text-white/50">Hoàn tất thiết lập</h3>
        <p className="text-white/30 text-sm max-w-md mx-auto">Name your project and get ready to write your first lines of screenplay.</p>
      </div>

      <div className="bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm space-y-8">
        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60">Tên phim / Dự án</label>
          <input
            type="text"
            value={project.title}
            onChange={(e) => updateProject({ title: e.target.value })}
            placeholder="Tên phim của bạn..."
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-white/30 text-[10px] uppercase font-mono mb-1">Thể loại</div>
            <div className="font-semibold">{project.genre}</div>
          </div>
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-white/30 text-[10px] uppercase font-mono mb-1">Thời lượng</div>
            <div className="font-semibold">{project.duration} phút</div>
          </div>
        </div>

        <div className="p-6 bg-orange-500/10 rounded-2xl border border-orange-500/20 text-orange-500 text-sm leading-relaxed">
          <strong>Lưu ý:</strong> Sau bước này, AI sẽ khởi tạo không gian viết với các phân đoạn đã được phân chia theo cấu trúc 3 hồi bạn vừa duyệt.
        </div>

        <div className="flex gap-4">
          <button
            onClick={onPrev}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <button
            onClick={handleStartWriting}
            disabled={!project.title}
            className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group"
          >
            Bắt đầu viết <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
