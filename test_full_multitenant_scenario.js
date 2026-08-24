const { Pool } = require('/mnt/d/explore/virtual-company/src/backend/node_modules/pg');
const http = require('http');

const API_BASE = 'http://localhost:4000/api';
const pool = new Pool({
  connectionString: 'postgresql://postgres:postgres@localhost:5433/company_os'
});

function postReq(path, body, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const data = JSON.stringify(body);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.write(data);
    req.end();
  });
}

function getReq(path, token) {
  return new Promise((resolve, reject) => {
    const url = new URL(API_BASE + path);
    const options = {
      hostname: url.hostname,
      port: url.port,
      path: url.pathname + url.search,
      method: 'GET',
      headers: {
        ...(token ? { 'Authorization': `Bearer ${token}` } : {})
      }
    };
    const req = http.request(options, (res) => {
      let resData = '';
      res.on('data', chunk => resData += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, data: JSON.parse(resData) });
        } catch (e) {
          resolve({ status: res.statusCode, raw: resData });
        }
      });
    });
    req.on('error', reject);
    req.end();
  });
}

async function runTest() {
  console.log('=== STARTING MULTI-TENANT & SYNC SCENARIO TEST ===\n');

  // 1. Test Login as Client A & Client B
  console.log('1. Testing Login...');
  const loginClientA = await postReq('/auth/login', { email: 'client_a@example.com', password: 'password123' });
  console.log('Client A Login Status:', loginClientA.status, 'User:', loginClientA.data.user?.name);
  const tokenA = loginClientA.data.token;

  const loginClientB = await postReq('/auth/login', { email: 'client_b@example.com', password: 'password123' });
  console.log('Client B Login Status:', loginClientB.status, 'User:', loginClientB.data.user?.name);
  const tokenB = loginClientB.data.token;

  const loginOwner = await postReq('/auth/login', { email: 'nano@company.os', password: 'password123' });
  console.log('Owner Login Status:', loginOwner.status, 'User:', loginOwner.data.user?.name);
  const tokenOwner = loginOwner.data.token;

  // 2. Test Project Pipeline Isolation
  console.log('\n2. Testing Project Pipeline Isolation...');
  const projA = await getReq('/projects', tokenA);
  console.log('Client A Projects count:', Array.isArray(projA.data) ? projA.data.length : projA.data, 'Titles:', (projA.data || []).map(p => p.title));
  
  const projB = await getReq('/projects', tokenB);
  console.log('Client B Projects count:', Array.isArray(projB.data) ? projB.data.length : projB.data, 'Titles:', (projB.data || []).map(p => p.title));

  const projOwner = await getReq('/projects', tokenOwner);
  console.log('Owner Projects count (All):', Array.isArray(projOwner.data) ? projOwner.data.length : projOwner.data);

  // 3. Test Activities Isolation & Sync
  console.log('\n3. Testing Activities Stream...');
  const actA = await getReq('/activities', tokenA);
  console.log('Client A Activities count:', Array.isArray(actA.data) ? actA.data.length : actA.data, 'Summaries:', (actA.data || []).map(a => a.summary));

  const actB = await getReq('/activities', tokenB);
  console.log('Client B Activities count:', Array.isArray(actB.data) ? actB.data.length : actB.data, 'Summaries:', (actB.data || []).map(a => a.summary));

  // 4. Test Chat Isolation & Sender Identity
  console.log('\n4. Testing Chat Sender Identity...');
  // Send message as Client B
  const sendB = await postReq('/chat', {
    room_type: 'WAR_ROOM',
    message: 'Halo saya Dr. Siti dari MedikaCare ingin menanyakan update sistem.'
  }, tokenB);
  console.log('Send Chat B status:', sendB.status, 'Sender Name in response:', sendB.data.user_message?.sender_name);

  // Fetch chat as Client B
  const chatB = await getReq('/chat?room_type=WAR_ROOM', tokenB);
  console.log('Client B War Room messages count:', Array.isArray(chatB.data) ? chatB.data.length : chatB.data);
  const lastMsgB = chatB.data[chatB.data.length - 1];
  console.log('Last message sender:', lastMsgB?.sender_name, 'Sender Role:', lastMsgB?.sender_role, 'Message:', lastMsgB?.message);

  // Fetch chat as Client A (should NOT see Client B's messages)
  const chatA = await getReq('/chat?room_type=WAR_ROOM', tokenA);
  console.log('Client A War Room messages count:', Array.isArray(chatA.data) ? chatA.data.length : chatA.data);

  console.log('\n=== SCENARIO TEST FINISHED ===');
  await pool.end();
}

runTest().catch(console.error);
