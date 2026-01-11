import React from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { api } from '../lib/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';

const loginSchema = z.object({
    email: z.string().email(),
    password: z.string().min(6),
});

type LoginFormData = z.infer<typeof loginSchema>;

export const Login: React.FC = () => {
    const { login } = useAuth();
    const navigate = useNavigate();
    const { register, handleSubmit, formState: { errors, isSubmitting }, setError } = useForm<LoginFormData>({
        resolver: zodResolver(loginSchema),
    });

    const [isSignup, setIsSignup] = React.useState(false);

    const onSubmit = async (data: LoginFormData) => {
        try {
            const endpoint = isSignup ? '/auth/signup' : '/auth/login';
            const response = await api.post(endpoint, data);
            login(response.data.token, response.data.user);
            navigate('/');
        } catch (error: any) {
            setError('root', {
                message: error.response?.data?.message || (isSignup ? 'Signup failed' : 'Login failed'),
            });
        }
    };

    return (
        <div className="flex items-center justify-center min-h-screen bg-background relative overflow-hidden">
            {/* Ambient background effects */}
            <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] bg-primary/20 rounded-full blur-[120px] pointer-events-none" />
            <div className="absolute bottom-[-10%] right-[-10%] w-[40%] h-[40%] bg-secondary/20 rounded-full blur-[120px] pointer-events-none" />

            <div className="w-full max-w-md p-8 glass-panel rounded-2xl relative z-10 animate-[fadeIn_0.5s_ease-out]">
                <div className="text-center mb-8">
                    <div className="w-16 h-16 mx-auto bg-gradient-to-br from-primary to-secondary rounded-2xl flex items-center justify-center shadow-lg shadow-primary/20 mb-6 rotate-3">
                        <span className="text-3xl font-bold text-white">C</span>
                    </div>
                    <h1 className="text-3xl font-bold text-white mb-2 tracking-tight">{isSignup ? 'Create Account' : 'Welcome Back'}</h1>
                    <p className="text-slate-400 text-sm">{isSignup ? 'Sign up to start learning' : 'Sign in to access your content management system'}</p>
                </div>

                <form onSubmit={handleSubmit(onSubmit)} className="space-y-5">
                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide ml-1">Email Address</label>
                        <input
                            type="email"
                            {...register('email')}
                            className="input-field"
                            placeholder="admin@example.com"
                        />
                        {errors.email && <p className="ml-1 text-xs text-red-400 font-medium">{errors.email.message}</p>}
                    </div>

                    <div className="space-y-1.5">
                        <label className="block text-xs font-bold text-slate-300 uppercase tracking-wide ml-1">Password</label>
                        <input
                            type="password"
                            {...register('password')}
                            className="input-field"
                            placeholder="••••••••"
                        />
                        {errors.password && <p className="ml-1 text-xs text-red-400 font-medium">{errors.password.message}</p>}
                    </div>

                    {errors.root && (
                        <div className="p-3 text-sm text-red-200 bg-red-500/10 border border-red-500/20 rounded-lg text-center backdrop-blur-sm">
                            {errors.root.message}
                        </div>
                    )}

                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className="w-full btn-primary mt-4"
                    >
                        {isSubmitting ? (
                            <span className="flex items-center justify-center gap-2">
                                <svg className="animate-spin h-4 w-4 text-slate-900" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                                </svg>
                                {isSignup ? 'Creating Account...' : 'Signing in...'}
                            </span>
                        ) : (isSignup ? 'Create Account' : 'Sign In to Dashboard')}
                    </button>
                </form>

                <div className="mt-6 text-center">
                    <button
                        onClick={() => setIsSignup(!isSignup)}
                        className="text-sm text-slate-400 hover:text-white transition-colors"
                    >
                        {isSignup ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
                    </button>
                </div>

                <div className="mt-8 pt-6 border-t border-white/5 text-center">
                    <div className="inline-block px-4 py-2 rounded-full bg-white/5 border border-white/5">
                        <p className="text-xs text-slate-400 mb-1 font-medium">Demo Credentials</p>
                        <div className="flex items-center justify-center gap-2 text-xs text-slate-300 font-mono bg-black/20 px-2 py-1 rounded">
                            <span>admin@example.com</span>
                            <span className="text-slate-600">|</span>
                            <span>password123</span>
                        </div>
                    </div>
                </div>
            </div>
        </div>
    );
};
