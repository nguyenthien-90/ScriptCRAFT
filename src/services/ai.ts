import { GoogleGenAI, Type } from "@google/genai";
import { Genre, ClarificationQuestion, StoryBranch, ScriptAct, Character } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateClarificationQuestions(genre: Genre, idea: string, duration: number, extraContext?: string): Promise<ClarificationQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `You are a professional script consultant. Based on this idea for a ${duration} minute ${genre} film, generate 3-4 specific clarification questions in Vietnamese to help refine the plot. Each question should have 3 distinct options for the user to choose from.
    Idea: ${idea}
    Additional Context: ${extraContext || "None"}
    
    CRITICAL: The questions and options must be highly specific to and representative of the chosen film genre: "${genre}".
    For example:
    - If Comedy: Include choices that raise hilarious stakes or comic misunderstandings.
    - If Religion: Focus on moral conflict, faith questioning, or spiritual crises.
    - If History: Focus on historical fidelity, era settings, customs of the time.
    - If Action: Focus on high stakes, combat styles, core physical threats or chases.
    - If Animation: Focus on visual magic rules, talking objects, fantasy logic, stylized/imaginative settings, and playful tone.
    - If Drama: Deepen emotional or psychological mâu thuẫn, realistic struggles.
    - If Romance: Focus on the chemistry, obstacles between lovers, and sentimental vibes.
    
    IMPORTANT: Return the questions and options in Vietnamese (Tiếng Việt).
    Return the result in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            question: { type: Type.STRING },
            options: { type: Type.ARRAY, items: { type: Type.STRING } }
          },
          required: ["id", "question", "options"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateStoryBranches(genre: Genre, idea: string, answers: Record<string, string>): Promise<StoryBranch[]> {
  const answersText = Object.entries(answers).map(([q, a]) => `Q: ${q}, A: ${a}`).join('\n');
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Based on the initial idea, the chosen genre "${genre}", and the user's choices, generate 3 distinct story directions (branches) in Vietnamese. Each should have a title and a 3-4 sentence description.
    Original Idea: ${idea}
    Genre: ${genre}
    User Choices:
    ${answersText}
    
    CRITICAL: Each story branch MUST heavily feature core genre elements:
    - For "Religion" (Phim tôn giáo): Introduce themes of temple, cathedral, monk/priest, spiritual devotion, inner faith struggle, sacred artifacts, or philosophical devotion/enlightenment.
    - For "History" (Phim lịch sử): Highlight historical backdrops, costumes, ancient political rivalries, royal settings, or authentic Vietnamese/world epoch dynamics.
    - For "Animation" (Phim hoạt hình): Frame full of creative whim, wonder, magical creatures, colorful personified items, and highly stylized imaginative bối cảnh.
    - For "Comedy" (Phim hài): Emphasize humor, ridiculous setups, witty banter, and situational irony.
    - For "Action" (Phim hành động): Highlight suspense, chase sequences, combat choreography, explosive action, epic confrontation, or heroic acts.
    - For "Drama" (Phim chính kịch (tâm lý)): Build heavy emotional conflict, family drama, psychological depth, and complex realistic dialogue.
    - For "Romance" (Phim lãng mạn): Lean onto poetic love, beautiful settings, and emotional attachment.
    - For "Fantasy" (Phim giả tưởng (kỳ ảo)): Introduce magical rules, legendary monsters, spells, and mythical settings.
    - For "Documentary" (Phim tài liệu): Center on realistic investigation, real-world issues, interviews, and informational integrity.
    
    IMPORTANT: Return titles and descriptions in Vietnamese (Tiếng Việt).
    Return in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            id: { type: Type.STRING },
            title: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["id", "title", "description"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateScriptStructure(genre: Genre, idea: string, selectedBranch: StoryBranch): Promise<ScriptAct[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Divide the following story direction into a standard 3-act structure with exactly 6 major plot points (2 per act).
    Story Direction: ${selectedBranch.title} - ${selectedBranch.description}
    Genre: ${genre}
    
    CRITICAL: The dramatic beats, plot points and transitions must be fully customized to the nature of the selected genre "${genre}".
    - If History/Religion: Act titles and plot points must match monumental historical battles, trials of faith, pilgrimages, historic milestones, or moral/philosophical testings.
    - If Comedy/Romance: Beats should follow comedic build-up, cute meet-ups, dramatic secrets, hilarious failures, and warm resolutions.
    - If Action/Fantasy: Act I hook, rising physical stakes, Act II climax/major fight, absolute low point, and epic final battle.
    - If Animation: Exaggerated magical inciting incidents, wondrous exploration, heartwarming climax with friendly lessons.
    
    IMPORTANT: Return all act titles, act descriptions, plot point titles, and plot point descriptions in Vietnamese (Tiếng Việt).
    Return in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Act Title (e.g. Act I: Setup)" },
            description: { type: Type.STRING },
            plotPoints: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  id: { type: Type.STRING },
                  title: { type: Type.STRING },
                  description: { type: Type.STRING }
                },
                required: ["id", "title", "description"]
              }
            }
          },
          required: ["title", "description", "plotPoints"]
        }
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateVietnameseSegmentDraft(
  segmentTitle: string,
  context: string,
  targetDurationSec: number,
  characters?: Character[],
  genre?: Genre
): Promise<string> {
  const charactersPrompt = characters && characters.length > 0
    ? `\nDANH SÁCH CÁC NHÂN VẬT QUAN TRỌNG TRONG TRUYỆN (Bắt buộc phải sử dụng đúng tên này khi có thoại của họ và bộc lộ đúng tính cách):\n${characters.map(c => `- Tên: ${c.name} (${c.role}): ${c.description}`).join('\n')}
    
    LƯU Ý ĐẶC BIỆT VỀ NHÂN VẬT PHỤ/QUẦN CHÚNG: Ngoài danh sách nhân vật chuẩn ở trên, bạn hoàn toàn có TOÀN QUYỀN tự sáng tạo, bổ sung thêm các nhân vật phụ khác như (người bán hàng, người đi đường, bảo vệ, tài xế, bồi bàn,...) để bối cảnh và lời thoại phân đoạn thêm phần sinh động, hấp dẫn và tự nhiên.\n`
    : `\nLƯU Ý ĐẶC BIỆT VỀ NHÂN VẬT PHỤ/QUẦN CHÚNG: Bạn hoàn toàn có TOÀN QUYỀN tự sáng tạo, bổ sụng và đưa vào các nhân vật phụ, nhân vật quần chúng (người đi đường, kẻ bán hàng, người lái xe,...) có liên quan để phân đoạn kịch bản thêm phần phong phú và sinh động.\n`;

  const genrePrompt = genre
    ? `\nTHỂ LOẠI PHIM ĐÃ CHỌN: "${genre}".
    BẮT BUỘC: Toàn bộ từ ngữ, lời thoại, hành động, bối cảnh, mô tả và âm hưởng của phân đoạn này phải phản ánh đậm nét đặc thù của thể loại "${genre}".
    - Nếu là Tôn giáo ("Religion"): Phải thể hiện không khí tầm linh, tâm lý mộ đạo đạo đức, không gian trang nghiêm cổ kính hoặc bối cảnh chùa chiền/nhà thờ/thánh đường thiêng liêng, lời thoại sâu sắc mang tính trăn trở về đức tin, ý chí tâm hồn hoặc bài học giác ngộ.
    - Nếu là Lịch sử ("History"): Phải sử dụng ngôn từ bối cảnh xưa cổ, lịch sự hoặc mang phong thái xưng hô xa xưa hào hùng (ví dụ: khanh, trẫm, tiên sinh, lão nhân, tiểu bối hoặc xưng hô chuẩn truyền thống dân gian cố cựu), bối cảnh bộc lộ dấu ấn thời đại hào hùng hoặc cổ kính xưa cũ.
    - Nếu là Hoạt hình ("Animation"): Hãy miêu tả các chuyển cảnh sinh động, giàu hình ảnh sáng tạo đột phá, nhân hoá đồ vật/con vật nếu cần, giọng điệu vui nhộn nhẹ nhàng kỳ ảo, bối cảnh lung linh nhiệm màu hoặc hài hước ngộ nghĩnh phù hợp gia đình trẻ nhỏ.
    - Nếu là Hành động ("Action"): Tiết tấu dồn dập, căng thẳng kịch tính, thoại dứt khoát sắc bén, lồng ghép nhiều mô tả hành động rượt đuổi, thế võ nguy hiểm hoặc kịch chiến gay cấn nghẹt thở.
    - Nếu là Hài hước ("Comedy"): Lời thoại dí dỏm sâu sắc, tạo tiếng cười tự nhiên, có những phản ứng tréo ngoe bất ngờ oái oăm của các nhân vật tạo tiếng cười.
    - Nếu là Chính kịch ("Drama"): Đi sâu vào mâu thuẫn nhân sinh hoặc gia đình khốc liệt, nội tâm nhân vật giằng xé phức tạp, lời thoại mang tính bộc bạch nặng trĩu chiều sâu cảm xúc.
    - Nếu là Lãng mạn ("Romance"): Từ ngữ lãng mạn nên thơ, bay bổng, các tương tác đầy chemistry ngọt ngào hay xao xuyến rạo rực tình cảm nam nữ.`
    : '';

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Bạn là một nhà biên kịch phim điện ảnh chuyên nghiệp. Hãy viết một phân đoạn kịch bản chi tiết bằng tiếng Việt cho phân đoạn sau dựa trên ngữ cảnh được cung cấp.
    
    Tên phân đoạn: ${segmentTitle}
    Ngữ cảnh câu chuyện diễn ra: ${context}
    Thời lượng mục tiêu đối thoại ước tính cho phân đoạn này: khoảng ${targetDurationSec} giây.
    ${genrePrompt}
    ${charactersPrompt}
    
    YÊU CẦU ĐỊNH DẠNG (CỰC KỲ QUAN TRỌNG):
    1. Viết kịch bản bằng Tiếng Việt theo định dạng chuẩn kịch bản điện ảnh:
       - Tên Cảnh/Phân cảnh (SCENE HEADING) viết IN HOA (ví dụ: CẢNH 1: BÊN TRONG CĂN NHÀ - BAN ĐÊM)
       - Mô tả hành động/bối cảnh (Action) viết bình thường.
       - Tên nhân vật viết IN HOA ở giữa dòng trước khi nói.
       - Lời thoại đối thoại của nhân vật được bọc hoàn toàn bởi dấu ngoặc vuông [...] và đính kèm số giây nói thực tế ước lượng ở cuối, theo cấu trúc: [ Lời thoại (số_giây_nói_thực_tếs) ]
       
    HÃY XEM VÍ DỤ SÁNG TÁC MẪU SAU ĐỂ LÀM THEO ĐÚNG 100% định dạng:
    
    CẢNH 1: NHÀ ÔNG TÁM - BAN NGÀY
    Căn phòng tối tăm hắt lên mùi thuốc lào nồng nặc. Ông Tám khẽ liếc nhìn An.
    
    ÔNG TÁM
    (Mỉa mai)
    [ Mày lại định đi cái lễ đó à? Đã bảo là mê muội rồi mà không nghe! Cả làng này chẳng ai rảnh rỗi như mày (10s) ]
    
    AN
    (Kiên quyết)
    [ Nhưng đây là cơ hội duy nhất để con tìm lại em. Con không thể rút lui lúc này! (5s) ]

    2. Tính toán số giây thực tế hợp lý dựa trên độ dài lời thoại (Ví dụ: tốc độ nói tự nhiên khoảng 2 đến 2.5 từ mỗi giây). Lời nói ngắn ước lượng 2s-5s, lời thoại dài hơn ước lượng 10s-15s.
    3. Tránh viết số giây vô lý. Phân đoạn cần có ít nhất 4-8 lời thoại được định dạng bọc ngoặc vuông [ ... (Xs) ] như mẫu trên để thể hiện nội dung đối thoại phong phú. Nếu danh sách nhân vật được cung cấp ở trên, hãy đưa các nhân vật đó xuất hiện và trò chuyện trong phân đoạn.
    
    Hãy viết một kịch bản thật hay, có chiều sâu tâm lý nhân vật, kịch tính và ý nghĩa.`,
    config: {
      temperature: 0.7,
    }
  });

  return response.text;
}

