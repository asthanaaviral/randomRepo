import React, { useEffect, useState, useRef } from 'react';
import Layout from '@/components/Layout';
import { useAuth } from '@/context/AuthContext';
import { Button } from '@/components/ui/Button';
import { Input } from '@/components/ui/Input';
import api from '@/lib/api';
import {
    ArrowLeft, Paperclip, Clock, Upload
} from 'lucide-react';

import { useNavigate } from 'react-router-dom';
import { Modal } from '@/components/ui/Modal';

const ComposePage: React.FC = () => {
    const { user } = useAuth();
    const navigate = useNavigate();

    const [senderId, setSenderId] = useState<string | null>(null);
    const [senders, setSenders] = useState<any[]>([]);

    // Form State
    const [to, setTo] = useState('');
    const [recipientList, setRecipientList] = useState<string[]>([]);
    const [subject, setSubject] = useState('');
    const [body, setBody] = useState('');
    const [delay, setDelay] = useState<number | ''>('');
    const [hourlyLimit, setHourlyLimit] = useState<number | ''>('');

    // UI State
    const [isScheduleOpen, setIsScheduleOpen] = useState(false);
    const [selectedDate, setSelectedDate] = useState<string>('');

    const fileInputRef = useRef<HTMLInputElement>(null);

    // Initial Sender Fetch
    useEffect(() => {
        const fetchSenders = async () => {
            if (!user) return;
            try {
                const res = await api.get('/senders');
                let existing = res.data.find((s: any) => s.email === user.email);

                if (!existing) {
                    console.log('Creating new sender for user...');
                    const createRes = await api.post('/senders', {
                        name: user.name,
                        email: user.email,
                        hourlyQuota: 100
                    });
                    setSenders([...res.data, createRes.data]);
                    setSenderId(createRes.data.id);
                } else {
                    setSenders(res.data);
                    setSenderId(existing.id);
                }
            } catch (error) {
                console.error('Failed to load senders', error);
            }
        };
        fetchSenders();
    }, [user]);

    const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
        const file = e.target.files?.[0];
        if (!file) return;

        const reader = new FileReader();
        reader.onload = (event) => {
            const text = event.target?.result as string;

            const rawEmails = text.split(/[\n,;]+/);
            const cleanEmails = rawEmails
                .map(email => email.trim())
                .filter(email => email && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)); // Basic email validation

            setRecipientList(prev => [...prev, ...cleanEmails]);

        };
        reader.readAsText(file);
    };

    const handleSend = async (scheduleTime?: string) => {
        if (!senderId) {
            alert('Please select a sender');
            return;
        }

        let finalRecipients = [...recipientList];

        const manualTo = to.trim();
        if (manualTo && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(manualTo)) {
            finalRecipients.push(manualTo);
        } else if (manualTo) {
        }

        finalRecipients = Array.from(new Set(finalRecipients));

        if (finalRecipients.length === 0) {
            alert('Please provide at least one recipient');
            return;
        }

        try {
            await api.post('/schedule', {
                senderId,
                recipients: finalRecipients,
                subject,
                body,
                delay: Number(delay),
                hourlyLimit: Number(hourlyLimit),
                sendAt: scheduleTime
            });
            alert('Campaign Scheduled Successfully');
            navigate('/dashboard');
        } catch (error) {
            console.error('Failed to schedule', error);
            alert('Failed to schedule campaign');
        }
    };



    return (
        <Layout>
            <div className="bg-white min-h-full">
                {/* Header */}
                <div className="flex items-center justify-between px-8 py-6 border-b border-slate-100">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" size="sm" className="p-0 hover:bg-transparent" onClick={() => navigate('/dashboard')}>
                            <ArrowLeft className="w-5 h-5 text-slate-500" />
                        </Button>
                        <h1 className="text-xl font-semibold text-slate-800">Compose New Email</h1>
                    </div>
                    <div className="flex items-center gap-4">
                        <div className="relative group">
                            <span className="absolute top-0 right-0 text-[10px] bg-slate-100 text-slate-500 px-1 rounded-full">{recipientList.length > 0 ? 'File' : ''}</span>
                            <Paperclip className="w-5 h-5 text-slate-400 rotate-45 cursor-pointer hover:text-slate-600" />
                        </div>
                        <Clock className="w-5 h-5 text-slate-400 cursor-pointer hover:text-slate-600" onClick={() => setIsScheduleOpen(true)} />

                        <Button
                            className="bg-[#00AA44] hover:bg-[#00903a] text-white rounded-full px-6 font-medium"
                            onClick={() => setIsScheduleOpen(true)}
                        >
                            Send Later
                        </Button>
                    </div>
                </div>

                <div className="max-w-5xl mx-auto px-8 py-8 space-y-6">
                    {/* From */}
                    <div className="flex items-center gap-8">
                        <label className="w-20 font-medium text-slate-600">From</label>
                        <select
                            className="bg-slate-100 border-none rounded-md px-4 py-2 text-sm text-slate-800 font-medium focus:ring-0 cursor-pointer hover:bg-slate-200 transition-colors"
                            value={senderId || ''}
                            onChange={(e) => setSenderId(e.target.value)}
                        >
                            <option value="" disabled>Select Sender</option>
                            {senders.map(sender => (
                                <option key={sender.id} value={sender.id}>{sender.email}</option>
                            ))}
                        </select>
                    </div>

                    {/* To */}
                    <div className="flex items-center gap-8">
                        <label className="w-20 font-medium text-slate-600">To</label>
                        <div className="flex-1 flex items-center justify-between border-b border-slate-100 pb-2">
                            <Input
                                className="border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-300 text-slate-600"
                                placeholder={recipientList.length > 0 ? `${recipientList.length} recipients uploaded (plus manual entry)` : "recipient@example.com"}
                                value={to}
                                onChange={e => setTo(e.target.value)}
                            />

                            <input
                                type="file"
                                accept=".csv,.txt"
                                ref={fileInputRef}
                                className="hidden"
                                onChange={handleFileUpload}
                            />
                            <button
                                className="flex items-center gap-2 text-[#00AA44] font-medium text-sm hover:underline"
                                onClick={() => fileInputRef.current?.click()}
                            >
                                <Upload className="w-4 h-4" />
                                Upload List
                            </button>
                        </div>
                    </div>
                    {recipientList.length > 0 && (
                        <div className="flex items-center gap-8">
                            <div className="w-20"></div>
                            <div className="flex flex-wrap gap-2">
                                {recipientList.slice(0, 5).map((email, idx) => (
                                    <span key={idx} className="bg-green-50 text-green-700 px-2 py-1 rounded-full text-xs border border-green-100">
                                        {email}
                                    </span>
                                ))}
                                {recipientList.length > 5 && (
                                    <span className="bg-slate-100 text-slate-600 px-2 py-1 rounded-full text-xs border border-slate-200">
                                        +{recipientList.length - 5} more
                                    </span>
                                )}
                            </div>
                        </div>
                    )}

                    {/* Subject */}
                    <div className="flex items-center gap-8">
                        <label className="w-20 font-medium text-slate-600">Subject</label>
                        <Input
                            className="border-none px-0 shadow-none focus-visible:ring-0 placeholder:text-slate-300 border-b border-slate-100 rounded-none pb-2 text-slate-600"
                            placeholder="Subject"
                            value={subject}
                            onChange={e => setSubject(e.target.value)}
                        />
                    </div>

                    {/* Settings */}
                    <div className="flex items-center gap-8 pt-2">
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-800">Delay between 2 emails</label>
                            <Input
                                type="number"
                                className="w-16 h-9 border-slate-200 text-center"
                                placeholder="00"
                                value={delay}
                                onChange={e => setDelay(Number(e.target.value))}
                            />
                        </div>
                        <div className="flex items-center gap-4">
                            <label className="text-sm font-medium text-slate-800">Hourly Limit</label>
                            <Input
                                type="number"
                                className="w-16 h-9 border-slate-200 text-center"
                                placeholder="00"
                                value={hourlyLimit}
                                onChange={e => setHourlyLimit(Number(e.target.value))}
                            />
                        </div>
                    </div>

                    {/* Editor */}
                    <div className="mt-8">
                        <textarea
                            className="w-full min-h-100 p-6 bg-slate-50 border border-slate-200 rounded-lg focus:outline-none focus:ring-1 focus:ring-slate-300 transition-all text-slate-800 leading-relaxed resize-y placeholder:text-slate-400"
                            placeholder="Type your reply..."
                            value={body}
                            onChange={e => setBody(e.target.value)}
                        />
                    </div>
                </div>

                {/* Send Later Modal */}
                <Modal
                    isOpen={isScheduleOpen}
                    onClose={() => setIsScheduleOpen(false)}
                    title="Send Later"
                >
                    <div className="space-y-6">
                        <div className="space-y-2">
                            <label className="text-sm text-slate-500">Pick date & time (Leave blank to send immediately)</label>
                            <div className="relative">
                                <Input
                                    type="datetime-local"
                                    className="w-full"
                                    value={selectedDate}
                                    onChange={(e) => setSelectedDate(e.target.value)}
                                />
                            </div>
                        </div>

                        {/* Quick Picks */}
                        <div className="space-y-2">
                            {['Tomorrow, 10:00 AM', 'Tomorrow, 3:00 PM'].map(label => (
                                <button key={label} className="block text-sm text-slate-600 hover:text-slate-900 w-full text-left py-1 hover:bg-slate-50 px-2 rounded">
                                    {label}
                                </button>
                            ))}
                        </div>

                        <div className="flex justify-between pt-4">
                            <Button variant="ghost" onClick={() => setIsScheduleOpen(false)}>Cancel</Button>
                            <Button
                                className="bg-[#00AA44] hover:bg-[#00903a] text-white rounded-full px-8"
                                onClick={() => {
                                    handleSend(selectedDate);
                                    setIsScheduleOpen(false);
                                }}
                            >
                                Done
                            </Button>
                        </div>
                    </div>
                </Modal>
            </div>
        </Layout>
    );
};

export default ComposePage;
