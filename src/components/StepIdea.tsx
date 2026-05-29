import React, { useState } from 'react';
import { ProjectState, Genre, Character } from '../types';
import { ArrowRight, Sparkles, FileUp, Loader2, Info, FolderOpen, Plus, Trash2, User, RefreshCw, Layers } from 'lucide-react';
import mammoth from 'mammoth';
import { generateSuggestedCharacters, enrichScriptIdea } from '../services/ai';

interface StepIdeaProps {
  project: ProjectState;
  updateProject: (updates: Partial<ProjectState>) => void;
  onComplete: () => void;
}

interface GenreOption {
  key: Genre;
  label: string;
}

const GENRES: GenreOption[] = [
  { key: 'Drama', label: 'Phim chính kịch (tâm lý)' },
  { key: 'Comedy', label: 'Phim hài' },
  { key: 'Romance', label: 'Phim lãng mạn (tình cảm)' },
  { key: 'Fantasy', label: 'Phim giả tưởng (kỳ ảo)' },
  { key: 'Documentary', label: 'Phim tài liệu' },
  { key: 'Religion', label: 'Phim tôn giáo' },
  { key: 'History', label: 'Phim lịch sử' },
  { key: 'Action', label: 'Phim hành động' },
  { key: 'Animation', label: 'Phim hoạt hình' }
];

