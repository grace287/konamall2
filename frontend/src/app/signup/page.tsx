'use client';

import { useState } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useForm } from 'react-hook-form';
import { api } from '@/lib/api';
import toast from 'react-hot-toast';
import { 
  User, Mail, Lock, Eye, EyeOff, UserPlus, 
  Gift, Check, ChevronRight, Sparkles
} from 'lucide-react';

interface SignupForm {
  name: string;
  email: string;
  password: string;
  passwordConfirm: string;
  agreeTerms: boolean;
  agreeMarketing: boolean;
}

export default function SignupPage() {
  const router = useRouter();
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showPasswordConfirm, setShowPasswordConfirm] = useState(false);

  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<SignupForm>();

  const password = watch('password');
  const passwordValue = watch('password', '');

  // 비밀번호 강도 체크
  const getPasswordStrength = (pwd: string) => {
    if (!pwd) return { level: 0, text: '', color: '' };
    let strength = 0;
    if (pwd.length >= 8) strength++;
    if (/[a-z]/.test(pwd) && /[A-Z]/.test(pwd)) strength++;
    if (/\d/.test(pwd)) strength++;
    if (/[!@#$%^&*(),.?":{}|<>]/.test(pwd)) strength++;
    
    if (strength <= 1) return { level: 1, text: '약함', color: 'bg-red-500' };
    if (strength === 2) return { level: 2, text: '보통', color: 'bg-yellow-500' };
    if (strength === 3) return { level: 3, text: '강함', color: 'bg-green-500' };
    return { level: 4, text: '매우 강함', color: 'bg-green-600' };
  };

  const passwordStrength = getPasswordStrength(passwordValue);

  const onSubmit = async (data: SignupForm) => {
    if (!data.agreeTerms) {
      toast.error('필수 약관에 동의해주세요.');
      return;
    }
    
    // 비밀번호 확인 검증
    if (data.password !== data.passwordConfirm) {
      toast.error('비밀번호가 일치하지 않습니다.');
      return;
    }
    
    setIsLoading(true);
    try {
      const response = await api.post('/api/users/register', {
        name: data.name.trim(),
        email: data.email.trim().toLowerCase(),
        password: data.password,
      });
      
      toast.success('🎉 회원가입 완료! 3,000원 쿠폰이 지급되었습니다.');
      
      // 회원가입 성공 후 로그인 페이지로 이동
      setTimeout(() => {
        router.push('/login');
      }, 1500);
    } catch (error: any) {
      // 에러 메시지 처리
      const errorMessage = error.response?.data?.detail || 
                          error.response?.data?.message || 
                          '회원가입에 실패했습니다. 다시 시도해주세요.';
      
      toast.error(errorMessage);
      
      // 이메일 중복인 경우 이메일 필드 포커스
      if (errorMessage.includes('이메일') || errorMessage.includes('이미 등록')) {
        const emailInput = document.querySelector('input[type="email"]') as HTMLInputElement;
        emailInput?.focus();
      }
    } finally {
      setIsLoading(false);
    }
  };

  // 신규 가입 혜택
  const benefits = [
    { icon: '🎁', text: '신규 가입 3,000원 쿠폰' },
    { icon: '🚚', text: '첫 주문 무료배송' },
    { icon: '💰', text: '매일 출석체크 포인트' },
  ];

  return (
    <div className="min-h-screen bg-gradient-to-b from-primary-50 to-white flex flex-col">
      {/* 상단 혜택 배너 */}
      <div className="bg-gradient-to-r from-violet-500 to-purple-600 text-white py-2 px-4">
        <div className="container mx-auto flex items-center justify-center gap-2 text-sm">
          <Sparkles className="w-4 h-4" />
          <span>지금 가입하면 <strong>총 10,000원 혜택</strong> 즉시 지급!</span>
        </div>
      </div>

      <div className="flex-1 flex items-center justify-center px-4 py-8">
        <div className="w-full max-w-md">
          {/* 로고 & 타이틀 */}
          <div className="text-center mb-6">
            <Link href="/" className="inline-block mb-4">
              <span className="text-4xl font-bold bg-gradient-to-r from-primary-500 to-orange-500 bg-clip-text text-transparent">
                KonaMall
              </span>
            </Link>
            <h1 className="text-2xl font-bold text-gray-800">회원가입</h1>
            <p className="text-gray-500 mt-2">가입하고 특별한 혜택을 받아보세요!</p>
          </div>

          {/* 가입 혜택 카드 */}
          <div className="bg-gradient-to-r from-primary-500 to-orange-500 rounded-2xl p-4 mb-6 text-white">
            <div className="flex items-center gap-2 mb-3">
              <Gift className="w-5 h-5" />
              <span className="font-bold">신규 가입 혜택</span>
            </div>
            <div className="grid grid-cols-3 gap-2">
              {benefits.map((benefit, idx) => (
                <div key={idx} className="bg-white/20 backdrop-blur-sm rounded-lg p-2 text-center">
                  <span className="text-2xl block mb-1">{benefit.icon}</span>
                  <span className="text-xs">{benefit.text}</span>
                </div>
              ))}
            </div>
          </div>

          {/* 회원가입 카드 */}
          <div className="bg-white rounded-2xl shadow-lg p-6 md:p-8">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              {/* 이름 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이름
                </label>
                <div className="relative">
                  <User className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="text"
                    {...register('name', { required: '이름을 입력해주세요' })}
                    className={`w-full pl-12 pr-4 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.name ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="홍길동"
                  />
                </div>
                {errors.name && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.name.message}
                  </p>
                )}
              </div>

              {/* 이메일 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  이메일
                </label>
                <div className="relative">
                  <Mail className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type="email"
                    {...register('email', {
                      required: '이메일을 입력해주세요',
                      pattern: {
                        value: /^[A-Z0-9._%+-]+@[A-Z0-9.-]+\.[A-Z]{2,}$/i,
                        message: '올바른 이메일 형식을 입력해주세요',
                      },
                    })}
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
                    {...register('password', {
                      required: '비밀번호를 입력해주세요',
                      minLength: {
                        value: 8,
                        message: '비밀번호는 8자 이상이어야 합니다',
                      },
                    })}
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.password ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="8자 이상 입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPassword ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {/* 비밀번호 강도 표시 */}
                {passwordValue && (
                  <div className="mt-2">
                    <div className="flex gap-1 mb-1">
                      {[1, 2, 3, 4].map((level) => (
                        <div
                          key={level}
                          className={`h-1.5 flex-1 rounded-full ${
                            level <= passwordStrength.level
                              ? passwordStrength.color
                              : 'bg-gray-200'
                          }`}
                        />
                      ))}
                    </div>
                    <p className={`text-xs ${
                      passwordStrength.level <= 1 ? 'text-red-500' :
                      passwordStrength.level === 2 ? 'text-yellow-600' : 'text-green-600'
                    }`}>
                      비밀번호 강도: {passwordStrength.text}
                    </p>
                  </div>
                )}
                {errors.password && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.password.message}
                  </p>
                )}
              </div>

              {/* 비밀번호 확인 */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  비밀번호 확인
                </label>
                <div className="relative">
                  <Lock className="absolute left-4 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
                  <input
                    type={showPasswordConfirm ? 'text' : 'password'}
                    {...register('passwordConfirm', {
                      required: '비밀번호를 다시 입력해주세요',
                      validate: (value) =>
                        value === password || '비밀번호가 일치하지 않습니다',
                    })}
                    className={`w-full pl-12 pr-12 py-3.5 border-2 rounded-xl focus:ring-2 focus:ring-primary-500 focus:border-primary-500 transition-all ${
                      errors.passwordConfirm ? 'border-red-300 bg-red-50' : 'border-gray-200'
                    }`}
                    placeholder="비밀번호 재입력"
                  />
                  <button
                    type="button"
                    onClick={() => setShowPasswordConfirm(!showPasswordConfirm)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600"
                  >
                    {showPasswordConfirm ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                {errors.passwordConfirm && (
                  <p className="text-red-500 text-sm mt-1.5 flex items-center gap-1">
                    <span>⚠️</span> {errors.passwordConfirm.message}
                  </p>
                )}
              </div>

              {/* 약관 동의 */}
              <div className="space-y-3 pt-2">
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('agreeTerms')}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-red-500">[필수]</span> 이용약관 및 개인정보처리방침에 동의합니다
                  </span>
                </label>
                <label className="flex items-start gap-3 cursor-pointer">
                  <input
                    type="checkbox"
                    {...register('agreeMarketing')}
                    className="w-5 h-5 rounded border-gray-300 text-primary-500 focus:ring-primary-500 mt-0.5"
                  />
                  <span className="text-sm text-gray-700">
                    <span className="text-gray-400">[선택]</span> 마케팅 정보 수신에 동의합니다
                    <span className="text-primary-500 text-xs ml-1">(+1,000P)</span>
                  </span>
                </label>
              </div>

              {/* 회원가입 버튼 */}
              <button
                type="submit"
                disabled={isLoading}
                className="w-full bg-gradient-to-r from-primary-500 to-orange-500 text-white py-4 rounded-xl font-bold text-lg hover:from-primary-600 hover:to-orange-600 transition-all disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 shadow-lg shadow-primary-500/30 mt-6"
              >
                {isLoading ? (
                  <>
                    <div className="w-5 h-5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                    가입 중...
                  </>
                ) : (
                  <>
                    <UserPlus className="w-5 h-5" />
                    회원가입
                  </>
                )}
              </button>
            </form>

            {/* 소셜 회원가입 */}
            <div className="mt-6">
              <div className="relative">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-gray-200"></div>
                </div>
                <div className="relative flex justify-center text-sm">
                  <span className="bg-white px-4 text-gray-500">간편 가입</span>
                </div>
              </div>

              <div className="mt-4 grid grid-cols-2 gap-3">
                <button className="flex items-center justify-center gap-2 bg-[#FEE500] text-[#3C1E1E] py-3 rounded-xl font-medium hover:bg-[#FDD835] transition-colors">
                  <svg className="w-5 h-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 3C6.48 3 2 6.58 2 11c0 2.84 1.86 5.33 4.64 6.73-.14.53-.54 1.96-.62 2.27-.1.4.14.39.3.29.12-.08 1.92-1.27 2.7-1.78.65.1 1.32.15 2 .15 5.52 0 10-3.58 10-8 0-4.42-4.48-8-10-8z"/>
                  </svg>
                  카카오
                </button>
                <button className="flex items-center justify-center gap-2 bg-white border-2 border-gray-200 py-3 rounded-xl font-medium hover:bg-gray-50 transition-colors">
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

            {/* 로그인 링크 */}
            <div className="mt-6 text-center">
              <p className="text-gray-600">
                이미 계정이 있으신가요?{' '}
                <Link 
                  href="/login" 
                  className="text-primary-600 font-semibold hover:underline inline-flex items-center gap-1"
                >
                  로그인 <ChevronRight className="w-4 h-4" />
                </Link>
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
