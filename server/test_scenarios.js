
const baseUrl = 'http://localhost:3000/api';

async function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

async function runScenario() {
    console.log('--- Starting Advanced Verification Scenarios ---');

    console.log('\n[Step 1] Creating Sender with Limit: 2/hour');
    const senderRes = await fetch(`${baseUrl}/senders`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            name: 'Throttled Sender',
            email: `throttled_${Date.now()}@example.com`,
            hourlyQuota: 2
        })
    });
    const sender = await senderRes.json();
    console.log('Sender Created:', sender.id, 'Quota:', sender.hourlyQuota);

    console.log('\n[Step 2] Scheduling 5 Immediate Emails (Burst)...');
    const emailPromises = [];
    for (let i = 0; i < 5; i++) {
        emailPromises.push(fetch(`${baseUrl}/schedule`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                senderId: sender.id,
                recipient: `user_${i}@example.com`,
                subject: `Burst Email ${i}`,
                body: `This is email number ${i}`,
                sendAt: new Date().toISOString()
            })
        }).then(r => r.json()));
    }

    const results = await Promise.all(emailPromises);
    console.log(`Scheduled ${results.length} emails.`);


    console.log('\n[Step 3] Waiting 10 seconds for Worker to process...');
    await sleep(10000);

    console.log('\n--- Scenario Complete ---');
    console.log('CHECK TERMINAL LOGS FOR:');
    console.log('  - 2 "Message sent" logs');
    console.log('  - 3 warnings: "rate limit exceeded... Rescheduling"');
}

runScenario().catch(console.error);
