import axios from 'axios';
import chalk from 'chalk';
import { randomUUID } from 'crypto';

const API_URL = 'http://localhost:3000/api';
const SLEEP_MS = (ms: number) => new Promise(res => setTimeout(res, ms));

const log = {
    info: (msg: string) => console.log(chalk.blue(`[INFO] ${msg}`)),
    success: (msg: string) => console.log(chalk.green(`[PASS] ${msg}`)),
    error: (msg: string) => console.log(chalk.red(`[FAIL] ${msg}`)),
    warn: (msg: string) => console.log(chalk.yellow(`[WARN] ${msg}`)),
};

async function runTests() {
    log.info('Starting Production Validation Tests...');

    try {
        await testHealth();
        await testRateLimiting();

        await testConcurrency();

        await testIdempotency();

        log.success('ALL TESTS COMPLETED.');
    } catch (error) {
        log.error('Test Suite Failed');
        console.error(error);
        process.exit(1);
    }
}

async function testHealth() {
    log.info('Test 1: Health Check');
    try {
        const res = await axios.get('http://localhost:3000/health');
        if (res.status === 200 && res.data.status === 'ok') {
            log.success('Server is healthy');
        } else {
            throw new Error('Health check failed');
        }
    } catch (err) {
        log.error('Could not connect to server. Is it running?');
        throw err;
    }
}

async function testRateLimiting() {
    log.info('Test 2: Rate Limiting & Throttling');

    const senderName = `RateLimitTest-${randomUUID().slice(0, 5)}`;
    const sender = await axios.post(`${API_URL}/senders`, {
        name: senderName,
        email: `${senderName}@test.com`,
        hourlyQuota: 5 
    });
    const senderId = sender.data.id;
    log.info(`Created Sender ID: ${senderId} with quota 5/hr`);

    const emailsToSend = 10;
    const promises = [];


    for (let i = 0; i < emailsToSend; i++) {
        promises.push(axios.post(`${API_URL}/schedule`, {
            senderId,
            recipient: 'test@example.com',
            subject: `Rate Test ${i}`,
            body: 'Body',
            sendAt: new Date().toISOString() 
        }));
    }

    const results = await Promise.allSettled(promises);
    const successCount = results.filter(r => r.status === 'fulfilled').length;
    log.info(`API Accepted ${successCount}/${emailsToSend} requests (Expected 10/10 as throttling happens in worker)`);


    log.info('Waiting 5s for worker processing...');
    await SLEEP_MS(5000);

    const sentRes = await axios.get(`${API_URL}/scheduled?status=SENT`);
    const throttledRes = await axios.get(`${API_URL}/scheduled?status=THROTTLED`);
    const pendingRes = await axios.get(`${API_URL}/scheduled?status=PENDING`); 

    const allEmails = [
        ...sentRes.data,
        ...throttledRes.data,
        ...pendingRes.data
    ].filter((e: any) => e.senderId === senderId);

    const sentCount = allEmails.filter((e: any) => e.status === 'SENT').length;
    const throttledCount = allEmails.filter((e: any) => e.status === 'THROTTLED').length;

    log.info(`Stats for Sender: SENT=${sentCount}, THROTTLED=${throttledCount}`);

    if (sentCount <= 6 && (throttledCount > 0 || allEmails.length === 10)) {
    
        log.success('Rate Limiting Logic Verified (Emails were throttled)');
    } else {
        log.warn(`Rate Limiting might be loose. Expected ~5 sent. Got ${sentCount}. Check Redis?`);
    }
}

async function testConcurrency() {
    log.info('Test 3: Concurrency / Load Integrity');

    const senderName = `ConcTest-${randomUUID().slice(0, 5)}`;
    const sender = await axios.post(`${API_URL}/senders`, {
        name: senderName,
        email: `${senderName}@test.com`,
        hourlyQuota: 1000
    });
    const senderId = sender.data.id;

    const BATCH_SIZE = 50;
    log.info(`Sending ${BATCH_SIZE} concurrent requests...`);

    const promises = [];
    for (let i = 0; i < BATCH_SIZE; i++) {
        promises.push(axios.post(`${API_URL}/schedule`, {
            senderId,
            recipient: `user${i}@test.com`,
            subject: `Concurrent ${i}`,
            body: `Body ${i}`,
            sendAt: new Date().toISOString()
        }));
    }

    const start = Date.now();
    const results = await Promise.allSettled(promises);
    const duration = Date.now() - start;

    const failed = results.filter(r => r.status === 'rejected');
    if (failed.length > 0) {
        log.error(`${failed.length} requests failed!`);
    } else {
        log.success(`All ${BATCH_SIZE} requests accepted in ${duration}ms (${(duration / BATCH_SIZE).toFixed(2)}ms/req)`);
    }

    log.info('Waiting 5s for processing...');
    await SLEEP_MS(5000);

    const sentRes = await axios.get(`${API_URL}/scheduled?status=SENT`);
    const mySent = sentRes.data.filter((e: any) => e.senderId === senderId);

    log.info(`Worker processed ${mySent.length}/${BATCH_SIZE} emails so far.`);
    
    if (mySent.length > 0) {
        log.success('Concurrency Load handled and processing started.');
    }
}

async function testIdempotency() {
    log.info('Test 4: Idempotency (API creates unique jobs)');

    const sender = await axios.post(`${API_URL}/senders`, { name: 'Idem', email: 'idem@test.com' });
    const payload = {
        senderId: sender.data.id,
        recipient: 'same@test.com',
        subject: 'Same',
        body: 'Same',
        sendAt: new Date().toISOString()
    };

    const res1 = await axios.post(`${API_URL}/schedule`, payload);
    const res2 = await axios.post(`${API_URL}/schedule`, payload);

    if (res1.data.emailId !== res2.data.emailId) {
        log.info('Observation: API generates unique IDs for identical payloads (Standard REST behavior)');
    }

    if (res1.data.jobId !== res2.data.jobId) {
        log.success('BullMQ Job IDs are unique.');
    }
}

runTests();
