import { GoogleGenAI, Type } from "@google/genai";
import { Genre, ClarificationQuestion, StoryBranch, ScriptAct, Character, ProjectState } from "../types";

const ai = new GoogleGenAI({ apiKey: process.env.GEMINI_API_KEY });

export async function generateClarificationQuestions(genre: Genre, idea: string, duration: number, extraContext?: string): Promise<ClarificationQuestion[]> {
  const response = await ai.models.generateContent({
    model: "gemini-3-flash-preview",
    contents: `Bạn là một chuyên gia cố vấn và biên kịch phim điện ảnh kỳ cựu. Hãy phân tích kỹ lưỡng Thể loại phim "${genre}", Tóm tắt ý tưởng kịch bản chính: "${idea}" cùng bất kỳ tài liệu nào được đệ trình thêm như sau:
    TÀI LIỆU ĐÍNH KÈM / TƯ LIỆU SÁNG TÁC GỐC ĐẦU VÀO:
    "${extraContext || "Không có"}"

    Nhiệm vụ: Hãy thiết lập danh sách các câu hỏi làm rõ chi tiết (Clarification Questions) bằng Tiếng Việt.
    
    YÊU CẦU QUAN TRỌNG VỀ SỐ LƯỢNG CÂU HỎI (TỪ 4 ĐẾN 10 CÂU HỎI):
    - Số lượng câu hỏi phải được quyết định linh hoạt tùy theo độ dày và độ đồ sộ từ thông tin "Tài liệu đính kèm" và "Ý tưởng chính":
      + Nếu Tài liệu đính kèm và ý tưởng ban đầu chứa rất nhiều chi tiết, sự kiện, thông điệp hoặc có nhiều nút thắt cần mổ xẻ sâu sắc, hãy đặt một danh sách câu hỏi cực kỳ phong phú và tỉ mỉ từ 6 đến 10 câu hỏi (tối đa 10) để giải đáp đầy đủ ngõ ngách kịch tính.
      + Nếu thông tin còn ở mức độ cơ bản hoặc ngắn, hãy tạo tối thiểu 4 câu hỏi chất lượng.
    
    YÊU CẦU NỘI DUNG VỚI MỖI CÂU HỎI:
    - Mỗi câu hỏi phải thực sự cụ thể, đi thẳng vào các mắt xích kịch tính, cách xử lý bối cảnh hoặc cách liên kết các chất liệu thô của phim.
    - Cung cấp chính xác 3 phương án trả lời trắc nghiệm (options) cực kỳ sáng tạo, bất ngờ và kích thích tư duy thiết kế, mang đậm đặc trưng rõ rệt của Thể loại phim "${genre}":
      + Phim tôn giáo ("Religion"): Liên quan đến sự quy phục tín ngưỡng, đấu tranh đức tin tôn giáo, tính thiện ác nội tâm, sự trả giá hoặc bí mật thiêng liêng.
      + Phim lịch sử ("History"): Xoay quanh biến cố thời cuộc, thời đại bối cảnh thực tại xưa cổ, phong thái lễ nghi triều đại, hào khí hoặc sự hy sinh vì dòng tộc, bờ cõi nước nhà.
      + Phim hoạt hình ("Animation"): Sáng tạo bay bổng, phép thuật nhiệm màu, thế giới kỳ vĩ, quy luật thần tiên lý thú, nhân cách hóa sống động, vui tươi dí dỏm.
      + Phim hành động ("Action"): Nút thắt sống còn kẻ thù giấu mặt, vũ khí, các pha rượt đuổi nghẹt thở, ranh giới sinh tử, mâu thuẫn báo thù hoặc bảo vệ chính nghĩa.
      + Phim hài ("Comedy"): Tréo ngoe dở khóc dở cười, hiểu lầm tai hại, tình huống oái oăm tạo tiếng cười sảng khoái và tự nhiên.
      + Phim lãng mạn ("Romance") / Chính kịch ("Drama"): Những dằn vặt sâu trong thâm tâm, bức tường ngăn cản tình cảm đôi lứa, mâu thuẫn lý trí cá nhân bền bỉ.

    Hãy trả về mảng kết quả JSON bằng Tiếng Việt theo schema có sẵn cực kỳ chính xác.`,
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
    contents: `Divide the following story direction into a standard, pure 3-act structure (exactly 3 Acts total - Act I: Setup / Khởi đầu, Act II: Confrontation / Cao trào phát triển, Act III: Resolution / Giải quyết kết thúc).
    Story Direction: ${selectedBranch.title} - ${selectedBranch.description}
    Genre: ${genre}
    
    CRITICAL: The dramatic beats, act titles, and act descriptions must be fully customized to the nature of the selected genre "${genre}".
    - If History/Religion: Act titles and descriptions must match monumental historical battles, trials of faith, pilgrimages, historic milestones, or moral/philosophical testings.
    - If Comedy/Romance: Beats should follow comedic build-up, cute meet-ups, dramatic secrets, hilarious failures, and warm resolutions.
    - If Action/Fantasy: Act I hook, rising physical stakes, Act II climax/major fight, absolute low point, and epic final battle.
    - If Animation: Exaggerated magical inciting incidents, wondrous exploration, heartwarming climax with friendly lessons.
    - If Drama: Build realistic emotional build-up, a powerful mid-point conflict, heavy moral options, and cathartic resolution.
    
    IMPORTANT: Provide deep and detailed descriptions for each Act (representing the entire narrative flow of that act) in Vietnamese (Tiếng Việt).
    Do NOT split into nested plot points (set "plotPoints" to an empty array [] in the JSON output).
    Return in JSON format.`,
    config: {
      responseMimeType: "application/json",
      responseSchema: {
        type: Type.ARRAY,
        items: {
          type: Type.OBJECT,
          properties: {
            title: { type: Type.STRING, description: "Act Title (e.g. Hồi I: Khởi đầu - Setup)" },
            description: { type: Type.STRING, description: "Detailed description of everything that happens in this Act" },
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

export async function generateFullScreenplayDraft(
  project: ProjectState
): Promise<string> {
  const selectedBranch = project.branches.find(b => b.id === project.selectedBranchId);
  const branchTitle = selectedBranch?.title || 'Chưa chọn nhánh';
  const branchDesc = selectedBranch?.description || '';

  const charactersPrompt = project.characters && project.characters.length > 0
    ? `\nDANH SÁCH NHÂN VẬT THIẾT LẬP:\n${project.characters.map(c => `- Tên: ${c.name} (${c.role}): ${c.description}`).join('\n')}\n`
    : '';

  const qaPrompt = project.questions && project.questions.length > 0
    ? `\nKẾT QUẢ ĐỐI THOẠI LÀM RÕ Ý TƯỞNG (Clarification Q&As):\n${project.questions.map(q => {
        const answer = project.answers[q.id];
        return `- Câu hỏi: ${q.question}\n  -> Ý kiến của biên kịch đã chọn: "${answer || 'Không phản hồi'}"`;
      }).join('\n')}\n`
    : '';

  const resourcePrompt = project.extraContext && project.extraContext.trim().length > 0
    ? `\nTÀI LIỆU ĐÍNH KÈM / TƯ LIỆU SÁNG TÁC GỐC ĐẦU VÀO:\n"${project.extraContext.trim()}"\n`
    : '';

  const genreDetailsPrompt = `
  THỂ LOẠI PHIM ĐÃ CHỌN: "${project.genre}".
  Yêu cầu bộc lộ rõ ràng tinh thần của thể loại này:
  - Nếu là Tôn giáo ("Religion"): Phải thể hiện không khí tâm linh, tâm lý mộ đạo đạo đức, không gian trang nghiêm cổ kính hoặc bối cảnh chùa chiền/nhà thờ/thánh đường thiêng liêng, lời thoại sâu sắc mang tính trăn trở về đức tin, ý chí tâm hồn hoặc bài học giác ngộ.
  - Nếu là Lịch sử ("History"): Phải sử dụng ngôn từ bối cảnh xưa cổ, lịch sự hoặc mang phong thái xưng hô xa xưa hào hùng (ví dụ: khanh, trẫm, tiên sinh, lão nhân, tiểu bối hoặc xưng hô chuẩn truyền thống dân gian cố cựu), bối cảnh bộc lộ dấu ấn thời đại hào hùng hoặc cổ kính xưa cũ.
  - Nếu là Hoạt hình ("Animation"): Hãy miêu tả các chuyển cảnh sinh động, giàu hình ảnh sáng tạo đột phá, nhân hoá đồ vật/con vật nếu cần, giọng điệu vui nhộn nhẹ nhàng kỳ ảo, bối cảnh lung linh nhiệm màu hoặc hài hước ngộ nghĩnh phù hợp gia đình trẻ nhỏ.
  - Nếu là Hành động ("Action"): Tiết tấu dồn dập, căng thẳng kịch tính, thoại dứt khoát sắc bén, lồng ghép nhiều mô tả hành động rượt đuổi, thế võ nguy hiểm hoặc kịch chiến gay cấn nghẹt thở.
  - Nếu là Hài hước ("Comedy"): Lời thoại dí dỏm sâu sắc, tạo tiếng cười tự nhiên, có những phản ứng tréo ngoe bất ngờ oái oăm của các nhân vật tạo tiếng cười.
  - Nếu là Chính kịch ("Drama"): Đi sâu vào mâu thuẫn nhân sinh hoặc gia đình khốc liệt, nội tâm nhân vật giằng xé phức tạp, lời thoại mang tính bộc bạch nặng trĩu chiều sâu cảm xúc.
  - Nếu là Lãng mạn ("Romance"): Từ ngữ lãng mạn nên thơ, bay bổng, các tương tác đầy chemistry ngọt ngào hay xao xuyến rạo rực tình cảm nam nữ.`;

  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Bạn là một nhà biên kịch phim điện ảnh đoạt giải Oscar bách chiến bách thắng. Hãy viết kịch bản hội thoại đầy đủ, LIÊN TỤC VÀ HOÀN CHỈNH TỪ ĐẦU ĐẾN CUỐI (không chia đoạn rải rác) cho bộ phim điện ảnh "${project.title}" thuộc thể loại "${project.genre}".

BẮT BUỘC: Bạn phải lồng ghép, bám sát và phát triển đầy đủ tất cả tình tiết chi tiết nhất có thể dựa trên toàn bộ các tài nguyên, chuẩn bị thiết lập và hồ sơ đầu vào dưới đây:

1. TÀI LIỆU ĐÍNH KÈM / TƯ LIỆU SÁNG TÁC GỐC ĐẦU VÀO:
${resourcePrompt || "(Không có tài liệu đính kèm)"}

2. Ý TƯỞNG CỐT TRUYỆN CHÍNH (BỔ SUNG TÀI NGUYÊN):
"${project.initialIdea}"

3. KẾT QUẢ ĐỒNG THUẬN TỪ BƯỚC KHẢO SÁT/LÀM RÕ:
${qaPrompt || "(Không có thông tin làm rõ)"}

4. HƯỚNG PHÁT TRIỂN NGHỆ THUẬT (STORY BRANCH / STORY DIRECTIONS):
- Tiêu đề hướng đi: "${branchTitle}"
- Mô tả chi tiết: "${branchDesc}"

5. CẤU TRÚC 3 HỒI BẤT BIẾN (Do biên kịch tinh chỉnh):
${project.acts.map((act, index) => `Hồi ${index + 1}: ${act.title}\nChi tiết diễn biến chính của Hồi: ${act.description}`).join('\n\n')}

6. THIẾT LẬP NHÂN VẬT CHÍNH (CHARACTERS & PROFILES):
${charactersPrompt || "(Không có thiết lập nhân vật cụ thể)"}

Thời lượng phim ước lượng: ${project.duration} phút (Ước tính đối thoại tương đương khoảng ${(project.duration * 60) * 0.4} giây thoại thực tế).
${genreDetailsPrompt}

LƯU Ý ĐẶC BIỆT VỀ QUẦN CHÚNG & NHẤN MẠNH:
- Bạn hoàn toàn có toàn quyền sáng tạo thêm các nhân vật phụ/nhân vật quần chúng (như cảnh sát, bồi bàn, tài xế, đám đông,...) phù hợp bối cảnh để dẫn dắt cốt truyện mượt mà.
- Phải đảm bảo tất cả câu chuyện, mâu thuẫn và lời thoại được biểu đạt trọn vẹn, không viết tóm tắt kiểu "tiếp tục cảnh quay...", mà bắt buộc phải viết thoại và mô tả hành động đầy đủ 100% từ đầu tới kết thúc phim.

YÊU CẦU ĐỊNH DẠNG (CỰC KỲ QUAN TRỌNG):
1. Viết kịch bản bằng Tiếng Việt theo định dạng chuẩn kịch bản điện ảnh:
   - Tách các phân cảnh bằng Tên Cảnh/Phân cảnh (SCENE HEADING) viết IN HOA (ví dụ: CẢNH 1: BÊN TRONG CĂN NHÀ - BAN ĐÊM)
   - Mô tả hành động/bối cảnh (Action) viết bình thường.
   - Tên nhân vật viết IN HOA ở giữa dòng trước khi nói.
   - Lời thoại đối thoại của nhân vật được bọc hoàn toàn bởi dấu ngoặc vuông [...] và đính kèm ước lượng số giây nói thực tế ở cuối, ví dụ: [ Lời thoại của nhân vật (số_giây_nói_thực_tếs) ]

Ý NGHĨA SỐ GIÂY TRONG NGOẶC VUÔNG:
- Khi nhân vật nói thoại, hãy đính kèm thời lượng nói thực tế của câu thoại đó vào cuối dấu ngoặc vuông, ví dụ: [ Tôi sẽ không bao giờ để việc này xảy ra nữa! (4s) ].
- Việc này giúp hệ thống tự động tính toán tổng thời lượng thoại của toàn bộ kịch bản một cách chính xác. Tốc độ nói trung bình là 2.3 từ mỗi giây (Ví dụ: 10 từ nói hết khoảng 4-5 giây).

HÃY SÁNG TÁC KỊCH BẢN ĐẦY ĐỦ, LIÊN TỤC TỪ ĐẦU ĐẾN CUỐI. Hãy viết kịch bản thật sâu sắc, có hồn, dồi dào bối cảnh, và lột tả xuất sắc đỉnh cao nghệ thuật biên kịch.`,
    config: {
      temperature: 0.75,
    }
  });

  return response.text;
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
    contents: `Bạn là một chuyên gia phân tích kịch bản. Hãy đọc cực kỳ chi tiết hai tài liệu sau để trích xuất và đề xuất tất cả các nhân vật được nhắc tên hoặc mô phỏng xuất hiện trong đó:

1. TÀI LIỆU ĐÍNH KÈM / GHI CHÚ THÔ:
"${extraContext}"

2. BỔ SUNG TÀI NGUYÊN (Ý TƯỞNG CỐT TRUYỆN CHÍNH):
"${idea}"

YÊU CẦU:
- Phân tích thật kỹ lưỡng cả hai phần tài liệu trên để tìm ra có bao nhiêu nhân vật khác nhau được nhắc đến, dù là trực tiếp hay gián tiếp.
- Trích lọc đầy đủ tên, vai trò và mô tả các nhân vật đó. Nếu số lượng nhân vật thực tế trong tài liệu quá ít (dưới 2 nhân vật), hãy sáng tạo thêm các nhân vật phụ/đối trọng/người đồng hành thích hợp cho Thể loại phim "${genre}" để kịch bản thêm phần sâu sắc và hoàn thiện.
- Các thông tin nhân vật thu thập hoặc đề xuất thêm cần bộc lộ rõ tinh thần thể loại phim "${genre}".
  + Nếu là Tôn giáo ("Religion"): Các nhân vật có đức tin sâu, dằn vặt nội tâm tâm linh.
  + Nếu là Lịch sử ("History"): Nhân vật mang phong thái xưng hô hào hùng hoặc cổ kính, cổ xưa.
  + Nếu là Hoạt hình ("Animation"): Đáng yêu, sinh động, hoặc kỳ ảo, nhân hóa nhân vật.
  + Nếu là Hành động ("Action"): Cương nghị, dấn thân, hành động dứt khoát kịch tính.
  + Nếu là Hài hước ("Comedy"): Lập dị dí dỏm, đầy tính tréo ngoe oái oăm tạo tiếng cười.
  + Nếu là Chính kịch ("Drama") / Lãng mạn ("Romance"): Chiều sâu tâm lý, giàu cảm xúc, giằng xé nội tâm.

Mỗi nhân vật trích lọc/đề xuất cần có một đối tượng gồm các trường sau:
- tên (name): Viết IN HOA toàn bộ, có dấu tiếng Việt chuẩn xác (ví dụ: HÙNG, CHỊ BA, THẦY AN)
- vai trò (role): Ghi rõ vai trò của nhân vật trong cốt truyện (ví dụ: Nhân vật chính, Nhân vật phản diện, Người đồng hành, Người hỗ trợ, v.v.)
- mô tả tính cách & ngoại hình (description): Viết bằng tiếng Việt mô tả súc tích nhưng đầy chất điện ảnh về tính cách, mục đích sống, mâu thuẫn hoặc số phận nhân vật.

Hãy trả về một định dạng cấu trúc mảng JSON các đối tượng nhân vật không kèm theo lời dẫn giải thích nào khác.`,
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

export async function enrichScriptIdea(genre: Genre, extraContext: string, currentIdea?: string): Promise<string> {
  const response = await ai.models.generateContent({
    model: "gemini-3.5-flash",
    contents: `Bạn là một nhà biên kịch phim điện ảnh lão luyện bậc thầy. Hãy dựa trên các tài liệu đính kèm/ghi chú thô sau đây kết hợp với Thể loại phim "${genre}" để đề xuất một phần Tóm tắt cốt truyện sáng tạo đầy đủ kịch tính và bài bản nhất cho phim (gọi là "Bổ sung Tài nguyên kịch tính").

TÀI LIỆU ĐÍNH KÈM / GHI CHÚ THÔ:
"${extraContext}"

${currentIdea ? `Ý TƯỞNG HIỆN TẠI (NẾU CÓ):\n"${currentIdea}"` : ""}

YÊU CẦU:
- Bổ sung các tình tiết đột phá, nút thắt kịch tính thích hợp cho thể loại cho phim "${genre}".
- Phải liên kết chặt chẽ các thông tin thô từ tài liệu đính kèm thành một cốt truyện mạch lạc, cấu trúc kịch tính thu hút sự tò mò.
- Đối thoại, mâu thuẫn chính diện và phản diện, hướng giải quyết cần đậm nét điện ảnh.
- Hãy trình bày dưới dạng một câu chuyện tóm tắt cô đọng nhưng cực kỳ lôi cuốn, có đầy đủ khởi đầu, cao trào và hứa hẹn kết cục giàu cảm xúc (khoảng 150-300 từ).
- Ngôn ngữ: Tiếng Việt (Tiếng Việt) dễ hiểu, lừng lẫy chất lượng phim điện ảnh của bạn.

CHỈ TRẢ VỀ TOÀN VĂN PHẦN Ý TƯỞNG CỐT TRUYỆN ĐÃ ĐƯỢC BỔ SUNG, KHÔNG CÓ LỜI DẪN, KHÔNG CÓ KÝ TỰ ĐÁNH DẤU TIÊU ĐỀ NHA.`,
    config: {
      temperature: 0.8,
    }
  });

  return response.text.trim();
}

