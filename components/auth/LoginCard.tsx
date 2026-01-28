'use client';

import { useRouter, useSearchParams } from 'next/navigation';

export default function LoginCard() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const returnTo = searchParams.get('returnTo');

  const handleEmailLogin = () => {
    router.push(`/auth/login?returnTo=${returnTo}`);
  };

  const handleGoogleLogin = () => {
    router.push(`/auth/login?connection=google-oauth2&returnTo=${returnTo}`);
  };

  const handleAppleLogin = () => {
    router.push(`/auth/login?connection=apple&returnTo=${returnTo}`);
  };

  const handleSignUp = () => {
    // For sign up, you might want to use a different connection or add a screen_hint
    // Common pattern: router.push('/auth/login?screen_hint=signup');
    router.push(`/auth/login?screen_hint=signup&returnTo=${returnTo}`);
  };

  return (
    <div className="flex flex-col items-center justify-center bg-background dark:bg-black p-4">
      <div className="w-full max-w-md dark:bg-[#1a1a1a] p-8"> {/* bg-background rounded-lg shadow-lg */}
        {/* Title */}
        <h1 className="text-xl font-semibold text-black mb-8">
          Log In
        </h1>

        {/* Email Login Button */}
        <button
          onClick={handleEmailLogin}
          className="w-full flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white font-medium py-3 px-4 rounded-lg transition-colors mb-6 cursor-pointer"
        >
          <EnvelopeIcon />
          <span>Continue with Email</span>
        </button>

        {/* OR Separator */}
        <div className="flex items-center gap-4 mb-6">
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
          <span className="text-sm text-gray-500 dark:text-gray-400">OR</span>
          <div className="flex-1 h-px bg-gray-300 dark:bg-gray-700"></div>
        </div>

        {/* Social Login Buttons */}
        <div className="flex flex-col gap-3 mb-6">
          {/* Google Login */}
          <button
            onClick={handleGoogleLogin}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
          >
            <GoogleIcon />
            <span>Continue with Google</span>
          </button>

          {/* Apple Login */}
          <button
            onClick={handleAppleLogin}
            className="w-full flex items-center justify-center gap-3 bg-gray-800 dark:bg-gray-900 hover:bg-gray-700 dark:hover:bg-gray-800 text-white font-medium py-3 px-4 rounded-lg transition-colors cursor-pointer"
          >
            <AppleIcon />
            <span>Continue with Apple</span>
          </button>
        </div>

        {/* Sign Up Link */}
        <div className="text-center text-sm text-gray-400 dark:text-gray-500">
          Need to create an account?{' '}
          <button
            onClick={handleSignUp}
            className="text-blue-500 hover:text-blue-400 font-medium transition-colors"
          >
            Sign Up
          </button>
        </div>
      </div>
    </div>
  );
}

// Envelope Icon Component
function EnvelopeIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      <path
        d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
      <path
        d="m22 6-10 7L2 6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
        strokeLinejoin="round"
        fill="none"
      />
    </svg>
  );
}

// Google Icon Component
function GoogleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      xmlns="http://www.w3.org/2000/svg"
    >
      <path
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z"
        fill="#4285F4"
      />
      <path
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
        fill="#34A853"
      />
      <path
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
        fill="#FBBC05"
      />
      <path
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
        fill="#EA4335"
      />
    </svg>
  );
}

// Apple Icon Component
function AppleIcon() {
  return (
    <svg
      width="20"
      height="20"
      viewBox="0 0 24 24"
      fill="currentColor"
      xmlns="http://www.w3.org/2000/svg"
      className="text-white"
    >
      <path d="M17.05 20.28c-.98.95-2.05.88-3.08.4-1.09-.5-2.08-.48-3.24 0-1.44.62-2.2.44-3.06-.4C2.79 15.25 3.51 7.59 9.05 7.31c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4.09l.01-.01zM12.03 7.25c-.15-2.23 1.66-4.07 3.74-4.25.29 2.58-2.34 4.5-3.74 4.25z"/>
    </svg>
  );
}
