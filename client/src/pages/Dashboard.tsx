import React, { useEffect, useState } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';


import { RefreshCw, Search, Filter, Star, Clock } from 'lucide-react';
import api from '@/lib/api';
import { cn } from '@/lib/utils';
import { Skeleton } from '@/components/ui/Skeleton';

interface ScheduledEmail {
    id: string;
    recipient: string;
    subject: string;
    body?: string; 
    sendAt: string;
    status: 'PENDING' | 'SENT' | 'FAILED' | 'THROTTLED' | 'COMPLETED';
    createdAt: string;
}

import { useNavigate } from 'react-router-dom';

const Dashboard: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();
    const [activeTab, setActiveTab] = useState<'scheduled' | 'sent'>('scheduled');


    const [emails, setEmails] = useState<ScheduledEmail[]>([]);
    const [isLoading, setIsLoading] = useState(true);


    const fetchEmails = async () => {
        if (!user?.email) return;
        setIsLoading(true);
        try {
            const res = await api.get('/scheduled', {
                params: {
                    senderEmail: user.email
                }
            });
            setEmails(res.data);
        } catch (error) {
            console.error('Failed to fetch emails:', error);
        } finally {
            setIsLoading(false);
        }
    };

    useEffect(() => {
        if (user) {
            fetchEmails();
            const interval = setInterval(fetchEmails, 10000);
            return () => clearInterval(interval);
        }
    }, [user]);

    const filteredEmails = emails.filter(email => {
        if (activeTab === 'scheduled') {
            return email.status === 'PENDING' || email.status === 'THROTTLED';
        } else {
            return email.status === 'SENT' || email.status === 'COMPLETED' || email.status === 'FAILED';
        }
    });

    const scheduledCount = emails.filter(e => e.status === 'PENDING' || e.status === 'THROTTLED').length;
    const sentCount = emails.filter(e => e.status === 'SENT' || e.status === 'COMPLETED' || e.status === 'FAILED').length;

    return (
        <Layout
            activeTab={activeTab}
            onTabChange={setActiveTab}
            stats={{ scheduled: scheduledCount, sent: sentCount }}
        >
            {/* Header */}
            <div className="h-20 flex items-center px-8 gap-4 sticky top-0 bg-white z-10">
                <div className="relative w-full max-w-2xl">
                    <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-4 h-4 text-slate-400" />
                    <input
                        type="text"
                        placeholder="Search"
                        className="w-full bg-gray-100 border-none rounded-full pl-12 pr-4 py-3 text-sm focus:ring-1 focus:ring-slate-200 outline-none text-slate-700 placeholder:text-slate-400"
                    />
                </div>
                <div className="flex items-center gap-6 text-slate-400 pl-4">
                    <Filter className="w-4 h-4 cursor-pointer hover:text-slate-600 transition-colors" />
                    <RefreshCw
                        className={cn("w-4 h-4 cursor-pointer hover:text-slate-600 transition-colors", isLoading && "animate-spin text-slate-600")}
                        onClick={() => fetchEmails()}
                    />
                </div>
            </div>

            <div className="px-8 pb-8">
                {isLoading && emails.length === 0 ? (
                    <div className="space-y-4 pt-4">
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                        <Skeleton className="h-16 w-full" />
                    </div>
                ) : filteredEmails.length > 0 ? (
                    <div className="space-y-0">
                        {filteredEmails.map(email => (
                            <div
                                key={email.id}
                                onClick={() => navigate(`/emails/${email.id}`)}
                                className="group flex items-center py-4 border-b border-slate-100 hover:bg-slate-50 transition-colors cursor-pointer"
                            >
                                <div className="w-1/4 text-sm tracking-wide font-medium text-slate-900 truncate pr-6">
                                    To: {email.recipient}
                                </div>
                                <div className="flex-1 flex items-center min-w-0">
                                    {/* Badge */}
                                    <span className={cn(
                                        "px-2.5 py-1 rounded-full text-xs font-semibold mr-3 whitespace-nowrap",
                                        activeTab === 'scheduled' ? "bg-orange-100/50 text-orange-700 border border-orange-100" : "bg-slate-100 text-slate-600 border border-slate-200"
                                    )}>
                                        {activeTab === 'scheduled' ? (
                                            <><Clock className="w-3 h-3 inline mr-1.5 -mt-0.5" />
                                                {new Date(email.sendAt).toLocaleString('en-US', { weekday: 'short', hour: 'numeric', minute: '2-digit', second: '2-digit', hour12: true })}
                                            </>
                                        ) : (
                                            "Sent"
                                        )}
                                    </span>

                                    <div className="flex items-center text-sm truncate">
                                        <span className="text-slate-900 font-semibold mr-2">
                                            {email.subject}
                                        </span>
                                        <span className="text-slate-900 mx-1">-</span>
                                        <span className="text-slate-500 truncate">
                                            {email.body || "No content preview available..."}
                                        </span>
                                    </div>
                                </div>
                                <div className="pl-6 flex items-center">
                                    <Star className="w-4 h-4 text-slate-300 hover:text-yellow-400 transition-colors" />
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="flex flex-col items-center justify-center py-32 text-center opacity-60">
                        <p className="text-slate-500">No emails found in this category.</p>
                    </div>
                )}
            </div>


        </Layout>
    );
};

export default Dashboard;
