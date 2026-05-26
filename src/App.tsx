/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { Film, Sparkles, Map, ListStart, Save, FileEdit, ArrowRight, ArrowLeft, FolderOpen } from 'lucide-react';
import { ProjectState, Genre } from './types.ts';
import StepIdea from './components/StepIdea.tsx';
import StepClarify from './components/StepClarify.tsx';
import StepBranches from './components/StepBranches.tsx';
import StepStructure from './components/StepStructure.tsx';
import StepSave from './components/StepSave.tsx';
import StepEditor from './components/StepEditor.tsx';
import ProjectGallery from './components/ProjectGallery.tsx';

export default function App() {
  const [step, setStep] = useState(1);
  const [showGallery, setShowGallery] = useState(false);
  const [project, setProject] = useState<ProjectState>({
    id: crypto.randomUUID(),
    title: '',
    genre: 'Drama',
    initialIdea: '',
    extraContext: '',
    duration: 90,
    questions: [],
    answers: {},
    branches: [],
    selectedBranchId: null,
    acts: [],
    segments: [],
    characters: [],
  });

  const nextStep = () => setStep((s) => Math.min(s + 1, 6));
  const prevStep = () => setStep((s) => Math.max(s - 1, 1));

  const updateProject = (updates: Partial<ProjectState>) => {
    setProject(prev => ({ ...prev, ...updates }));
  };

  const steps = [
    { id: 1, label: 'Idea', subLabel: 'Ý tưởng', icon: Sparkles },
    { id: 2, label: 'Clarify', subLabel: 'Làm rõ', icon: Film },
    { id: 3, label: 'Direction', subLabel: 'Hướng kể', icon: Map },
    { id: 4, label: 'Structure', subLabel: 'Cấu trúc', icon: ListStart },
    { id: 5, label: 'Finalize', subLabel: 'Hoàn tất', icon: Save },
    { id: 6, label: 'Editor', subLabel: 'Biên tập', icon: FileEdit },
  ];

  const handleOpenProject = (p: ProjectState) => {
    setProject(p);
    setShowGallery(false);
    // If it has segments, go to editor, else go to Step 5
    if (p.segments && p.segments.length > 0) {
      setStep(6);
    } else {
      setStep(5);
    }
  };

  const startNewProject = () => {
    if (confirm('Start a new project? Any unsaved changes in the current session will be lost. / Bắt đầu dự án mới? Các thay đổi chưa lưu sẽ bị mất.')) {
      setProject({
        id: crypto.randomUUID(),
        title: '',
        genre: 'Drama',
        initialIdea: '',
        extraContext: '',
        duration: 90,
        questions: [],
        answers: {},
        branches: [],
        selectedBranchId: null,
        acts: [],
        segments: [],
        characters: [],
      });
      setStep(1);
    }
  };

  return (
    <div className="min-h-screen bg-[#0A0A0B] text-white font-sans selection:bg-orange-500/30">
      {/* Background decoration */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full bg-orange-500/5 blur-[120px]" />
        <div className="absolute bottom-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full bg-blue-500/5 blur-[120px]" />
      </div>

      <div className="relative max-w-6xl mx-auto px-6 py-12">
        <header className="flex flex-col md:flex-row md:items-center justify-between mb-12 gap-6">
          <div 
            className="flex flex-col items-center md:items-start cursor-pointer hover:opacity-80 transition-all group"
            onClick={() => setStep(1)}
          >
            <h1 className="text-4xl font-bold tracking-tight mb-2 bg-gradient-to-r from-white to-white/40 bg-clip-text text-transparent group-hover:from-orange-500 group-hover:to-white transition-all">
              ScriptCRAFT
            </h1>
            <p className="text-white/40 text-[10px] font-mono uppercase tracking-[0.3em]">AI-POWERED SCREENPLAY STUDIO</p>
          </div>

          <div className="flex items-center gap-4">
            <button 
              onClick={startNewProject}
              className="flex items-center gap-2 px-4 py-2 bg-orange-500/10 hover:bg-orange-500 text-orange-500 hover:text-black border border-orange-500/20 rounded-xl transition-all group"
            >
              <Sparkles size={16} className="group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest">New Project</span>
            </button>

            <button 
              onClick={() => setShowGallery(true)}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 border border-white/10 rounded-xl transition-all group"
            >
              <FolderOpen size={16} className="text-orange-500 group-hover:scale-110 transition-transform" />
              <span className="text-[10px] font-bold uppercase tracking-widest text-white/60">Library</span>
            </button>

            <nav className="flex items-center gap-2 p-1.5 bg-white/5 rounded-2xl border border-white/10 backdrop-blur-xl">
              {steps.map((s) => {
                const Icon = s.icon;
                const isActive = step === s.id;
                const isPast = step > s.id;
                return (
                  <button
                    key={s.id}
                    onClick={() => setStep(s.id)}
                    className={`flex flex-col items-center justify-center w-14 h-14 md:w-24 md:h-20 rounded-xl transition-all duration-500 outline-none ${
                      isActive 
                        ? 'bg-orange-500 text-black shadow-[0_0_20px_rgba(249,115,22,0.3)]' 
                        : isPast 
                          ? 'text-orange-500/60 hover:text-orange-500 hover:bg-white/5' 
                          : 'text-white/20 hover:text-white/40 hover:bg-white/5'
                    }`}
                  >
                    <Icon size={isActive ? 22 : 18} />
                    <div className={`text-center mt-1 leading-none ${isActive ? 'block' : 'hidden md:block'}`}>
                      <span className="text-[10px] block font-bold uppercase tracking-tighter">{s.label}</span>
                      <span className={`text-[8px] opacity-70 ${isActive ? 'text-black' : ''}`}>{s.subLabel}</span>
                    </div>
                  </button>
                );
              })}
            </nav>
          </div>
        </header>

        <main className="min-h-[500px]">
          <AnimatePresence mode="wait">
            <motion.div
              key={`${project.id}-${step}`}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -20 }}
              transition={{ duration: 0.4, ease: [0.23, 1, 0.32, 1] }}
            >
              {step === 1 && <StepIdea project={project} updateProject={updateProject} onComplete={nextStep} />}
              {step === 2 && <StepClarify project={project} updateProject={updateProject} onComplete={nextStep} onPrev={prevStep} />}
              {step === 3 && <StepBranches project={project} updateProject={updateProject} onComplete={nextStep} onPrev={prevStep} />}
              {step === 4 && <StepStructure project={project} updateProject={updateProject} onComplete={nextStep} onPrev={prevStep} />}
              {step === 5 && <StepSave project={project} updateProject={updateProject} onComplete={nextStep} onPrev={prevStep} />}
              {step === 6 && <StepEditor project={project} updateProject={updateProject} onPrev={prevStep} />}
            </motion.div>
          </AnimatePresence>
        </main>

        <AnimatePresence>
          {showGallery && (
            <ProjectGallery 
              onSelectProject={handleOpenProject} 
              onClose={() => setShowGallery(false)} 
            />
          )}
        </AnimatePresence>

        <footer className="mt-12 flex items-center justify-between border-t border-white/5 pt-8 text-white/30 text-xs">
          <p>© 2024 ScriptCRAFT AI. Crafted for Visionary Filmmakers.</p>
          <div className="flex gap-4">
            <span>SCENE: {step}/6</span>
            <span className="font-mono">{project.id.slice(0, 8)}</span>
          </div>
        </footer>
      </div>
    </div>
  );
}

