import React, { useEffect, useState } from 'react';
import { ProjectState } from '../types';
import { getAllProjects, deleteProjectFromStorage } from '../lib/storage';
import { Film, Trash2, FolderOpen, Clock, Globe } from 'lucide-react';
import { motion } from 'motion/react';

interface ProjectGalleryProps {
  onSelectProject: (project: ProjectState) => void;
  onClose: () => void;
}

export default function ProjectGallery({ onSelectProject, onClose }: ProjectGalleryProps) {
  const [projects, setProjects] = useState<(ProjectState & { updatedAt: string })[]>([]);

  useEffect(() => {
    setProjects(getAllProjects());
  }, []);

  const handleDelete = (e: React.MouseEvent, id: string) => {
    e.stopPropagation();
    if (confirm('Bạn có chắc chắn muốn xóa dự án này?')) {
      deleteProjectFromStorage(id);
      setProjects(getAllProjects());
    }
  };

  return (
    <div className="fixed inset-0 bg-[#0A0A0B]/90 backdrop-blur-xl z-[100] flex items-center justify-center p-6">
      <motion.div 
        initial={{ opacity: 0, scale: 0.95 }}
        animate={{ opacity: 1, scale: 1 }}
        className="w-full max-w-4xl bg-white/5 border border-white/10 rounded-[2.5rem] flex flex-col h-[80vh] overflow-hidden"
      >
        <header className="p-8 border-b border-white/5 flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold uppercase font-mono tracking-tight">Project Archive</h2>
            <h3 className="text-sm text-white/40">Thư viện kịch bản đã lưu</h3>
          </div>
          <button 
            onClick={onClose}
            className="w-10 h-10 flex items-center justify-center bg-white/5 hover:bg-white/10 rounded-full transition-all"
          >
            ✕
          </button>
        </header>

        <div className="flex-1 overflow-y-auto p-8 custom-scrollbar">
          {projects.length === 0 ? (
            <div className="h-full flex flex-col items-center justify-center text-white/20 gap-4">
              <FolderOpen size={48} />
              <p className="font-mono text-sm">ARCHIVE EMPTY / THƯ VIỆN TRỐNG</p>
            </div>
          ) : (
            <div className="grid md:grid-cols-2 gap-4">
              {projects.map((p) => (
                <button
                  key={p.id}
                  onClick={() => onSelectProject(p)}
                  className="bg-white/[0.02] hover:bg-white/5 border border-white/5 hover:border-white/20 rounded-3xl p-6 text-left transition-all group relative"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className="p-2 bg-orange-500/10 rounded-xl text-orange-500">
                      <Film size={20} />
                    </div>
                    <button 
                      onClick={(e) => handleDelete(e, p.id)}
                      className="p-2 text-white/10 hover:text-red-500 transition-colors"
                    >
                      <Trash2 size={16} />
                    </button>
                  </div>

                  <h4 className="text-lg font-bold truncate mb-1">{p.title || 'Untitled Project'}</h4>
                  <div className="flex items-center gap-2 mb-4">
                    <span className="text-[10px] px-2 py-0.5 bg-white/5 rounded border border-white/10 text-white/40">{p.genre}</span>
                    <span className="text-[10px] text-white/20 font-mono italic">| {p.duration} min</span>
                  </div>

                  <p className="text-xs text-white/40 line-clamp-2 mb-6 h-8 italic leading-relaxed">
                    {p.initialIdea}
                  </p>

                  <div className="flex items-center justify-between border-t border-white/5 pt-4">
                    <div className="flex items-center gap-1 text-[10px] text-white/20">
                      <Clock size={10} />
                      {new Date(p.updatedAt).toLocaleDateString()}
                    </div>
                    <div className="flex items-center gap-1 text-[10px] text-orange-500/50 font-bold uppercase tracking-widest">
                      <Globe size={10} /> Trilingual
                    </div>
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </motion.div>
    </div>
  );
}
