"use client";

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signIn } from '@/lib/supabase';

export default function LoginPage() {
  const router = useRouter();
  const [showRequestForm, setShowRequestForm] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [requestEmail, setRequestEmail] = useState('');
  const [requestName, setRequestName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [requestSent, setRequestSent] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const { error } = await signIn(email, password);
      if (error) {
        setError(error.message);
      } else {
        router.push('/');
      }
    } catch (err) {
      setError('An unexpected error occurred');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleRequestAccount = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Create mailto link with the request details
    const subject = encodeURIComponent('CareNotes Builder - Account Request');
    const body = encodeURIComponent(
      `New account request for CareNotes Builder:\n\n` +
      `Name: ${requestName}\n` +
      `Email: ${requestEmail}\n\n` +
      `Please create an account for this user.`
    );
    
    window.location.href = `mailto:claire.tasker@activecaregroup.co.uk?subject=${subject}&body=${body}`;
    setRequestSent(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        {/* Header */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 mx-auto mb-4 flex items-center justify-center bg-gradient-to-br from-[#F0941F] to-[#EF6024] rounded-lg shadow-lg">
            <span className="text-4xl font-bold text-white">C</span>
          </div>
          <h1 className="text-3xl font-bold text-[#363432]">
            Claire<span className="text-[#EF6024]">notes</span>
          </h1>
          <p className="text-[#90A19D] mt-2">CareNotes Form Builder</p>
        </div>

        {/* Login Form */}
        <div className="bg-white rounded-xl shadow-lg p-8 border border-gray-200">
          {!showRequestForm ? (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Sign In
              </h2>

              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">
                    Email
                  </label>
                  <input
                    id="email"
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#196774] focus:border-transparent outline-none text-gray-900"
                    placeholder="you@example.com"
                  />
                </div>

                <div>
                  <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1">
                    Password
                  </label>
                  <input
                    id="password"
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    required
                    minLength={6}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#196774] focus:border-transparent outline-none text-gray-900"
                    placeholder="••••••••"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-[#196774] hover:bg-[#196774]/90 text-white font-semibold py-3 rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                >
                  {loading ? 'Please wait...' : 'Sign In'}
                </button>
              </form>

              <div className="mt-6 text-center">
                <button
                  onClick={() => setShowRequestForm(true)}
                  className="text-[#196774] hover:text-[#196774]/80 text-sm font-medium"
                >
                  Don't have an account? Request access
                </button>
              </div>
            </>
          ) : (
            <>
              <h2 className="text-2xl font-bold text-gray-900 mb-6 text-center">
                Request Account Access
              </h2>

              {requestSent ? (
                <div className="text-center py-6">
                  <div className="mb-4 p-4 bg-green-50 border border-green-200 rounded-lg text-green-700">
                    <p className="font-semibold mb-2">Request Sent!</p>
                    <p className="text-sm">Your account request has been sent. You'll receive an email once your account is created.</p>
                  </div>
                  <button
                    onClick={() => {
                      setShowRequestForm(false);
                      setRequestSent(false);
                      setRequestEmail('');
                      setRequestName('');
                    }}
                    className="text-[#196774] hover:text-[#196774]/80 text-sm font-medium"
                  >
                    ← Back to Sign In
                  </button>
                </div>
              ) : (
                <>
                  <p className="text-sm text-gray-600 mb-6 text-center">
                    Enter your details below to request access to CareNotes Builder
                  </p>

                  <form onSubmit={handleRequestAccount} className="space-y-4">
                    <div>
                      <label htmlFor="requestName" className="block text-sm font-medium text-gray-700 mb-1">
                        Full Name
                      </label>
                      <input
                        id="requestName"
                        type="text"
                        value={requestName}
                        onChange={(e) => setRequestName(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#196774] focus:border-transparent outline-none text-gray-900"
                        placeholder="John Doe"
                      />
                    </div>

                    <div>
                      <label htmlFor="requestEmail" className="block text-sm font-medium text-gray-700 mb-1">
                        Email Address
                      </label>
                      <input
                        id="requestEmail"
                        type="email"
                        value={requestEmail}
                        onChange={(e) => setRequestEmail(e.target.value)}
                        required
                        className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-[#196774] focus:border-transparent outline-none text-gray-900"
                        placeholder="you@example.com"
                      />
                    </div>

                    <button
                      type="submit"
                      className="w-full bg-[#196774] hover:bg-[#196774]/90 text-white font-semibold py-3 rounded-lg transition-colors"
                    >
                      Send Request
                    </button>
                  </form>

                  <div className="mt-6 text-center">
                    <button
                      onClick={() => setShowRequestForm(false)}
                      className="text-[#196774] hover:text-[#196774]/80 text-sm font-medium"
                    >
                      ← Back to Sign In
                    </button>
                  </div>
                </>
              )}
            </>
          )}
        </div>

        <div className="mt-8 text-center text-sm text-gray-600">
          <p>Active Care Group - CareNotes Form Builder</p>
        </div>
      </div>
    </div>
  );
}
