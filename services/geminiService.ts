import { LessonInfo, ProcessingOptions } from '../types';
import { NLS_FRAMEWORK_DATA, SYSTEM_INSTRUCTION } from '../constants';

// Dynamic import để tránh lỗi build
async function getGeminiAI(apiKey: string) {
  const { GoogleAIFileManager, GoogleGenerativeAI } = await import('@google/generative-ai');
  return new GoogleGenerativeAI(apiKey);
}

export async function generateNLSLessonPlan(
  lessonInfo: LessonInfo,
  options: ProcessingOptions,
  userApiKey: string // Nhận API key từ user
): Promise<string> {
  if (!userApiKey) {
    throw new Error('API key không được cung cấp');
  }

  try {
    // Khởi tạo Gemini với API key của user
    const genAI = await getGeminiAI(userApiKey);
    const model = genAI.getGenerativeModel({ 
      model: 'gemini-2.0-flash-exp',
      systemInstruction: SYSTEM_INSTRUCTION
    });

    // Xây dựng prompt
    let userPrompt = `
THÔNG TIN BÀI HỌC:
- Bộ sách: ${lessonInfo.textbook}
- Môn học: ${lessonInfo.subject}
- Lớp: ${lessonInfo.grade}

NỘI DUNG GIÁO ÁN GỐC:
${lessonInfo.content}
`;

    // Thêm PPCT nếu có
    if (lessonInfo.distributionContent && lessonInfo.distributionContent.trim().length > 0) {
      userPrompt += `

PHÂN PHỐI CHƯƠNG TRÌNH (PPCT) - THAM KHẢO:
${lessonInfo.distributionContent}

LƯU Ý: Nếu PPCT có quy định cụ thể về năng lực số cho bài học này, hãy ưu tiên tuân thủ PPCT.
`;
    }

    userPrompt += `

KHUNG NĂNG LỰC SỐ:
${NLS_FRAMEWORK_DATA}

YÊU CẦU:
`;

    if (options.analyzeOnly) {
      userPrompt += `
- Chỉ phân tích giáo án gốc và đề xuất các năng lực số phù hợp.
- KHÔNG chỉnh sửa nội dung giáo án gốc.
`;
    } else {
      userPrompt += `
- Tích hợp năng lực số vào giáo án theo hướng dẫn.
- Giữ nguyên toàn bộ định dạng và nội dung gốc.
- Chèn nội dung NLS bằng thẻ <u>...</u>.
`;
    }

    if (options.detailedReport) {
      userPrompt += `
- Kèm theo báo cáo chi tiết về lý do chọn từng năng lực số.
`;
    }

    // Gọi API
    const result = await model.generateContent(userPrompt);
    const response = await result.response;
    const text = response.text();

    if (!text || text.trim().length === 0) {
      throw new Error('Gemini API trả về kết quả rỗng');
    }

    return text;
  } catch (error: any) {
    console.error('Gemini Service Error:', error);
    
    // Xử lý các lỗi phổ biến
    if (error.message?.includes('API key')) {
      throw new Error('API key không hợp lệ hoặc đã hết hạn. Vui lòng kiểm tra lại.');
    }
    
    if (error.message?.includes('quota')) {
      throw new Error('API key đã vượt quá giới hạn sử dụng. Vui lòng thử lại sau.');
    }

    if (error.message?.includes('SAFETY')) {
      throw new Error('Nội dung giáo án có thể chứa thông tin bị hạn chế. Vui lòng kiểm tra lại.');
    }

    throw new Error(error.message || 'Không thể kết nối với Gemini API');
  }
}
