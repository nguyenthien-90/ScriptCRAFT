import React, { useState, useRef } from 'react';
import { ProjectState, ScriptSegment } from '../types';
import { generateSegmentDraft, syncTranslations } from '../services/ai';
import { ArrowLeft, Save, Sparkles, Loader2, ChevronLeft, ChevronRight, FileText, Type as TypeIcon, Edit3, Send, CheckCircle2 } from 'lucide-react';
import { saveProjectToStorage } from '../lib/storage';

const estimateDuration = (text: string, lang: 'vi' | 'en' | 'zh'): number => {
  if (!text || !text.trim()) return 0;
  if (lang === 'zh') {
    const chars = text.trim().replace(/\s+/g, '').length;
    return Math.ceil(chars / 3.5); // 3.5 Chinese characters per second
  } else {
    const words = text.trim().split(/\s+/).filter(Boolean).length;
    return Math.ceil(words / 2.3); // 2.3 words per second (140 WPM)
  }
};

const getAnnotatedDuration = (text: string): number => {
  if (!text) return 0;
  const regex = /(\d+)\s*(?:s|S|giây|giay|giây)/g;
  let sum = 0;
  let match;
  regex.lastIndex = 0;
  while ((match = regex.exec(text)) !== null) {
    sum += parseInt(match[1], 10);
  }
  return sum;
};

interface StepEditorProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onPrev: () => void;
}

