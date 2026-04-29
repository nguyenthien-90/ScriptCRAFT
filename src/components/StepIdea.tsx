import React, { useState } from 'react';
import { ProjectState, Genre } from '../types';
import { ArrowRight, Sparkles, FileUp, Loader2, Info, FolderOpen } from 'lucide-react';
import mammoth from 'mammoth';

interface StepIdeaProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
  onShowArchive: () => void;
}

const GENRES: Genre[] = ['Action', 'Drama', 'Comedy', 'Sci-Fi', 'Horror', 'Thriller', 'Romance', 'Fantasy', 'Documentary'];

export default function StepIdea({ project, updateProject, onComplete, onShowArchive }: StepIdeaProps) {
  const [isReading, setIsReading] = useState(false);

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    if (!file.name.endsWith('.docx')) {
      alert('Vui lòng tải lên file .docx');
      return;
    }

    setIsReading(true);
    try {
      const arrayBuffer = await file.arrayBuffer();
      const result = await mammoth.extractRawText({ arrayBuffer });
      const extractedText = result.value;
      updateProject({ extraContext: project.extraContext + (project.extraContext ? '\n\n' : '') + extractedText });
    } catch (error) {
      console.error('Error reading docx:', error);
      alert('Không thể đọc file .docx này.');
    } finally {
      setIsReading(false);
    }
  };

  return (
    <div className="max-w-3xl mx-auto space-y-8">
      <div className="flex flex-col md:flex-row items-center justify-between gap-6 border-b border-white/5 pb-8">
        <div className="space-y-2 text-center md:text-left">
          <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">Core Concept</h2>
          <h3 className="text-xl font-medium text-white/50">Hạt giống ý tưởng</h3>
        </div>
        
        <button 
          onClick={onShowArchive}
          className="flex items-center gap-3 px-6 py-3 bg-white/5 hover:bg-white/10 border border-white/10 rounded-2xl transition-all group"
        >
          <div className="p-2 bg-orange-500/10 rounded-lg text-orange-500 group-hover:scale-110 transition-transform">
            <FolderOpen size={18} />
          </div>
          <div className="text-left">
            <div className="text-[10px] font-bold uppercase tracking-widest text-white/40 leading-none mb-1">My Archive</div>
            <div className="text-[11px] font-mono whitespace-nowrap leading-none">Thư viện của tôi</div>
          </div>
        </button>
      </div>

      <div className="text-center">
        <p className="text-white/30 text-sm max-w-md mx-auto">Start your creative journey by defining the main genre and core premise of your film.</p>
      </div>

      <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
        <div className="grid md:grid-cols-2 gap-8">
          <div className="space-y-6">
            <div className="space-y-3">
              <label className="text-sm font-medium text-white/60">Thể loại phim</label>
              <div className="grid grid-cols-3 gap-2">
                {GENRES.map((g) => (
                  <button
                    key={g}
                    onClick={() => updateProject({ genre: g })}
                    className={`py-2 px-3 rounded-xl text-xs font-medium transition-all ${
                      project.genre === g 
                        ? 'bg-white text-black' 
                        : 'bg-white/5 hover:bg-white/10 text-white/70 border border-white/5'
                    }`}
                  >
                    {g}
                  </button>
                ))}
              </div>
            </div>

            <div className="space-y-3">
              <label className="text-sm font-medium text-white/60">Nội dung tóm tắt chính</label>
              <textarea
                value={project.initialIdea}
                onChange={(e) => updateProject({ initialIdea: e.target.value })}
                placeholder="Kể về một thanh niên vô tình nhặt được chiếc đồng hồ có khả năng quay ngược thời gian 10 giây..."
                className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none text-sm"
              />
            </div>
          </div>

          <div className="space-y-6 border-l border-white/5 pl-8 hidden md:block">
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-white/60 flex items-center gap-2">
                  Tài liệu đính kèm <Info size={14} className="text-white/20" />
                </label>
                <div className="relative">
                  <input
                    type="file"
                    id="docx-upload"
                    className="hidden"
                    accept=".docx"
                    onChange={handleFileUpload}
                  />
                  <label
                    htmlFor="docx-upload"
                    className="flex items-center gap-2 px-3 py-1.5 bg-white/10 hover:bg-white/20 rounded-lg text-xs font-bold cursor-pointer transition-all"
                  >
                    {isReading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} Tải .docx
                  </label>
                </div>
              </div>
              
              <div className="space-y-2">
                <textarea
                  value={project.extraContext}
                  onChange={(e) => updateProject({ extraContext: e.target.value })}
                  placeholder="Dán nội dung chi tiết hoặc ghi chú bổ sung tại đây để AI phân tích sâu hơn..."
                  className="w-full h-[280px] bg-white/[0.02] border border-white/5 rounded-2xl p-4 text-white/60 placeholder:text-white/10 focus:outline-none focus:ring-1 focus:ring-white/20 transition-all resize-none text-xs leading-relaxed"
                />
                <p className="text-[10px] text-white/20 italic text-right">Mẹo: Bạn có thể tải file Word hoặc dán trực tiếp kịch bản thô.</p>
              </div>
            </div>
          </div>
        </div>

        <div className="space-y-3">
          <label className="text-sm font-medium text-white/60">Thời lượng dự kiến (phút): {project.duration}</label>
          <input
            type="range"
            min="5"
            max="180"
            step="5"
            value={project.duration}
            onChange={(e) => updateProject({ duration: parseInt(e.target.value) })}
            className="w-full accent-orange-500 bg-white/10 h-2 rounded-lg appearance-none cursor-pointer"
          />
          <div className="flex justify-between text-[10px] text-white/30 font-mono">
            <span>SHORT (5m)</span>
            <span>FEATURE (180m)</span>
          </div>
        </div>

        <button
          onClick={onComplete}
          disabled={!project.genre || !project.initialIdea}
          className="w-full py-4 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-2xl flex items-center justify-center gap-2 transition-all group"
        >
          Tiếp tục <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
        </button>
      </div>
    </div>
  );
}
