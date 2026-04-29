import React, { useState } from 'react';
import { ProjectState, ScriptSegment } from '../types';
import { generateSegmentDraft, syncTranslations } from '../services/ai';
import { ArrowLeft, Save, Sparkles, Loader2, ChevronLeft, ChevronRight, FileText, Type as TypeIcon, Edit3, Send, CheckCircle2 } from 'lucide-react';
import { saveProjectToStorage } from '../lib/storage';

interface StepEditorProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onPrev: () => void;
}

export default function StepEditor({ project, updateProject, onPrev }: StepEditorProps) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [activeLang, setActiveLang] = useState<'vi' | 'en' | 'zh'>('vi');
  
  // Quick Edit States
  const [selection, setSelection] = useState<{ start: number, end: number, text: string } | null>(null);
  const [editedSnippet, setEditedSnippet] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const handleManualSave = () => {
    setSaveStatus('saving');
    saveProjectToStorage(project);
    setTimeout(() => {
      setSaveStatus('saved');
      setTimeout(() => setSaveStatus('idle'), 2000);
    }, 600);
  };

  const segments = project.segments;
  const activeSegment = segments[activeSegmentIndex];

  const updateSegmentContent = (content: string, lang: 'vi' | 'en' | 'zh') => {
    const newSegments = [...segments];
    const fieldMap = { vi: 'contentVi', en: 'contentEn', zh: 'contentZh' } as const;
    newSegments[activeSegmentIndex] = { ...activeSegment, [fieldMap[lang]]: content };
    updateProject({ segments: newSegments });
  };

  const handleDraftContent = async () => {
    setDrafting(true);
    try {
      const selectedBranch = project.branches.find(b => b.id === project.selectedBranchId);
      const context = `Story: ${project.initialIdea}. Branch: ${selectedBranch?.description}. Act Structure: ${JSON.stringify(project.acts)}. Current Segment: ${activeSegment.title}. Additional Context: ${project.extraContext}`;
      const draft = await generateSegmentDraft(activeSegment.title, context);
      
      const newSegments = [...segments];
      newSegments[activeSegmentIndex] = { 
        ...activeSegment, 
        contentVi: draft.vi,
        contentEn: draft.en,
        contentZh: draft.zh
      };
      updateProject({ segments: newSegments });
    } catch (error) {
      console.error(error);
    } finally {
      setDrafting(false);
    }
  };

  const handleSelection = (e: React.SyntheticEvent<HTMLTextAreaElement>) => {
    const target = e.currentTarget;
    const start = target.selectionStart;
    const end = target.selectionEnd;
    const text = target.value.substring(start, end);
    
    if (text.trim().length > 0) {
      setSelection({ start, end, text });
      setEditedSnippet(text);
    }
  };

  const handleQuickUpdate = async () => {
    if (!selection || !activeSegment) return;
    
    setSyncing(true);
    try {
      const fieldMap = { vi: 'contentVi', en: 'contentEn', zh: 'contentZh' } as const;
      const currentFullText = activeSegment[fieldMap[activeLang]];
      
      // 1. Replace snippet in active language
      const newFullText = 
        currentFullText.substring(0, selection.start) + 
        editedSnippet + 
        currentFullText.substring(selection.end);
      
      // 2. Sync other languages via AI
      const langNames = { vi: 'Vietnamese', en: 'English', zh: 'Chinese' };
      const synced = await syncTranslations(newFullText, langNames[activeLang]);
      
      const newSegments = [...segments];
      newSegments[activeSegmentIndex] = { 
        ...activeSegment, 
        contentVi: synced.vi,
        contentEn: synced.en,
        contentZh: synced.zh
      };
      updateProject({ segments: newSegments });
      setSelection(null);
      setEditedSnippet('');
    } catch (error) {
      console.error('Sync failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!activeSegment) return null;

  const currentContent = activeLang === 'vi' ? activeSegment.contentVi : activeLang === 'en' ? activeSegment.contentEn : activeSegment.contentZh;

  const langs = [
    { key: 'vi', label: 'Vietnamese', sub: 'Tiếng Việt' },
    { key: 'en', label: 'English', sub: 'Tiếng Anh' },
    { key: 'zh', label: 'Chinese', sub: 'Tiếng Trung' },
  ] as const;

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-320px)] min-h-[600px]">
      {/* Sidebar: Navigation */}
      <aside className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex items-center justify-between mb-2">
          <div className="flex flex-col">
            <h3 className="text-sm font-mono uppercase tracking-widest text-white/30 leading-none">Segments</h3>
            <span className="text-[10px] text-white/10 uppercase font-mono">Phân đoạn</span>
          </div>
          <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10">{segments.length} total</span>
        </div>
        
        {segments.map((seg, idx) => {
          const isActive = idx === activeSegmentIndex;
          const hasContent = seg.contentVi.trim().length > 0 || seg.contentEn.trim().length > 0 || seg.contentZh.trim().length > 0;
          return (
            <button
              key={seg.id}
              onClick={() => setActiveSegmentIndex(idx)}
              className={`p-4 rounded-2xl text-left border transition-all relative overflow-hidden group ${
                isActive
                  ? 'bg-orange-500 text-black border-transparent shadow-lg shadow-orange-500/20'
                  : 'bg-white/5 border-white/5 hover:bg-white/10 text-white/60'
              }`}
            >
              <div className="flex items-center justify-between gap-2 relative z-10">
                <span className="text-xs font-bold truncate">{idx + 1}. {seg.title}</span>
                {hasContent && !isActive && <div className="w-1.5 h-1.5 rounded-full bg-orange-500" />}
              </div>
              <div className={`text-[10px] mt-1 relative z-10 ${isActive ? 'text-black/50' : 'text-white/20'}`}>
                {isActive ? 'CURRENTLY EDITING' : hasContent ? 'DRAFTED' : 'EMPTY'}
              </div>
            </button>
          );
        })}
      </aside>

      {/* Main Canvas: Editor */}
      <div className="flex-1 flex flex-col bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative">
        <header className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between bg-white/[0.02] gap-4">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-orange-500/20 rounded-xl text-orange-500">
              <FileText size={18} />
            </div>
            <div>
              <h4 className="text-sm font-bold">{activeSegment.title}</h4>
              <p className="text-[10px] text-white/30 truncate max-w-[150px]">
                {project.acts.find(act => act.plotPoints.some(pp => pp.id === activeSegment.plotPointId))?.title}
              </p>
            </div>
          </div>

          <div className="flex bg-white/5 p-1 rounded-xl border border-white/10">
            {langs.map(l => (
              <button
                key={l.key}
                onClick={() => setActiveLang(l.key)}
                className={`px-3 py-1.5 rounded-lg text-left transition-all ${
                  activeLang === l.key ? 'bg-white text-black shadow-sm' : 'text-white/40 hover:text-white/60'
                }`}
              >
                <div className="text-[9px] font-bold uppercase leading-none">{l.key}</div>
                <div className="text-[7px] leading-none opacity-60">{l.sub}</div>
              </button>
            ))}
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={handleManualSave}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-xl border transition-all ${
                saveStatus === 'saved' 
                  ? 'bg-green-500/20 border-green-500/50 text-green-500' 
                  : 'bg-white/5 border-white/10 text-white/60 hover:bg-white/10'
              }`}
            >
              {saveStatus === 'saving' ? (
                <Loader2 size={14} className="animate-spin" />
              ) : saveStatus === 'saved' ? (
                <CheckCircle2 size={14} />
              ) : (
                <Save size={14} />
              )}
              <span className="text-[10px] font-bold uppercase">{saveStatus === 'saved' ? 'Saved' : 'Save'}</span>
            </button>

            <button
              onClick={handleDraftContent}
              disabled={drafting}
              className="flex items-center gap-2 px-4 py-2 bg-white/5 hover:bg-white/10 rounded-xl transition-all disabled:opacity-50"
            >
              {drafting ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} className="text-orange-500" />}
              <div className="flex flex-col items-start leading-none">
                <span className="text-[10px] font-bold uppercase tracking-tight">AI Multi-Draft</span>
                <span className="text-[8px] opacity-40">Bản thảo đa ngôn ngữ</span>
              </div>
            </button>
            <div className="h-6 w-[1px] bg-white/10 mx-1 hidden sm:block" />
            <div className="flex gap-1">
              <button
                disabled={activeSegmentIndex === 0}
                onClick={() => setActiveSegmentIndex(s => s - 1)}
                className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20 transition-all"
              >
                <ChevronLeft size={18} />
              </button>
              <button
                disabled={activeSegmentIndex === segments.length - 1}
                onClick={() => setActiveSegmentIndex(s => s + 1)}
                className="p-2 hover:bg-white/10 rounded-xl disabled:opacity-20 transition-all"
              >
                <ChevronRight size={18} />
              </button>
            </div>
          </div>
        </header>

        <div className="flex-1 relative flex flex-col">
          <textarea
            value={currentContent}
            onSelect={handleSelection}
            onChange={(e) => {
              updateSegmentContent(e.target.value, activeLang);
              setSelection(null); // Clear selection when typing directly
            }}
            placeholder={`[Bắt đầu viết kịch bản (${activeLang.toUpperCase()}) của bạn tại đây...]`}
            className="flex-1 p-12 bg-transparent text-white/90 placeholder:text-white/10 focus:outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar"
          />

          {/* Quick Edit Overlay / Bottom Panel */}
          {selection && (
            <div className="absolute bottom-4 left-4 right-4 bg-[#121214] border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 group/quick z-30 animate-in slide-in-from-bottom-2 duration-300">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className="p-1.5 bg-orange-500/10 rounded-lg text-orange-500">
                    <Edit3 size={14} />
                  </div>
                  <span className="text-[10px] font-mono text-white/40 uppercase tracking-widest">Quick Editor / Chỉnh sửa nhanh</span>
                </div>
                <button 
                  onClick={() => setSelection(null)}
                  className="text-white/20 hover:text-white/40 text-xs"
                >
                  X
                </button>
              </div>
              
              <div className="flex flex-col md:flex-row gap-3">
                <textarea
                  value={editedSnippet}
                  onChange={(e) => setEditedSnippet(e.target.value)}
                  className="flex-1 min-h-[80px] bg-white/5 border border-white/5 rounded-xl p-3 text-sm focus:outline-none focus:ring-1 focus:ring-orange-500/30 transition-all font-mono"
                  autoFocus
                />
                <button
                  onClick={handleQuickUpdate}
                  disabled={syncing || editedSnippet === selection.text}
                  className="md:w-40 bg-orange-500 hover:bg-orange-600 disabled:opacity-50 disabled:cursor-not-allowed text-black font-bold rounded-xl flex flex-col items-center justify-center gap-1 transition-all p-4"
                >
                  {syncing ? <Loader2 size={18} className="animate-spin" /> : <Send size={18} />}
                  <span className="text-[10px] uppercase tracking-tighter">{syncing ? 'Syncing...' : 'Update & Sync'}</span>
                </button>
              </div>
              
              <div className="text-[9px] text-white/20 italic">
                {syncing 
                  ? "AI is translating and re-aligning other versions... / AI đang cập nhật các ngôn ngữ khác..."
                  : "Updating this will automatically sync English and Chinese versions. / Cập nhật này sẽ tự động đồng bộ tiếng Anh và tiếng Trung."
                }
              </div>
            </div>
          )}
          
          {drafting && (
            <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
              <div className="relative">
                <Loader2 className="animate-spin text-orange-500" size={48} />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-400" size={20} />
              </div>
              <p className="text-sm font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">Trilingual Crafting...</p>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><TypeIcon size={12} /> {currentContent.length} chars</span>
            <span>{currentContent.split(/\s+/).filter(x => x).length} words</span>
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const fullScript = segments.map(s => {
                  return `
========================================
SEGMENT: ${s.title}
========================================

--- VIETNAMESE ---
${s.contentVi}

--- ENGLISH ---
${s.contentEn}

--- CHINESE ---
${s.contentZh}
`;
                }).join('\n\n');
                const blob = new Blob([fullScript], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.title || 'Screenplay'}_Trilingual.txt`;
                a.click();
              }}
              className="text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1"
            >
              DOWNLOAD FULL TRILINGUAL SCRIPT
            </button>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">CTRL + S</kbd>
              <span>to save draft</span>
            </div>
          </div>
        </footer>
      </div>

      {/* Floating Action for Return */}
      <button
        onClick={onPrev}
        className="fixed bottom-10 right-10 p-4 bg-white/5 hover:bg-white/10 border border-white/10 text-white/40 rounded-2xl transition-all hover:scale-110 active:scale-95 group backdrop-blur-xl"
        title="Quay lại thiết lập"
      >
        <ArrowLeft size={24} className="group-hover:-translate-x-1 transition-transform" />
      </button>
    </div>
  );
}
