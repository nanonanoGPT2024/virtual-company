const http = require('http');

function req(path, token) {
  return new Promise((resolve, reject) => {
    const r = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api' + path,
      method: 'GET',
      headers: {
        'Content-Type': 'application/json',
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    r.on('error', reject);
    r.end();
  });
}

function post(path, body, token) {
  return new Promise((resolve, reject) => {
    const data = JSON.stringify(body);
    const r = http.request({
      hostname: 'localhost',
      port: 4000,
      path: '/api' + path,
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Content-Length': Buffer.byteLength(data),
        ...(token ? { 'Authorization': 'Bearer ' + token } : {})
      }
    }, res => {
      let d = '';
      res.on('data', c => d += c);
      res.on('end', () => {
        try { resolve({ status: res.statusCode, data: JSON.parse(d) }); }
        catch(e) { resolve({ status: res.statusCode, raw: d }); }
      });
    });
    r.on('error', reject);
    r.write(data);
    r.end();
  });
}

async function runTest() {
  console.log('=== TEST SYNC: ACTIVITIES STREAM & PROJECT PIPELINE ===\n');

  // 1. Login Client A
  const logA = await post('/auth/login', { email: 'client_a@example.com', password: 'password123' });
  const tokA = logA.data.token;
  console.log('Client A Login:', logA.status, 'User:', logA.data.user.name, 'ID:', logA.data.user.id);

  // 2. Login Client B
  const logB = await post('/auth/login', { email: 'client_b@example.com', password: 'password123' });
  const tokB = logB.data.token;
  console.log('Client B Login:', logB.status, 'User:', logB.data.user.name, 'ID:', logB.data.user.id);

  // 3. Login Owner
  const logO = await post('/auth/login', { email: 'nano@company.os', password: 'owner123' });
  const tokO = logO.data.token;
  console.log('Owner Login:', logO.status, 'User:', logO.data.user.name, 'ID:', logO.data.user.id);

  // 4. Projects Pipeline Query
  const projsA = await req('/projects', tokA);
  console.log('\n[Pipeline Hub] Client A Projects:', projsA.data.map(p => ({ id: p.id, title: p.title, user_id: p.user_id })));

  const projsB = await req('/projects', tokB);
  console.log('[Pipeline Hub] Client B Projects:', projsB.data.map(p => ({ id: p.id, title: p.title, user_id: p.user_id })));

  const projsO = await req('/projects', tokO);
  console.log('[Pipeline Hub] Owner Projects (All):', projsO.data.length, 'projects');

  // 5. Activities Stream Query (Multi-Tenant Scoped)
  const actA = await req('/activities?limit=20', tokA);
  console.log('\n[Live Activities] Client A Logs Count:', actA.data.length);
  actA.data.slice(0, 5).forEach(l => console.log(` - [${l.action_type}] [${l.project_title || l.project_id}] ${l.summary}`));

  const actB = await req('/activities?limit=20', tokB);
  console.log('\n[Live Activities] Client B Logs Count:', actB.data.length);
  actB.data.slice(0, 5).forEach(l => console.log(` - [${l.action_type}] [${l.project_title || l.project_id}] ${l.summary}`));

  const actO = await req('/activities?limit=20', tokO);
  console.log('\n[Live Activities] Owner Global Logs Count:', actO.data.length);

  // Check Sync
  const clientAProjIds = new Set(projsA.data.map(p => p.id));
  const isActASynced = actA.data.every(l => !l.project_id || clientAProjIds.has(l.project_id));
  console.log('\n--> SYNC VERIFICATION Client A (Zero Leakage):', isActASynced ? '✅ 100% MATCH' : '❌ LEAKAGE DETECTED');

  const clientBProjIds = new Set(projsB.data.map(p => p.id));
  const isActBSynced = actB.data.every(l => !l.project_id || clientBProjIds.has(l.project_id));
  console.log('--> SYNC VERIFICATION Client B (Zero Leakage):', isActBSynced ? '✅ 100% MATCH' : '❌ LEAKAGE DETECTED');
}

runTest().catch(console.error);
