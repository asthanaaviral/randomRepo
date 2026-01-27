import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useParams, useNavigate } from 'react-router-dom';
import api from '@/lib/api';
import { ArrowLeft, Star, Trash, Archive, MoreVertical, Reply, AlertCircle, CheckCircle, Clock } from 'lucide-react';
import { Button } from '@/components/ui/Button';
import { Skeleton } from '@/components/ui/Skeleton';


interface EmailDetail {
    id: string;
    recipient: string;
    subject: string;
    body: string;
    sendAt: string;
    status: string;
    sender?: {
        name: string;
        email: string;
    };
}

const EmailDetailPage: React.FC = () => {
    const { id } = useParams<{ id: string }>();
    const navigate = useNavigate();
    const [email, setEmail] = useState<EmailDetail | null>(null);
    const [isLoading, setIsLoading] = useState(true);

    useEffect(() => {
        const fetchEmail = async () => {
            if (!id) return;
            try { 
                const res = await api.get('/scheduled');
                const found = res.data.find((e: any) => e.id === id);
                setEmail(found || null);
            } catch (error) {
                console.error('Failed to fetch email details', error);
            } finally {
                setIsLoading(false);
            }
        };
        fetchEmail();
    }, [id]);

    const getStatusBadge = (status: string) => {
        switch (status) {
            case 'PENDING': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800"><Clock className="w-3 h-3" /> Scheduled</span>;
            case 'SENT':
            case 'COMPLETED': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800"><CheckCircle className="w-3 h-3" /> Sent</span>;
            case 'FAILED': return <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><AlertCircle className="w-3 h-3" /> Failed</span>;
            default: return <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">{status}</span>;
        }
    };

    if (isLoading) {
        return (
            <Layout>
                <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
                    <Skeleton className="h-8 w-1/3" />
                    <Skeleton className="h-32 w-full" />
                    <Skeleton className="h-48 w-full" />
                </div>
            </Layout>
        );
    }

    if (!email) {
        return (
            <Layout>
                <div className="max-w-5xl mx-auto px-8 py-20 text-center">
                    <h2 className="text-xl font-semibold text-slate-900">Email not found</h2>
                    <Button variant="ghost" className="mt-4" onClick={() => navigate('/dashboard')}>
                        Back to Dashboard
                    </Button>
                </div>
            </Layout>
        );
    }

    return (
        <Layout>
            <div className="bg-white min-h-screen pb-20">
                {/* Header Toolbar */}
                <div className="sticky top-0 bg-white z-10 px-8 py-4 border-b border-slate-100 flex items-center justify-between">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent -ml-2" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="w-5 h-5 text-slate-600" />
                        </Button>
                        <h1 className="text-lg font-medium text-slate-800 truncate max-w-xl">{email.subject} | {email.id.split('-')[0].toUpperCase()}</h1>
                        {getStatusBadge(email.status)}
                    </div>
                    <div className="flex items-center gap-2 text-slate-400">
                        <Button variant="ghost" size="sm" className="hover:text-amber-400"><Star className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:text-slate-600"><Archive className="w-4 h-4" /></Button>
                        <Button variant="ghost" size="sm" className="hover:text-red-500"><Trash className="w-4 h-4" /></Button>
                        <div className="w-px h-4 bg-slate-200 mx-2" />
                        <Button variant="ghost" size="sm"><MoreVertical className="w-4 h-4" /></Button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-8 py-8">
                    {/* Sender Row */}
                    <div className="flex items-start justify-between mb-8">
                        <div className="flex gap-4">
                            {/* Avatar */}
                            <div className="w-10 h-10 rounded-full bg-green-500 flex items-center justify-center text-white font-bold text-lg">
                                {email.sender?.name?.[0]?.toUpperCase() || 'S'}
                            </div>
                            <div>
                                <div className="flex items-baseline gap-2">
                                    <h3 className="text-sm font-bold text-slate-900">{email.sender?.name || 'Unknown Sender'}</h3>
                                    <span className="text-xs text-slate-500">&lt;{email.sender?.email || 'sender@example.com'}&gt;</span>
                                </div>
                                <div className="text-xs text-slate-500 mt-0.5">
                                    to me <span className="text-slate-300">▼</span>
                                </div>
                            </div>
                        </div>
                        <div className="text-xs text-slate-500 font-medium">
                            {new Date(email.sendAt).toLocaleString('en-US', { month: 'short', day: 'numeric', hour: 'numeric', minute: '2-digit' })}
                        </div>
                    </div>

                    {/* Body Content */}
                    <div className="pl-14 space-y-6 text-slate-800 leading-relaxed font-normal text-sm">
                        <div className="whitespace-pre-wrap font-sans">
                            {email.body.split('\n').map((line, i) => (
                                <p key={i} className="min-h-[1.5em]">{line}</p>
                            ))}
                        </div>

                    </div>

                    <div className="pl-14 mt-12 pt-8 border-t border-slate-100">
                        <div className="flex gap-4">
                            <Button variant="outline" className="rounded-full px-6 border-slate-300 text-slate-600 hover:bg-slate-50">
                                <Reply className="w-4 h-4 mr-2" />
                                Reply
                            </Button>
                            <Button variant="outline" className="rounded-full px-6 border-slate-300 text-slate-600 hover:bg-slate-50">
                                Forward
                            </Button>
                        </div>
                    </div>
                </div>
            </div>
        </Layout>
    );
};

export default EmailDetailPage;
