'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import { useAuthStore } from '@/store/authStore';
import toast from 'react-hot-toast';
import { 
  Mail, Lock, Eye, EyeOff, LogIn, 
  Gift, Truck, Shield, ChevronRight 
} from 'lucide-react';

interface LoginForm {
  email: string;
  password: string;
}

export default function LoginPage() {
  const router = useRouter();
  const setAuth = useAuthStore((state) => state.setAuth);
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);

  const {
    register,
    handleSubmit,
    formState: { errors },
  } = useForm<LoginForm>();

  const onSubmit = async (data: LoginForm) => {
    setIsLoading(true);
    try {
      const response = await api.post('/api/users/login/json', {
        email: data.email,
        password: data.password,
      });
      const { user, access_token } = response.data;
      setAuth(
        { id: user.id, email: user.email, name: user.name ?? '', role: user.role },
        access_token
      );
      toast.success('로그인 성공! 환영합니다 🎉');
      router.push('/');
    } catch (error: any) {
      const msg = error.response?.data?.detail || '로그인에 실패했습니다. 이메일과 비밀번호를 확인해주세요.';
      toast.error(msg);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      {/* 상단 혜택 배너 */}
      <div className="bg-gradient-to-r from-primary-500 to-orange-500 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
          <Gift className="w-4 h-4" />
          <span>지금 로그인하면 <strong>3,000원 할인쿠폰</strong> 즉시 지급!</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* 로고 & 타이틀 */}
          <div className="text-center mb-8">
            <Link href="/" className="inline-block mb-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">
                KonaMall
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">로그인</h1>
            <p className="text-gray-500 mt-2">전 세계 핫딜을 만나보세요!</p>
          </div>

          {/* 로그인 카드 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    {...register('email', { required: '이메일을 입력해주세요' })}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.email ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="email@example.com"
                  />
                </div>
                {errors.email && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.email.message}
                  </p>
                )}
              </div>

              {/* 비밀번호 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPassword ? 'text' : 'password'}
                    {...register('password', { required: '비밀번호를 입력해주세요' })}
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="••••••••"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.password.message}
                  </p>
                )}
              </div>

              {/* 비밀번호 찾기 */}
              <div className="flex justify-end">
                <Link 
                  href="/forgot-password" 
                  className="text-sm text-primary-600 hover:text-primary-700 hover:underline"
                >
                  비밀번호를 잊으셨나요?
                </Link>
              </div>

              {/* 로그인 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    로그인 중...
                  </>
                ) : (
                  <>
                    <LogIn className="w-5 h-5" />
                    로그인
                  </>
                )}
              </button>
            </form>

            {/* 소셜 로그인 */}
            <div className="mt-8">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">간편 로그인</span>
                </div>
              </div>

              <div className="mt-6 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] py-3.5 rounded-xl font-medium hover:bg-[#FDD835] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.64 6.73-.14.53-.54 1.96-.62 2.27-.1.4.14.39.3.29.12-.08 1.92-1.27 2.7-1.78.65.1 1.32.15 2 .15 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
                  </svg>
                  카카오
                </button>
                <button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 py-3.5 rounded-xl font-medium hover:bg-gray-50 transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24">
                    <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"/>
                    <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"/>
                    <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"/>
                    <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"/>
                  </svg>
                  Google
                </button>
              </div>
            </div>

            {/* 회원가입 링크 */}
            <div className="mt-8 text-center">
              <p className="text-gray-600">
                아직 회원이 아니신가요?{' '}
                <Link 
                  href="/signup" 
                  className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  회원가입 <ChevronRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          </div>

          {/* 하단 혜택 */}
          <div className="mt-8 grid grid-cols-3 gap-4 text-center">
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-primary-100 rounded-full flex items-center justify-center">
                <Gift className="w-5 h-5 text-primary-600" />
              </div>
              <span className="text-xs text-gray-600">신규 쿠폰</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                <Truck className="w-5 h-5 text-green-600" />
              </div>
              <span className="text-xs text-gray-600">무료배송</span>
            </div>
            <div className="flex flex-col items-center gap-1">
              <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                <Shield className="w-5 h-5 text-blue-600" />
              </div>
              <span className="text-xs text-gray-600">안전결제</span>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
