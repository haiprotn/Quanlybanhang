
import { createClient } from '@supabase/supabase-js';

// Helper để lấy biến môi trường an toàn (tránh lỗi undefined reading property)
const getEnv = (key: string) => {
    try {
        // Kiểm tra xem import.meta.env có tồn tại không
        // @ts-ignore
        if (typeof import.meta !== 'undefined' && import.meta.env) {
            // @ts-ignore
            return import.meta.env[key];
        }
    } catch (e) {
        // Bỏ qua lỗi nếu môi trường không hỗ trợ import.meta
    }
    return '';
};

// Bạn cần tạo file .env tại thư mục gốc và điền 2 biến này vào:
// VITE_SUPABASE_URL=https://your-project-id.supabase.co
// VITE_SUPABASE_ANON_KEY=your-anon-key

const supabaseUrl = getEnv('VITE_SUPABASE_URL');
const supabaseAnonKey = getEnv('VITE_SUPABASE_ANON_KEY');

if (!supabaseUrl || !supabaseAnonKey) {
    console.warn("Thiếu cấu hình Supabase! Ứng dụng sẽ chạy ở chế độ Mock Data.");
}

// Nếu không có config, tạo client với giá trị dummy để tránh lỗi khởi tạo
// Logic ở api.ts sẽ chặn gọi request nếu thiếu config.
export const supabase = createClient(
    supabaseUrl || 'https://placeholder.supabase.co', 
    supabaseAnonKey || 'placeholder'
);
