// using native fetch

async function runTest() {
    const baseUrl = 'http://localhost:3000/api';

    console.log('1. Creating Sender...');
    const senderRes = await fetch(`${baseUrl}/senders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Test Sender',
            email: `sender_${Date.now()}@example.com`,
            hourlyQuota: 5
        })
    });
    const sender = await senderRes.json();
    console.log('Sender Created:', sender);

    if (!sender.id) throw new Error('Failed to create sender');

    console.log('2. Scheduling Email (Immediate)...');
    const emailRes = await fetch(`${baseUrl}/schedule`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            senderId: sender.id,
            recipient: 'recipient@example.com',
            subject: 'Test Email',
            body: 'This is a test email sent from the scheduler.',
            sendAt: new Date().toISOString() // Now
        })
    });
    const email = await emailRes.json();
    console.log('Email Scheduled:', email);

    console.log('Waiting for worker to process...');
    // Sleep 2 seconds
    await new Promise(r => setTimeout(r, 2000));
}

runTest().catch(console.error);