export default function StepEditor({ project, updateProject, onPrev }: StepEditorProps) {
  const [activeSegmentIndex, setActiveSegmentIndex] = useState(0);
  const [drafting, setDrafting] = useState(false);
  const [activeLang, setActiveLang] = useState<'vi' | 'en' | 'zh'>('vi');
  
  const textareaRef = useRef<HTMLTextAreaElement>(null);

  // Quick Edit States
  const [selection, setSelection] = useState<{ start: number, end: number, text: string } | null>(null);
  const [editedSnippet, setEditedSnippet] = useState('');
  const [syncing, setSyncing] = useState(false);
  const [saveStatus, setSaveStatus] = useState<'idle' | 'saving' | 'saved'>('idle');

  const insertCharacterHeader = (characterName: string) => {
    if (!textareaRef.current) return;
    const textarea = textareaRef.current;
    const start = textarea.selectionStart;
    const end = textarea.selectionEnd;
    const text = textarea.value;
    const insertion = `\n\n${characterName.toUpperCase()}\n[ Lời thoại (5s) ]\n`;
    const newText = text.substring(0, start) + insertion + text.substring(end);
    updateSegmentContent(newText, activeLang);
    
    // Resume focus
    setTimeout(() => {
      textarea.focus();
      const newCursorPos = start + insertion.length;
      textarea.setSelectionRange(newCursorPos, newCursorPos);
    }, 50);
  };

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
      const draft = await generateSegmentDraft(activeSegment.title, context, project.characters, project.genre);
      
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
      
      const newSegments = [...segments];
      newSegments[activeSegmentIndex] = { 
        ...activeSegment, 
        contentVi: newFullText
      };
      updateProject({ segments: newSegments });
      setSelection(null);
      setEditedSnippet('');
    } catch (error) {
      console.error('Update failed:', error);
    } finally {
      setSyncing(false);
    }
  };

  if (!activeSegment) return null;

  const currentContent = activeSegment.contentVi;
  const currentDuration = getAnnotatedDuration(currentContent);

  const langs = [
    { key: 'vi', label: 'Vietnamese', sub: 'Tiếng Việt' },
  ] as const;

  const totalDuration = segments.reduce((acc, seg) => {
    return acc + getAnnotatedDuration(seg.contentVi);
  }, 0);

  return (
    <div className="flex flex-col lg:flex-row gap-8 h-[calc(100vh-200px)] min-h-[800px]">
      {/* Sidebar: Navigation */}
      <aside className="w-full lg:w-72 flex flex-col gap-4 overflow-y-auto pr-2 custom-scrollbar">
        <div className="flex flex-col gap-2 mb-2">
          <div className="flex items-center justify-between">
            <div className="flex flex-col">
              <h3 className="text-sm font-mono uppercase tracking-widest text-white/30 leading-none">Segments</h3>
              <span className="text-[10px] text-white/10 uppercase font-mono">Phân đoạn</span>
            </div>
            <span className="text-[10px] bg-white/5 px-2 py-1 rounded border border-white/10">{segments.length} total</span>
          </div>
          <div className="bg-white/[0.02] p-3 rounded-xl border border-white/5 flex flex-col gap-1">
            <span className="text-[9px] text-white/30 uppercase font-mono">Total Duration / Tổng thời lượng</span>
            <span className="text-xs font-bold font-mono text-orange-400">
              ⏱️ {totalDuration}s ({Math.floor(totalDuration / 60)}m {totalDuration % 60}s)
            </span>
          </div>
        </div>
        
        {segments.map((seg, idx) => {
          const isActive = idx === activeSegmentIndex;
          const hasContent = seg.contentVi.trim().length > 0;
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
              <div className="flex items-center justify-between mt-2 relative z-10">
                <span className={`text-[10px] ${isActive ? 'text-black/50' : 'text-white/20'}`}>
                  {isActive ? 'EDITING' : hasContent ? 'DRAFTED' : 'EMPTY'}
                </span>
              </div>
            </button>
          );
        })}
      </aside>

      {/* Main Canvas: Editor */}
      <div className="flex-1 flex flex-col bg-white/5 rounded-3xl border border-white/10 overflow-hidden relative">
        <header className="p-4 border-b border-white/10 flex flex-wrap items-center justify-between bg-white/[0.02] gap-4">
          <div className="flex items-center gap-6">
            <button 
              onClick={() => {
                // We don't have direct access to setShowGallery(true) in App.tsx
                // but we can pass it down as a prop if we want.
                // Alternatively, we can use a custom event or let App.tsx handle navigation.
                // For now, I'll assume we might want to add onShowArchive to the props.
                onPrev(); // If we go back far enough we see it, but better to have it here.
              }}
              className="flex items-center gap-2 text-white/30 hover:text-white transition-colors"
            >
              <ArrowLeft size={16} />
              <span className="text-[10px] font-bold uppercase tracking-widest">Back</span>
            </button>

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
              <span className="text-[10px] font-bold uppercase">{saveStatus === 'saved' ? 'Đã lưu kịch bản' : 'Lưu bản thảo'}</span>
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

        <div className="flex-1 relative flex flex-col md:flex-row divide-y md:divide-y-0 md:divide-x divide-white/10 min-h-0">
          <textarea
            ref={textareaRef}
            value={currentContent}
            onSelect={handleSelection}
            onChange={(e) => {
              updateSegmentContent(e.target.value, activeLang);
              setSelection(null); // Clear selection when typing directly
            }}
            placeholder="[Bắt đầu viết kịch bản của bạn tại đây...]"
            className="flex-1 p-6 lg:p-10 lg:py-8 bg-transparent text-white/90 placeholder:text-white/10 focus:outline-none resize-none font-mono text-sm leading-relaxed custom-scrollbar outline-none min-h-[350px] md:min-h-0"
          />

          {/* Quick Character Shortcuts Side Panel */}
          <div className="w-full md:w-60 bg-white/[0.01] p-4 flex flex-col gap-3 shrink-0 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between pb-2 border-b border-white/5">
              <span className="text-[10px] font-mono uppercase tracking-wider text-white/40 flex items-center gap-1.5">
                👤 Nhân vật / Shortcuts
              </span>
              <span className="text-[9px] text-orange-400 font-mono font-bold bg-orange-500/10 px-1.5 py-0.5 rounded border border-orange-500/10">
                {(project.characters || []).length} thiết lập
              </span>
            </div>
            
            {(project.characters && project.characters.length > 0) ? (
              <div className="flex flex-col gap-2">
                <p className="text-[9px] text-white/20 italic leading-snug">
                  Click vào một nhân vật dưới đây để tự động chèn nhanh khối thoại của họ vào vị trí trỏ chuột!
                </p>
                {(project.characters || []).map(char => (
                  <button
                    key={char.id}
                    onClick={() => insertCharacterHeader(char.name)}
                    className="w-full text-left p-2.5 bg-white/5 hover:bg-orange-500/10 hover:border-orange-500/30 border border-white/5 rounded-xl transition-all flex flex-col gap-0.5 group"
                    title={`Chèn thoại cho ${char.name}`}
                  >
                    <span className="text-xs font-bold font-mono tracking-wider text-orange-400 group-hover:text-orange-300 uppercase transition-colors">
                      {char.name}
                    </span>
                    <span className="text-[9px] text-white/40 font-mono truncate">
                      {char.role}
                    </span>
                  </button>
                ))}
              </div>
            ) : (
              <div className="flex flex-col items-center justify-center p-4 text-center border border-dashed border-white/5 rounded-2xl min-h-[120px]">
                <p className="text-[10px] text-white/30 leading-normal">
                  Chưa có nhân vật nào được thiết lập trước.
                </p>
                <p className="text-[8px] text-white/20 mt-1">
                  Nhấn "Quay lại" ở góc dưới hoặc "Library" để thiết lập nhân vật giúp AI viết thoại chính chủ nhé!
                </p>
              </div>
            )}
          </div>

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
                  <span className="text-[10px] uppercase tracking-tighter">{syncing ? 'Đang lưu...' : 'Cập nhật'}</span>
                </button>
              </div>
              
              <div className="text-[9px] text-white/20 italic">
                Cập nhật nhanh nội dung phân đoạn trong kịch bản tiếng Việt.
              </div>
            </div>
          )}
          
          {drafting && (
            <div className="absolute inset-0 bg-[#0A0A0B]/80 backdrop-blur-sm flex flex-col items-center justify-center gap-4 z-20">
              <div className="relative">
                <Loader2 className="animate-spin text-orange-500" size={48} />
                <Sparkles className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 text-orange-400" size={20} />
              </div>
              <p className="text-sm font-mono text-white/40 animate-pulse uppercase tracking-[0.2em]">Đang sáng tác...</p>
            </div>
          )}
        </div>

        <footer className="p-4 border-t border-white/5 flex items-center justify-between text-[10px] font-mono text-white/20">
          <div className="flex items-center gap-4">
            <span className="flex items-center gap-1"><TypeIcon size={12} /> {currentContent.length} ký tự</span>
            <span>{currentContent.split(/\s+/).filter(x => x).length} từ</span>
            {currentDuration > 0 && (
              <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 px-2 py-1 rounded-lg">
                ⏱️ Tổng thời lượng thoại: {currentDuration} giây ({currentDuration}s)
              </span>
            )}
          </div>
          <div className="flex items-center gap-4">
            <button 
              onClick={() => {
                const fullScript = segments.map(s => {
                  return `
============================================================
PHÂN ĐOẠN: ${s.title}
============================================================

${s.contentVi}
`;
                }).join('\n\n');
                const blob = new Blob([fullScript], { type: 'text/plain' });
                const url = URL.createObjectURL(blob);
                const a = document.createElement('a');
                a.href = url;
                a.download = `${project.title || 'Kich_ban'}_Tieng_Viet.txt`;
                a.click();
              }}
              className="text-orange-500 hover:text-orange-400 transition-colors flex items-center gap-1 uppercase font-bold tracking-wider"
            >
              TẢI TOÀN BỘ KỊCH BẢN (.TXT)
            </button>
            <div className="flex items-center gap-2">
              <kbd className="px-1.5 py-0.5 bg-white/5 rounded border border-white/10">CTRL + S</kbd>
              <span>để lưu bản thảo</span>
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
