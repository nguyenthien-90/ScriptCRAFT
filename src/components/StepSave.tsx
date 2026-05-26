import { useState } from 'react';
import { ProjectState, ScriptSegment } from '../types';
import { Save, ArrowRight, ArrowLeft, Loader2, Sparkles } from 'lucide-react';
import { saveProjectToStorage } from '../lib/storage';
import { generateVietnameseSegmentDraft } from '../services/ai';

interface StepSaveProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
  onPrev: () => void;
}

export default function StepSave({ project, updateProject, onComplete, onPrev }: StepSaveProps) {
  const [isGenerating, setIsGenerating] = useState(false);
  const [statusText, setStatusText] = useState('');

  const handleStartWriting = async () => {
    setIsGenerating(true);
    setStatusText('Đang khởi tạo cấu trúc phân đoạn kịch bản...');
    
    try {
      const selectedBranch = project.branches.find(b => b.id === project.selectedBranchId);
      const fullContext = `Idea: ${project.initialIdea}. Story Branch: ${selectedBranch?.title} - ${selectedBranch?.description}. Extra context: ${project.extraContext}`;
      
      const plotPointsList = project.acts.flatMap(act => act.plotPoints);
      const targetSec = Math.ceil((project.duration * 60) / 6);
      
      setStatusText(`Đang tự động sáng tác kịch bản cho 6 phân đoạn (~${targetSec} giây mỗi phân đoạn)...`);
      
      // Build segments in parallel
      const segmentPromises = plotPointsList.map(async (pp, index) => {
        const segContext = `${fullContext}. Đây là phân đoạn thứ ${index + 1} có tiêu đề "${pp.title}" và mô tả cốt truyện diễn biến: "${pp.description}". Hãy sáng tác kịch bản hội thoại đầy đủ tiếng Việt cho phân đoạn này diễn tả đúng cốt truyện trên.`;
        const contentVi = await generateVietnameseSegmentDraft(pp.title, segContext, targetSec, project.characters, project.genre);
        return {
          id: crypto.randomUUID(),
          title: pp.title,
          contentVi: contentVi,
          contentEn: '',
          contentZh: '',
          plotPointId: pp.id
        };
      });
      
      const segments = await Promise.all(segmentPromises);
      
      const finalProject = { ...project, segments };
      saveProjectToStorage(finalProject);
      updateProject({ segments });
      onComplete();
    } catch (err) {
      console.error('Error generating auto screenplay draft:', err);
      alert('Có lỗi xảy ra khi tự động sáng tác kịch bản. Vui lòng thử lại.');
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto space-y-8 relative">
      {isGenerating && (
        <div className="absolute inset-0 bg-[#0A0A0B]/90 backdrop-blur-md rounded-3xl flex flex-col items-center justify-center p-8 z-50 text-center space-y-4">
          <div className="relative">
            <Loader2 className="animate-spin text-orange-500" size={56} />
            <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-400" size={24} />
          </div>
          <h3 className="text-xl font-bold font-mono tracking-wider text-white">SÁNG TÁC KỊCH BẢN TỰ ĐỘNG</h3>
          <p className="text-sm text-white/70 max-w-sm font-medium animate-pulse">
            {statusText}
          </p>
          <span className="text-[11px] text-white/30 italic">
            Quá trình này có thể tốn khoảng 5 đến 10 giây. Hãy thư giãn trong giây lát!
          </span>
        </div>
      )}

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
            disabled={isGenerating}
            className="w-full bg-white/5 border border-white/10 rounded-2xl p-4 text-xl font-bold text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all disabled:opacity-50"
          />
        </div>

        <div className="grid grid-cols-2 gap-4 text-sm">
          <div className="p-4 bg-white/5 rounded-2xl border border-white/5">
            <div className="text-white/30 text-[10px] uppercase font-mono mb-1">Thể loại</div>
            <div className="font-semibold">
              {project.genre === 'Drama' && 'Phim chính kịch (tâm lý)'}
              {project.genre === 'Comedy' && 'Phim hài'}
              {project.genre === 'Romance' && 'Phim lãng mạn (tình cảm)'}
              {project.genre === 'Fantasy' && 'Phim giả tưởng (kỳ ảo)'}
              {project.genre === 'Documentary' && 'Phim tài liệu'}
              {project.genre === 'Religion' && 'Phim tôn giáo'}
              {project.genre === 'History' && 'Phim lịch sử'}
              {project.genre === 'Action' && 'Phim hành động'}
              {project.genre === 'Animation' && 'Phim hoạt hình'}
            </div>
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
            disabled={isGenerating}
            className="flex-1 py-4 bg-white/5 hover:bg-white/10 text-white font-bold rounded-2xl flex items-center justify-center gap-2 transition-all disabled:opacity-50"
          >
            <ArrowLeft size={20} /> Quay lại
          </button>
          <button
            onClick={handleStartWriting}
            disabled={!project.title || isGenerating}
            className="flex-[2] py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group"
          >
            Bắt đầu viết <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
          </button>
        </div>
      </div>
    </div>
  );
}
