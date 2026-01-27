import React, { useState } from 'react';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/Card';

const LoginPage: React.FC = () => {
    const { login, loginWithEmail, isLoading } = useAuth();
    const [email, setEmail] = useState('');
    const [password, setPassword] = useState('');

    const handleEmailLogin = (e: React.FormEvent) => {
        e.preventDefault();
        if (email && password) {
            loginWithEmail(email);
        }
    };

    return (
        <div className="min-h-screen flex items-center justify-center bg-white">
            <Card className="w-full max-w-100 border border-slate-200 shadow-sm">
                <CardHeader className="text-center pb-6 pt-10">
                    <CardTitle className="text-3xl font-bold text-slate-900 tracking-normal">Login</CardTitle>
                </CardHeader>
                <CardContent className="space-y-6 px-8 pb-10">
                    <Button
                        variant="outline"
                        className="w-full py-6 text-base font-normal text-slate-900 bg-[#E9F5E9] border-none hover:bg-[#dbeede] flex items-center justify-center"
                        onClick={() => login()}
                        disabled={isLoading}
                        >
                        <img
                            src="/google.svg"
                            alt="Google"
                            className="mr-3 h-5 w-5"
                        />
                        Login with Google
                    </Button>

                    <div className="relative">
                        <div className="absolute inset-0 flex items-center" >
                            <span className="w-full border-t border-slate-200" />
                        </div>
                        <div className="relative flex justify-center text-xs">
                            <span className="bg-white text-xs px-2 text-slate-400 font-normal tracking-wide">
                                or sign up through email
                            </span>
                        </div>
                    </div>

                    <form onSubmit={handleEmailLogin} className="space-y-4">
                        <Input
                            type="email"
                            placeholder="Email ID"
                            value={email}
                            onChange={(e) => setEmail(e.target.value)}
                            className="bg-slate-50 border-none h-12 placeholder:text-slate-400"
                            required
                        />
                        <Input
                            type="password"
                            placeholder="Password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            className="bg-slate-50 border-none h-12 placeholder:text-slate-400"
                            required
                        />
                        <Button
                            type="submit"
                            className="w-full bg-[#00AA44] hover:bg-[#00903a] text-white h-12 text-base font-normal mt-2"
                        >
                            Login
                        </Button>
                    </form>
                </CardContent>
            </Card>
        </div>
    );
};

export default LoginPage;
