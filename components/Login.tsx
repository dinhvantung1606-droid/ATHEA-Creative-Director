import React, { useState } from 'react';
import { Button } from './Button';
import { User } from '../types';

interface LoginProps {
  onLogin: (user: User) => void;
}

// --- HƯỚNG DẪN KẾT NỐI GOOGLE SHEET (QUAN TRỌNG) ---
// Sheet của bạn: https://docs.google.com/spreadsheets/d/1trNIrEzW1DHIHfMCL0SHtIDTkOH5Mco0mSaCke9ZebQ/edit?usp=sharing
//
// Để code này hoạt động, bạn phải tạo "Web App URL" từ Sheet trên:
// 1. Mở Sheet > Tiện ích mở rộng (Extensions) > Apps Script.
// 2. Dán đoạn code sau vào file Code.gs:
/*
function doPost(e) {
  var sheet = SpreadsheetApp.getActiveSpreadsheet().getActiveSheet();
  var timestamp = new Date().toLocaleString('vi-VN');
  var name = e.parameter.name;
  var email = e.parameter.email;
  var password = e.parameter.password;
  sheet.appendRow([timestamp, name, email, password]);
  return ContentService.createTextOutput("Success").setMimeType(ContentService.MimeType.TEXT);
}
*/
// 3. Nhấn "Triển khai" (Deploy) > "Tùy chọn triển khai mới" (New deployment).
// 4. Chọn loại: "Ứng dụng web" (Web app).
// 5. Phần "Ai có quyền truy cập" (Who has access): CHỌN "Bất kỳ ai" (Anyone) <--- BẮT BUỘC.
// 6. Copy "URL ứng dụng web" (Web App URL) và dán vào biến bên dưới:

const GOOGLE_SCRIPT_URL = "PASTE_YOUR_WEB_APP_URL_HERE"; 

export const Login: React.FC<LoginProps> = ({ onLogin }) => {
  const [isRegistering, setIsRegistering] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const logToGoogleSheet = async (userData: { name: string, email: string, password: string }) => {
    // Validation: Kiểm tra xem người dùng có dán nhầm link Sheet thay vì link Web App không
    if (GOOGLE_SCRIPT_URL.includes("docs.google.com/spreadsheets")) {
        console.error("LỖI CẤU HÌNH: Bạn đã điền URL của Sheet thay vì URL của Web App.");
        alert("LỖI CẤU HÌNH: Vui lòng điền 'Web App URL' (bắt đầu bằng script.google.com...), không phải link Google Sheet. Xem hướng dẫn trong file code.");
        return;
    }

    if (!GOOGLE_SCRIPT_URL || GOOGLE_SCRIPT_URL === "PASTE_YOUR_WEB_APP_URL_HERE") {
        console.warn("Chưa cấu hình URL Google Script. Dữ liệu chưa được lưu vào Sheet.");
        return;
    }

    try {
        const formData = new FormData();
        formData.append('timestamp', new Date().toLocaleString('vi-VN'));
        formData.append('name', userData.name);
        formData.append('email', userData.email);
        formData.append('password', userData.password);

        await fetch(GOOGLE_SCRIPT_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
        console.log("Đã gửi dữ liệu đăng ký tới Google Sheet");
    } catch (e) {
        console.error("Lỗi khi lưu vào Google Sheet:", e);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);
    setIsLoading(true);

    // Simulate API delay
    setTimeout(async () => {
      
      if (!email || !password) {
        setIsLoading(false);
        setError("Vui lòng nhập đầy đủ thông tin.");
        return;
      }

      if (isRegistering && !name) {
        setIsLoading(false);
        setError("Vui lòng nhập họ tên.");
        return;
      }

      // NẾU LÀ ĐĂNG KÝ: Gửi thông tin về Google Sheet
      if (isRegistering) {
          await logToGoogleSheet({ name, email, password });
      }

      // Simulate successful login/register
      const user: User = {
        email,
        name: isRegistering ? name : email.split('@')[0], // Use part of email as name if login
      };
      
      setIsLoading(false);
      onLogin(user);
    }, 1000);
  };

  return (
    <div className="min-h-screen bg-brand-dark flex flex-col items-center justify-center p-4 relative overflow-hidden">
      {/* Decorative Background Elements */}
      <div className="absolute top-0 left-0 w-full h-full overflow-hidden z-0 pointer-events-none">
        <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[100px]"></div>
        <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-brand-gold/5 rounded-full blur-[100px]"></div>
      </div>

      <div className="w-full max-w-md bg-[#0f0f0f] border border-gray-800 rounded-2xl p-8 shadow-[0_0_40px_rgba(0,0,0,0.5)] z-10 animate-fade-in-up">
        {/* Logo */}
        <div className="flex flex-col items-center mb-8">
            <div className="w-16 h-16 bg-brand-gold rounded-full flex items-center justify-center text-brand-dark font-serif font-bold text-3xl shadow-[0_0_15px_rgba(212,175,55,0.4)] mb-4">A</div>
            <h1 className="text-2xl font-serif text-white tracking-wide">ATHEA Creative</h1>
            <p className="text-xs text-brand-gold uppercase tracking-widest mt-1">Trợ Lý Thời Trang AI</p>
        </div>

        <h2 className="text-xl text-white font-medium mb-6 text-center border-b border-gray-800 pb-4">
          {isRegistering ? 'Đăng Ký Tài Khoản' : 'Đăng Nhập'}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-5">
          {isRegistering && (
            <div>
              <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Họ và Tên</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
                placeholder="Nhập họ tên của bạn"
              />
            </div>
          )}

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
              placeholder="name@company.com"
            />
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-400 mb-1 uppercase">Mật khẩu</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full bg-brand-dark border border-gray-700 rounded-lg p-3 text-white placeholder-gray-600 focus:outline-none focus:border-brand-gold focus:ring-1 focus:ring-brand-gold transition-all"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="text-red-400 text-sm text-center bg-red-900/10 p-2 rounded border border-red-900/30">
              {error}
            </div>
          )}

          <Button 
            type="submit" 
            isLoading={isLoading} 
            className="w-full mt-4"
          >
            {isRegistering ? 'Tạo Tài Khoản' : 'Đăng Nhập'}
          </Button>
        </form>

        <div className="mt-6 text-center">
          <p className="text-sm text-gray-500">
            {isRegistering ? 'Đã có tài khoản?' : 'Chưa có tài khoản?'}
            <button 
              onClick={() => {
                setIsRegistering(!isRegistering);
                setError(null);
              }}
              className="ml-2 text-brand-gold hover:underline font-medium"
            >
              {isRegistering ? 'Đăng nhập ngay' : 'Đăng ký ngay'}
            </button>
          </p>
        </div>
      </div>
      
      <p className="text-gray-600 text-xs mt-8 absolute bottom-4">© 2024 ATHEA AI. All rights reserved.</p>
    </div>
  );
};