export async function generateSegmentDraft(
  segmentTitle: string,
  context: string,
  characters?: Character[],
  genre?: Genre
): Promise<{ vi: string, en: string, zh: string }> {
  const charactersPrompt = characters && characters.length > 0
    ? `\nMAIN CHARACTERS LIST (Use these names for their dialogues and reflect their behaviors):\n${characters.map(c => `- Name: ${c.name} (${c.role}): ${c.description}`).join('\n')}
    
    SPECIAL RULE ON BACKGROUND CHARACTERS: You are fully authorized and encouraged to dynamically create and introduce any supporting characters, background roles, shopkeepers, bypassers, guards, drivers, etc., to make the scene more alive and natural!\n`
    : `\nSPECIAL RULE ON BACKGROUND CHARACTERS: You are fully authorized and encouraged to dynamically create and introduce supporting characters (e.g., vendors, passengers, shopkeepers, bystanders) to make the screenplay segment more natural and vivid!\n`;

  const genrePrompt = genre
    ? `\nCHOSEN FILM GENRE: "${genre}".
    Make sure the dialogue style, action descriptors, setting atmosphere, and tone strongly match the unique characteristics of the "${genre}" genre in all languages.`
    : '';

  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Write a first draft for the following screenplay segment in THREE languages: Vietnamese, English, and Chinese (Simplified).
    Segment: ${segmentTitle}
    Full Context: ${context}
    ${genrePrompt}
    ${charactersPrompt}
    
    Write in standard screenplay format (SCENE HEADING, Action, Character, Dialogue).
    Ensure the translation is consistent across all three versions.
    Return the result in JSON format with keys "vi", "en", and "zh".`,
    config: {
      temperature: 0.7,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vi: { type: Type.STRING },
          en: { type: Type.STRING },
          zh: { type: Type.STRING }
        },
        required: ["vi", "en", "zh"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function syncTranslations(baseContent: string, fromLang: string): Promise<{ vi: string, en: string, zh: string }> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `The user has updated the ${fromLang} version of a screenplay segment. Please update the other two languages to perfectly match the new content, tone, and details of this version.
    
    Updated ${fromLang} Content:
    ${baseContent}

    Return the complete updated segment for all three languages (Vietnamese, English, Chinese Simplified) in JSON format with keys "vi", "en", and "zh".`,
    config: {
      temperature: 0.3,
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.OBJECT,
        properties: {
          vi: { type: Type.STRING },
          en: { type: Type.STRING },
          zh: { type: Type.STRING }
        },
        required: ["vi", "en", "zh"]
      }
    }
  });

  return JSON.parse(response.text);
}

export async function generateSuggestedCharacters(genre: Genre, idea: string, extraContext: string): Promise<Character[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Dựa vào thể loại phim "${genre}", tóm tắt cốt truyện chính: "${idea}" và toàn bộ ngữ cảnh đi kèm: "${extraContext}", hãy đề xuất từ 2 đến 4 nhân vật chính & phụ quan trọng nhất cho bộ kịch bản này.
    
    YÊU CẦU ĐẶC BIỆT THEO THỂ LOẠI PHIM "${genre}":
    Hãy thiết kế các nhân vật mang bản sắc sắc sảo, đúng tính chất của thể loại này:
    - Nếu là Tôn giáo ("Religion"): Hãy gợi ý các nhân vật có sự đấu tranh mãnh liệt về đức tin, linh mục, tăng ni, tín đồ trung kiên hoặc kẻ mang hoài nghi tâm linh dằn vặt.
    - Nếu là Lịch sử ("History"): Nhân vật phải phù hợp với bối cảnh lịch sử thời đại tương ứng (triều đình, chiến tướng, bá tánh khổ cực, các nhà hiền triết thời xưa).
    - Nếu là Hoạt hình ("Animation"): Cho phép gợi ý các nhân vật đáng yêu, kỳ ảo, hoặc sinh vật biết nói, đồ vật nhân hóa ngộ nghĩnh mang các siêu năng lực ngây ngô.
    - Nếu là Hành động ("Action"): Những nhân vật gai góc quyết đoán, sát thủ giấu mặt, cảnh sát mưu trí hoặc kẻ mang nợ máu nợ thù hành động dứt khoát.
    - Nếu là Hài hước ("Comedy"): Nhân vật dí dỏm lập dị, hay gặp xui xẻo hoặc có thói quen ngớ ngẩn gây cười một cách đáng yêu.
    - Nếu là Chính kịch ("Drama") / Lãng mạn ("Romance"): Những nhân vật có nội tâm sâu sắc, dễ tổn thương hoặc mang những u uất, khao khát tình cảm, giằng xé giữa các lựa chọn lý trí và trái tim.

    Mỗi nhân vật đề xuất cần có:
    - tên (name) viết IN HOA không dấu hoặc có dấu tiếng Việt (ví dụ: ÔNG TÁM, AN, QUỲNH)
    - vai trò (role) viết ngắn gọn (ví dụ: Nhân vật chính, Nhân vật phản diện, Người đồng hành, Người mẹ, v.v.)
    - mô tả tính cách & ngoại hình (description) bằng tiếng Việt cực kỳ súc tích.

    Hãy trả về cấu trúc mảng JSON các đối tượng nhân vật.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            name: { type: Type.STRING },
            role: { type: Type.STRING },
            description: { type: Type.STRING }
          },
          required: ["name", "role", "description"]
        }
      }
    }
  });

  const parsed = JSON.parse(response.text);
  return parsed.map((c: any) => ({
    id: crypto.randomUUID(),
    name: (c.name || '').toUpperCase().trim(),
    role: c.role || 'Nhân vật phụ',
    description: c.description || ''
  }));
}