export default function StepIdea({ project, updateProject, onComplete }: StepIdeaProps) {
  const [isReading, setIsReading] = useState(false);
  const [isEnriching, setIsEnriching] = useState(false);
  const [newCharName, setNewCharName] = useState('');
  const [newCharRole, setNewCharRole] = useState('Nhân vật chính');
  const [newCharDesc, setNewCharDesc] = useState('');
  const [isSuggesting, setIsSuggesting] = useState(false);
  const [isAddingManually, setIsAddingManually] = useState(false);

  // States for editing existing characters
  const [editingCharId, setEditingCharId] = useState<string | null>(null);
  const [editCharName, setEditCharName] = useState('');
  const [editCharRole, setEditCharRole] = useState('');
  const [editCharDesc, setEditCharDesc] = useState('');

  const characters = project.characters || [];

  const handleEnrichIdea = async () => {
    if (!project.genre) {
      alert('Vui lòng chọn Thể loại phim ở trên cùng trước nhé!');
      return;
    }
    if (!project.extraContext || !project.extraContext.trim()) {
      alert('Vui lòng nhập dán nội dung hoặc bấm tải file Word ở phần "Tài liệu đính kèm" trước nhé! AI sẽ phân tích tài liệu đó để bổ sung tình tiết kịch tính.');
      return;
    }

    setIsEnriching(true);
    try {
      const enriched = await enrichScriptIdea(project.genre, project.extraContext, project.initialIdea);
      updateProject({ initialIdea: enriched });
    } catch (err) {
      console.error('Lỗi khi tự động bổ sung ý tưởng:', err);
      alert('Không nhận được kịch bản bổ sung từ AI. Vui lòng thử lại.');
    } finally {
      setIsEnriching(false);
    }
  };

  const handleAddCharacter = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newCharName.trim()) return;

    const newChar: Character = {
      id: crypto.randomUUID(),
      name: newCharName.toUpperCase().trim(),
      role: newCharRole.trim() || 'Nhân vật phụ',
      description: newCharDesc.trim()
    };

    updateProject({ characters: [...characters, newChar] });

    // Reset form
    setNewCharName('');
    setNewCharRole('Nhân vật chính');
    setNewCharDesc('');
    setIsAddingManually(false);
  };

  const handleRemoveCharacter = (id: string) => {
    updateProject({ characters: characters.filter(c => c.id !== id) });
    if (editingCharId === id) {
      setEditingCharId(null);
    }
  };

  const handleStartEdit = (char: Character) => {
    setEditingCharId(char.id);
    setEditCharName(char.name);
    setEditCharRole(char.role);
    setEditCharDesc(char.description || '');
  };

  const handleSaveEdit = (id: string) => {
    if (!editCharName.trim()) {
      alert('Tên nhân vật không được để trống.');
      return;
    }
    const updated = characters.map(c => {
      if (c.id === id) {
        return {
          ...c,
          name: editCharName.toUpperCase().trim(),
          role: editCharRole.trim() || 'Nhân vật phụ',
          description: editCharDesc.trim()
        };
      }
      return c;
    });
    updateProject({ characters: updated });
    setEditingCharId(null);
  };

  const handleAutoSuggestCharacters = async () => {
    if (!project.genre) {
      alert('Vui lòng chọn Thể loại phim trước nhé!');
      return;
    }
    if (!project.initialIdea?.trim() && !project.extraContext?.trim()) {
      alert('Vui lòng nhập dán "Tài liệu đính kèm" hoặc điền vào ô "Bổ Sung Tài nguyên" để AI có dữ liệu phân tích nhân vật nhé!');
      return;
    }

    setIsSuggesting(true);
    try {
      const suggested = await generateSuggestedCharacters(project.genre, project.initialIdea, project.extraContext);
      updateProject({ characters: [...characters, ...suggested] });
    } catch (err) {
      console.error('Lỗi khi gợi ý nhân vật:', err);
      alert('Không nhận được gợi ý nhân vật tự động từ AI. Vui lòng tự nhập thủ công.');
    } finally {
      setIsSuggesting(false);
    }
  };

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
      <div className="text-center space-y-2 pb-8 border-b border-white/5">
        <h2 className="text-3xl font-bold tracking-tight uppercase font-mono">Core Concept</h2>
        <h3 className="text-xl font-medium text-white/50">Hạt giống ý tưởng</h3>
      </div>

      <div className="text-center">
        <p className="text-white/30 text-sm max-w-md mx-auto">Start your creative journey by defining the main genre and core premise of your film.</p>
      </div>

      <div className="space-y-6 bg-white/5 p-8 rounded-3xl border border-white/10 backdrop-blur-sm">
        {/* THỂ LOẠI PHIM (NẰM TRÊN CÙNG) */}
        <div className="space-y-3 pb-6 border-b border-white/5">
          <label className="text-sm font-medium text-white/80 block font-mono uppercase tracking-wider">Thể loại phim</label>
          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-5 gap-2">
            {GENRES.map((g) => (
              <button
                key={g.key}
                type="button"
                onClick={() => updateProject({ genre: g.key })}
                className={`py-3 px-3 rounded-2xl text-xs font-semibold text-center transition-all border ${
                  project.genre === g.key 
                    ? 'bg-orange-500 text-black border-orange-500 font-bold shadow-lg shadow-orange-500/10' 
                    : 'bg-white/5 hover:bg-white/10 text-white/70 border-white/5'
                }`}
              >
                {g.label}
              </button>
            ))}
          </div>
        </div>

        {/* KHUNG TÀI LIỆU ĐÍNH KÈM (NẰM DƯỚI THỂ LOẠI PHIM) */}
        <div className="space-y-3 pb-6 border-b border-white/5">
          <div className="flex items-center justify-between">
            <label className="text-sm font-medium text-white/80 flex items-center gap-2 font-mono uppercase tracking-wider">
              Khung Tài liệu đính kèm <Info size={14} className="text-white/20" />
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
                className="flex items-center gap-2 px-3.5 py-2 bg-white/10 hover:bg-white/20 rounded-xl text-xs font-bold cursor-pointer transition-all border border-white/10"
              >
                {isReading ? <Loader2 size={14} className="animate-spin" /> : <FileUp size={14} />} Tải file .docx
              </label>
            </div>
          </div>
          
          <div className="space-y-2">
            <textarea
              value={project.extraContext}
              onChange={(e) => updateProject({ extraContext: e.target.value })}
              placeholder="Dán nội dung chi tiết truyện thô, ghi chú phác thảo hoặc tài liệu sáng tác tại đây để AI phân tích..."
              className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none text-sm leading-relaxed"
            />
            <p className="text-[10px] text-white/30 italic">Mẹo: Bạn có thể tải file Microsoft Word (.docx) ở trên hoặc gõ tay trực tiếp nội dung tư liệu của mình.</p>
          </div>
        </div>

        {/* KHUNG BỔ SUNG TÀI NGUYÊN (NẰM DƯỚI TÀI LIỆU ĐÍNH KÈM) */}
        <div className="space-y-3 pb-4">
          <div className="flex items-center justify-between flex-wrap gap-2">
            <label className="text-sm font-medium text-white/80 font-mono uppercase tracking-wider flex items-center gap-2">
              <Layers size={16} className="text-orange-500" /> Bổ Sung Tài nguyên
            </label>
            
            <button
              type="button"
              onClick={handleEnrichIdea}
              disabled={isEnriching || !project.extraContext?.trim()}
              className="flex items-center gap-1.5 px-4 py-2 bg-gradient-to-r from-orange-500 via-amber-500 to-orange-600 hover:opacity-95 text-black rounded-xl text-xs font-black transition-all disabled:opacity-30 disabled:pointer-events-none shadow-lg shadow-orange-500/10 active:scale-95 duration-200"
            >
              {isEnriching ? (
                <Loader2 size={13} className="animate-spin" />
              ) : (
                <Sparkles size={13} />
              )}
              {isEnriching ? 'Đang đọc tài liệu & bổ sung tình tiết...' : 'AI Phân Tích & Bổ Sung Tình Tiết'}
            </button>
          </div>

          <textarea
            value={project.initialIdea}
            onChange={(e) => updateProject({ initialIdea: e.target.value })}
            placeholder="Nội dung cốt truyện bổ sung ý tưởng chính sẽ hiển thị tại đây khi AI đọc xong 'Tài liệu đính kèm', hoặc bạn có thể tự do nhập bổ sung ý tưởng tùy ý..."
            className="w-full h-40 bg-white/5 border border-white/10 rounded-2xl p-4 text-white placeholder:text-white/20 focus:outline-none focus:ring-2 focus:ring-orange-500/50 transition-all resize-none text-sm leading-relaxed"
          />
          <p className="text-[10px] text-white/30 italic">
            * Sau khi nhập "Tài liệu đính kèm", click nút phía trên để AI tự động trích lọc và phát triển ý tưởng bổ sung kịch tính hoàn thiện cho bạn nhé.
          </p>
        </div>

        {/* THIẾT LẬP NHÂN VẬT TRONG KỊCH BẢN */}
        <div className="border-t border-white/5 pt-6 space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h4 className="text-sm font-semibold text-white/80 flex items-center gap-2">
                <User size={16} className="text-orange-500" /> THIẾT LẬP NHÂN VẬT / CHARACTERS
              </h4>
              <p className="text-[11px] text-white/40">
                Nhấp chuột vào bất cứ thẻ nhân vật nào bên dưới để sửa nhanh tên, vai trò và thông tin chi tiết
              </p>
            </div>
            
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={handleAutoSuggestCharacters}
                disabled={isSuggesting || !project.initialIdea}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-orange-500/10 hover:bg-orange-500 text-orange-400 hover:text-black border border-orange-500/20 rounded-xl text-xs font-bold transition-all disabled:opacity-50"
              >
                {isSuggesting ? (
                  <Loader2 size={13} className="animate-spin" />
                ) : (
                  <Sparkles size={13} />
                )}
                {isSuggesting ? 'Đang gợi ý...' : 'AI đề xuất nhân vật'}
              </button>

              <button
                type="button"
                onClick={() => setIsAddingManually(!isAddingManually)}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 text-white rounded-xl text-xs font-bold transition-all"
              >
                <Plus size={13} /> {isAddingManually ? 'Đóng' : 'Thêm thủ công'}
              </button>
            </div>
          </div>

          {/* Form thêm nhân vật thủ công */}
          {isAddingManually && (
            <form onSubmit={handleAddCharacter} className="bg-white/[0.02] border border-white/5 p-4 rounded-2xl space-y-3">
              <div className="grid sm:grid-cols-2 gap-3">
                <div className="space-y-1">
                  <label className="text-[11px] text-white/50 font-medium font-mono">Tên nhân vật (Ví dụ: AN, ÔNG TÁM)</label>
                  <input
                    type="text"
                    required
                    value={newCharName}
                    onChange={(e) => setNewCharName(e.target.value)}
                    placeholder="MẸ AN, AN, ÔNG TÁM,..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-[11px] text-white/50 font-medium font-mono">Vai trò (Ví dụ: Nhân vật chính, Kẻ ác)</label>
                  <input
                    type="text"
                    value={newCharRole}
                    onChange={(e) => setNewCharRole(e.target.value)}
                    placeholder="Nhân vật chính, Người cha, Thám tử..."
                    className="w-full bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                  />
                </div>
              </div>

              <div className="space-y-1">
                <label className="text-[11px] text-white/50 font-medium font-mono">Tính cách, hoàn cảnh, phong cách hành động</label>
                <textarea
                  value={newCharDesc}
                  onChange={(e) => setNewCharDesc(e.target.value)}
                  placeholder="Người hay nói mỉa mai, cổ hủ, hay cấm đoán hoặc là thanh niên nhiệt huyết..."
                  className="w-full h-16 bg-white/5 border border-white/10 rounded-xl p-2.5 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none"
                />
              </div>

              <div className="flex justify-end">
                <button
                  type="submit"
                  className="px-4 py-2 bg-orange-500 hover:bg-orange-600 font-bold text-black rounded-xl text-xs transition-all flex items-center gap-1"
                >
                  <Plus size={13} /> Thêm vào kịch bản
                </button>
              </div>
            </form>
          )}

          {/* Danh sách nhân vật hiện tại */}
          {characters.length === 0 ? (
            <div className="border border-dashed border-white/10 rounded-2xl p-6 text-center text-white/30 text-xs">
              Mẹo: Chưa có nhân vật nào được thiết lập. Bạn có thể nhấn "AI đề xuất nhân vật" để AI phân tích cốt truyện tự khởi tạo các gương mặt kịch tính, hoặc bấm "Thêm thủ công" nhé!
            </div>
          ) : (
            <div className="grid sm:grid-cols-2 gap-3 max-h-[400px] overflow-y-auto custom-scrollbar pr-1">
              {characters.map((char) => {
                if (editingCharId === char.id) {
                  return (
                    <div
                      key={char.id}
                      className="col-span-1 sm:col-span-2 bg-orange-500/5 border border-orange-500/30 rounded-2xl p-4 space-y-3 transition-all"
                    >
                      <div className="flex items-center justify-between border-b border-white/5 pb-2">
                        <span className="text-[10px] font-bold text-orange-400 font-mono">CHỈNH SỬA THÔNG TIN NHÂN VẬT</span>
                        <button
                          type="button"
                          onClick={() => setEditingCharId(null)}
                          className="text-white/40 hover:text-white text-xs"
                        >
                          Hủy
                        </button>
                      </div>

                      <div className="grid sm:grid-cols-2 gap-3">
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/50 font-medium font-mono">Tên nhân vật</label>
                          <input
                            type="text"
                            required
                            value={editCharName}
                            onChange={(e) => setEditCharName(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white uppercase focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                          />
                        </div>
                        <div className="space-y-1">
                          <label className="text-[10px] text-white/50 font-medium font-mono">Vai trò</label>
                          <input
                            type="text"
                            value={editCharRole}
                            onChange={(e) => setEditCharRole(e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50"
                          />
                        </div>
                      </div>

                      <div className="space-y-1">
                        <label className="text-[10px] text-white/50 font-medium font-mono">Tính cách, hoàn cảnh, phong cách hành động</label>
                        <textarea
                          value={editCharDesc}
                          onChange={(e) => setEditCharDesc(e.target.value)}
                          className="w-full h-16 bg-white/5 border border-white/10 rounded-xl p-2 text-xs text-white focus:outline-none focus:ring-1 focus:ring-orange-500/50 resize-none"
                        />
                      </div>

                      <div className="flex justify-end gap-2 text-xs">
                        <button
                          type="button"
                          onClick={() => setEditingCharId(null)}
                          className="px-3 py-1.5 bg-white/5 hover:bg-white/10 rounded-lg text-white font-medium"
                        >
                          Hủy
                        </button>
                        <button
                          type="button"
                          onClick={() => handleSaveEdit(char.id)}
                          className="px-3 py-1.5 bg-orange-500 hover:bg-orange-600 rounded-lg text-black font-bold animate-pulse"
                        >
                          Lưu thay đổi
                        </button>
                      </div>
                    </div>
                  );
                }

                return (
                  <div
                    key={char.id}
                    onClick={() => handleStartEdit(char)}
                    className="bg-white/5 border border-white/10 hover:border-orange-500/50 hover:bg-white/[0.08] cursor-pointer rounded-2xl p-4 flex items-start justify-between gap-4 group transition-all"
                    title="Nhấp vào để chỉnh sửa thông tin"
                  >
                    <div className="space-y-1 min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-xs font-bold font-mono tracking-wider text-orange-400 uppercase truncate">
                          {char.name}
                        </span>
                        <span className="text-[9px] bg-white/5 uppercase font-mono px-1.5 py-0.5 rounded text-white/50 border border-white/5 truncate">
                          {char.role}
                        </span>
                      </div>
                      <p className="text-[10px] text-white/55 leading-normal line-clamp-2">
                        {char.description || 'Không có mô tả chi tiết.'}
                      </p>
                    </div>

                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        handleRemoveCharacter(char.id);
                      }}
                      className="text-white/20 hover:text-red-400 p-1 rounded-lg hover:bg-red-500/10 transition-all opacity-0 group-hover:opacity-100 shrink-0"
                      title="Xoá nhân vật"
                    >
                      <Trash2 size={13} />
                    </button>
                  </div>
                );
              })}
            </div>
          )}
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
