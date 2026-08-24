const http = require('http');

function makeRequest(options, data = null) {
  return new Promise((resolve, reject) => {
    const req = http.request(options, (res) => {
      let body = '';
      res.on('data', (chunk) => body += chunk);
      res.on('end', () => {
        try {
          resolve({ status: res.statusCode, headers: res.headers, data: JSON.parse(body) });
        } catch {
          resolve({ status: res.statusCode, headers: res.headers, raw: body });
        }
      });
    });
    req.on('error', reject);
    if (data) req.write(JSON.stringify(data));
    req.end();
  });
}

async function runAllMenuGate() {
  console.log("================================================================================");
  console.log("🧪 VIRTULABS ALL MENU QA GATE VERIFICATION");
  console.log("   Target: /mnt/d/explore/virtual-company (Backend: 4000, Frontend: 5173)");
  console.log("================================================================================\n");

  let totalTests = 0;
  let passedTests = 0;
  let failedTests = 0;

  function assertTest(title, condition, details = "") {
    totalTests++;
    if (condition) {
      passedTests++;
      console.log(`  ✅ [PASS] ${title}`);
      if (details) console.log(`     └─ Note: ${details}`);
    } else {
      failedTests++;
      console.error(`  ❌ [FAIL] ${title}`);
      if (details) console.error(`     └─ Error: ${details}`);
    }
  }

  // 1. AUTHENTICATION
  console.log("🔑 [1. AUTHENTICATION & LOGIN]");
  const authOwner = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'nano@company.os', password: 'owner123' });
  const authClientB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'client_b@example.com', password: 'password123' });
  const authClientA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'client_a@example.com', password: 'password123' });

  const tokenOwner = authOwner.data?.token;
  const userOwner = authOwner.data?.user;
  const tokenB = authClientB.data?.token;
  const userB = authClientB.data?.user;
  const tokenA = authClientA.data?.token;
  const userA = authClientA.data?.user;

  assertTest("Login Root Owner (nano@company.os)", authOwner.status === 200 && userOwner?.role === 'OWNER', `Role: ${userOwner?.role}, ID: ${userOwner?.id}`);
  assertTest("Login Client B (client_b@example.com)", authClientB.status === 200 && userB?.role === 'CLIENT', `Name: ${userB?.name}, ID: ${userB?.id}`);
  assertTest("Login Client A (client_a@example.com)", authClientA.status === 200 && userA?.role === 'CLIENT', `Name: ${userA?.name}, ID: ${userA?.id}`);
  console.log("");

  // 2. MENU: USER DIRECTORY & OWNER INSPECT CLIENT B PIPELINE
  console.log("👥 [2. MENU: USER DIRECTORY & INSPECT CLIENT B]");
  const userDirRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/admin/users', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const usersList = userDirRes.data?.users || [];
  const sitiRecord = usersList.find(u => u.email === 'client_b@example.com');
  
  assertTest("User Directory menampilkan Client B (Siti Rahma)", 
    Boolean(sitiRecord) && sitiRecord.name.includes('Siti Rahma'),
    `Found: ${sitiRecord?.name} (${sitiRecord?.email}), Total Proj: ${sitiRecord?.total_projects}`);

  // Inspect Client B Pipeline using ?user_id=USR-CLIENT-B
  const inspectBRes = await makeRequest({ hostname: 'localhost', port: 4000, path: `/api/projects?user_id=${userB.id}`, method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const inspectBProjects = Array.isArray(inspectBRes.data) ? inspectBRes.data : [];
  const hasHRProj = inspectBProjects.some(p => p.title.includes('Portal HR') || p.id === 'PROJ-SITI-01');
  const noAProjInInspectB = !inspectBProjects.some(p => p.user_id === 'USR-CLIENT-A');

  assertTest("Owner [🔍 Lihat Pipeline Client B] MUNCUL 100% Proyek 'Portal HR & Absensi Digital PT Rahma'", 
    hasHRProj && inspectBProjects.length > 0 && noAProjInInspectB,
    `Proyek ditemukan: ${inspectBProjects.map(p => p.title).join(', ')}`);
  console.log("");

  // 3. MENU: CLIENT B PROJECT PIPELINE
  console.log("📁 [3. MENU: PROJECT PIPELINE - CLIENT B]");
  const clientBProjRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });
  const clientBProjects = Array.isArray(clientBProjRes.data) ? clientBProjRes.data : [];
  const bSeesHR = clientBProjects.some(p => p.title.includes('Portal HR'));
  const bSeesKasir = clientBProjects.some(p => p.title.includes('Kasir') || p.title.includes('POS'));

  assertTest("Client B membuka Pipeline: Proyek 'Portal HR' muncul 100%", bSeesHR, `Proyek Client B: ${clientBProjects.map(p => p.title).join(', ')}`);
  assertTest("Client B membuka Pipeline: Proyek Client A ('Sistem Kasir') TIDAK ADA (Zero Leak)", !bSeesKasir, `Kasir project in B: ${bSeesKasir}`);
  console.log("");

  // 4. MENU: CHATBOT AI (WAR ROOM / DIRECT) CLIENT B GREETING
  console.log("💬 [4. MENU: CHATBOT AI - SENDER IDENTITY]");
  console.log("   -> Client B (Siti Rahma) sending message to CEO...");
  const chatBRes = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/chat', method: 'POST', headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' } },
    { message: 'Halo CEO, tolong update status modul absensi digital karyawan kami.', recipient_id: 'EMP-CEO' }
  );

  const replyB = chatBRes.data?.agent_reply?.message || '';
  console.log(`   └─ AI Response: "${replyB.substring(0, 160)}..."`);

  const greetingMatchesSiti = /Siti|Ibu Siti|Ibu Rahma|Siti Rahma|Bapak\/Ibu/i.test(replyB);
  const doesNotSayNano = !/Bang Nano|Owner Nano/i.test(replyB);

  assertTest("Saat Client B chat, AI menyapa 'Ibu Siti Rahma' / 'Ibu Rahma' / 'Klien'", greetingMatchesSiti, `Sapaan Siti terdeteksi: ${greetingMatchesSiti}`);
  assertTest("Saat Client B chat, AI TIDAK MENYAPA 'Nano' / 'Bang Nano'", doesNotSayNano, `Bebas dari sapaan Nano: ${doesNotSayNano}`);
  console.log("");

  // 5. TAB 1: 3D OFFICE & EMPLOYEES
  console.log("🏢 [5. TAB: 3D OFFICE & EMPLOYEES / AGENTS]");
  const agentsRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/agents', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const companyRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/company', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });

  const agentsList = Array.isArray(agentsRes.data) ? agentsRes.data : [];
  const hasCEO = agentsList.some(a => a.id === 'EMP-CEO');
  const hasCTO = agentsList.some(a => a.id === 'EMP-DEV' || a.id === 'EMP-CTO' || a.id === 'EMP-ARCH');

  assertTest("Endpoint /api/agents mengembalikan daftar agen C-Level lengkap", agentsRes.status === 200 && agentsList.length >= 7 && hasCEO, `Total Agen: ${agentsList.length}`);
  assertTest("Endpoint /api/company mengembalikan struktur divisi perusahaan", companyRes.status === 200 && companyRes.data?.departments?.length > 0, `Divisi: ${companyRes.data?.departments?.length}`);
  console.log("");

  // 6. TAB 2: IDEA RADAR (MARKET RESEARCH)
  console.log("💡 [6. TAB: IDEA RADAR]");
  const ideasOwnerRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/ideas', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const ideasBRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/ideas', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });

  assertTest("Endpoint /api/ideas (Owner) mengembalikan daftar ide riset pasar", ideasOwnerRes.status === 200 && Array.isArray(ideasOwnerRes.data), `Total Ide: ${ideasOwnerRes.data?.length}`);
  assertTest("Endpoint /api/ideas (Client B) terisolasi (hanya ide miliknya + starter)", ideasBRes.status === 200 && ideasBRes.data?.every(i => i.user_id === userB.id || i.user_id === null), `Total Ide B: ${ideasBRes.data?.length}`);
  console.log("");

  // 7. TAB 3: ACTIVITY FEED
  console.log("📊 [7. TAB: ACTIVITY FEED]");
  const actOwnerRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const actBRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });

  assertTest("Endpoint /api/activities (Owner) mengembalikan seluruh live log aktivitas", actOwnerRes.status === 200 && actOwnerRes.data?.length > 0, `Total Log Owner: ${actOwnerRes.data?.length}`);
  assertTest("Endpoint /api/activities (Client B) terfilter hanya proyek Client B", actBRes.status === 200 && actBRes.data?.every(a => a.project_title?.includes('Portal HR')), `Total Log Client B: ${actBRes.data?.length}`);
  console.log("");

  // 8. TAB 4: FINANCE / TOKEN AUDITOR
  console.log("💰 [8. TAB: FINANCE / TOKEN AUDITOR & METRICS]");
  // Check token usages and project documents for single project
  const singleProjRes = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects/PROJ-SITI-01', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  
  assertTest("Endpoint /api/projects/:id mengembalikan detail project, documents, & token costs", 
    singleProjRes.status === 200 && Boolean(singleProjRes.data?.project) && Array.isArray(singleProjRes.data?.costs),
    `Documents count: ${singleProjRes.data?.documents?.length}, Costs records: ${singleProjRes.data?.costs?.length}`);
  console.log("");

  // 9. FRONTEND INTEGRITY CHECK (PORT 5173 / PRODUCTION PREVIEW)
  console.log("🌐 [9. FRONTEND PRODUCTION PREVIEW & UI COMPONENTS]");
  const feRes = await makeRequest({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
  assertTest("Frontend Web Service berjalan di port 5173", feRes.status === 200, `HTML Title loaded, size: ${feRes.raw?.length} bytes`);

  // ====================================================================================
  // SUMMARY
  // ====================================================================================
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log("\n================================================================================");
  console.log(`📊 FINAL ALL MENU QA SUMMARY:`);
  console.log(`   - Total Menu Tests : ${totalTests}`);
  console.log(`   - Passed           : ${passedTests}`);
  console.log(`   - Failed           : ${failedTests}`);
  console.log(`   - Pass Rate        : ${passRate}%`);
  console.log(`   - Overall Status   : ${failedTests === 0 ? "ALL GREEN (100% PASS)" : "FAILURES DETECTED"}`);
  console.log("================================================================================\n");
}

runAllMenuGate().catch(console.error);
