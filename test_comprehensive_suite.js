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

async function runComprehensiveSuite() {
  console.log("================================================================================");
  console.log("🧪 VIRTULABS ENTERPRISE SQA AUTOMATED TEST RUNNER");
  console.log("   Target: Multi-Tenant Data Isolation, Chat Sender Identity & Endpoint Security");
  console.log("   Host: http://localhost:4000");
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

  // PRE-FLIGHT AUTHENTICATION
  console.log("🔑 [PRE-FLIGHT] Authenticating Test Personas...");
  const authA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'client_a@example.com', password: 'password123' });
  const authB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'client_b@example.com', password: 'password123' });
  const authOwner = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'nano@company.os', password: 'owner123' });

  const tokenA = authA.data?.token;
  const tokenB = authB.data?.token;
  const tokenOwner = authOwner.data?.token;

  console.log(`   - Client A: ${authA.data?.user?.name} (Token OK: ${Boolean(tokenA)})`);
  console.log(`   - Client B: ${authB.data?.user?.name} (Token OK: ${Boolean(tokenB)})`);
  console.log(`   - Root Owner: ${authOwner.data?.user?.name} (Token OK: ${Boolean(tokenOwner)})\n`);

  // ====================================================================================
  // SKENARIO 1: Keamanan Akses Tanpa Token (Zero Token Leakage)
  // ====================================================================================
  console.log("🛡️ [SKENARIO 1] Keamanan Akses Tanpa Token (Zero Token Leakage)");
  
  // 1.1 GET /api/projects without token
  const resProjNoToken = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET' });
  // Note: projects endpoint without token returns empty or 401. Let's check:
  assertTest("GET /api/projects (Tanpa Token) harus menolak / tidak membocorkan data tenant", 
    resProjNoToken.status === 401 || (Array.isArray(resProjNoToken.data) && resProjNoToken.data.length === 0) || resProjNoToken.status === 403,
    `Status: HTTP ${resProjNoToken.status}, Data items: ${Array.isArray(resProjNoToken.data) ? resProjNoToken.data.length : 'N/A'}`);

  // 1.2 GET /api/activities without token
  const resActNoToken = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities', method: 'GET' });
  assertTest("GET /api/activities (Tanpa Token) harus menolak / tidak membocorkan data tenant", 
    resActNoToken.status === 401 || (Array.isArray(resActNoToken.data) && resActNoToken.data.length === 0) || resActNoToken.status === 403,
    `Status: HTTP ${resActNoToken.status}, Data items: ${Array.isArray(resActNoToken.data) ? resActNoToken.data.length : 'N/A'}`);

  // 1.3 GET /api/chat without token
  const resChatNoToken = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/chat', method: 'GET' });
  assertTest("GET /api/chat (Tanpa Token) wajib HTTP 401 Unauthorized", 
    resChatNoToken.status === 401,
    `Status: HTTP ${resChatNoToken.status}, Response: ${JSON.stringify(resChatNoToken.data || resChatNoToken.raw)}`);

  // 1.4 GET /api/ideas without token
  const resIdeasNoToken = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/ideas', method: 'GET' });
  // ideas without token only returns global public ideas (user_id IS NULL) or 401
  const customIdeasLeaked = Array.isArray(resIdeasNoToken.data) ? resIdeasNoToken.data.some(i => i.user_id !== null) : false;
  assertTest("GET /api/ideas (Tanpa Token) TIDAK BOLEH membocorkan ide kustom tenant", 
    !customIdeasLeaked,
    `Custom ideas leaked: ${customIdeasLeaked}`);

  // 1.5 GET /api/admin/users without token
  const resAdminNoToken = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/admin/users', method: 'GET' });
  assertTest("GET /api/admin/users (Tanpa Token) wajib HTTP 403 Forbidden / 401 Unauthorized", 
    resAdminNoToken.status === 403 || resAdminNoToken.status === 401,
    `Status: HTTP ${resAdminNoToken.status}, Response: ${JSON.stringify(resAdminNoToken.data || resAdminNoToken.raw)}`);

  console.log("");

  // ====================================================================================
  // SKENARIO 2: Isolasi Data Proyek (Pipeline Cross-Leakage)
  // ====================================================================================
  console.log("🔒 [SKENARIO 2] Isolasi Data Proyek (Pipeline Cross-Leakage)");
  const resProjA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  const resProjB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });

  const listProjA = Array.isArray(resProjA.data) ? resProjA.data : [];
  const listProjB = Array.isArray(resProjB.data) ? resProjB.data : [];

  const aOnlyHasBudi = listProjA.every(p => p.user_id === 'USR-CLIENT-A');
  const bOnlyHasSiti = listProjB.every(p => p.user_id === 'USR-CLIENT-B');
  const projectIntersection = listProjA.filter(pa => listProjB.some(pb => pb.id === pa.id));

  assertTest("Client A HANYA melihat proyek miliknya (USR-CLIENT-A / PROJ-BUDI-01)", 
    aOnlyHasBudi && listProjA.length > 0,
    `Found ${listProjA.length} projects: ${listProjA.map(p => p.title).join(', ')}`);

  assertTest("Client B HANYA melihat proyek miliknya (USR-CLIENT-B / PROJ-SITI-01)", 
    bOnlyHasSiti && listProjB.length > 0,
    `Found ${listProjB.length} projects: ${listProjB.map(p => p.title).join(', ')}`);

  assertTest("Overlap data proyek antara Client A dan Client B WAJIB 0%", 
    projectIntersection.length === 0,
    `Overlap count: ${projectIntersection.length}`);

  console.log("");

  // ====================================================================================
  // SKENARIO 3: Isolasi Log Aktivitas (Activity Feed Scoping)
  // ====================================================================================
  console.log("📊 [SKENARIO 3] Isolasi Log Aktivitas (Activity Feed Scoping)");
  const resActA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  const resActB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });

  const listActA = Array.isArray(resActA.data) ? resActA.data : [];
  const listActB = Array.isArray(resActB.data) ? resActB.data : [];

  const actProjectsA = [...new Set(listActA.map(a => a.project_title))];
  const actProjectsB = [...new Set(listActB.map(a => a.project_title))];

  const actOverlap = actProjectsA.filter(pa => actProjectsB.includes(pa));

  assertTest("Log aktivitas Client A HANYA berisi aktivitas dari proyek miliknya", 
    actProjectsA.length > 0 && !actProjectsA.includes('Portal HR & Absensi Digital PT Rahma'),
    `Client A activities: [${actProjectsA.join(', ')}]`);

  assertTest("Log aktivitas Client B HANYA berisi aktivitas dari proyek miliknya", 
    actProjectsB.length > 0 && !actProjectsB.includes('Sistem Kasir & POS Coffee Shop Budi'),
    `Client B activities: [${actProjectsB.join(', ')}]`);

  assertTest("Cross-tenant Activity log overlap WAJIB 0%", 
    actOverlap.length === 0,
    `Overlap items: ${actOverlap.length}`);

  console.log("");

  // ====================================================================================
  // SKENARIO 4: Identitas Pengirim & Isolasi Percakapan Chatbot AI
  // ====================================================================================
  console.log("💬 [SKENARIO 4] Identitas Pengirim & Isolasi Percakapan Chatbot AI");
  
  // 4.1 Client A sends chat to CEO
  console.log("   -> Sending message from Client A (Budi Santoso) to CEO...");
  const chatReqA = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/chat', method: 'POST', headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' } },
    { message: 'Halo CEO, tolong bantu cek progres POS cafe saya.', recipient_id: 'EMP-CEO' }
  );

  const replyA = chatReqA.data?.agent_reply?.message || '';
  console.log(`   └─ AI Response to Client A: "${replyA.substring(0, 150)}..."`);
  
  const greetingMatchesClientA = /Budi|Bapak Budi|Pak Budi|Bapak\/Ibu/i.test(replyA);
  const greetingDoesNotSayNano = !/Bang Nano|Owner Nano/i.test(replyA);

  assertTest("Sapaan balasan AI ke Client A WAJIB menyapa Bapak Budi / Klien, BUKAN 'Bang Nano'", 
    greetingMatchesClientA && greetingDoesNotSayNano,
    `Sapaan valid: ${greetingMatchesClientA}, Tidak menyapa Nano: ${greetingDoesNotSayNano}`);

  // 4.2 Owner sends chat to CEO
  console.log("   -> Sending message from Root Owner (Nano) to CEO...");
  const chatReqOwner = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/chat', method: 'POST', headers: { 'Authorization': `Bearer ${tokenOwner}`, 'Content-Type': 'application/json' } },
    { message: 'Halo CEO, bagaimana performa server hari ini?', recipient_id: 'EMP-CEO' }
  );

  const replyOwner = chatReqOwner.data?.agent_reply?.message || '';
  console.log(`   └─ AI Response to Owner: "${replyOwner.substring(0, 150)}..."`);

  const greetingMatchesOwner = /Owner|Bang Nano|Nano/i.test(replyOwner);
  assertTest("Sapaan balasan AI ke Root Owner WAJIB menyapa Owner / Bang Nano", 
    greetingMatchesOwner,
    `Sapaan Owner terdeteksi: ${greetingMatchesOwner}`);

  // 4.3 Client B inspects chat history
  const chatHistoryB = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/chat', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } }
  );

  const listChatB = Array.isArray(chatHistoryB.data) ? chatHistoryB.data : [];
  const clientAChatInB = listChatB.some(m => m.user_id === 'USR-CLIENT-A' || (m.message && m.message.includes('POS cafe saya')));

  assertTest("Client B TIDAK DAPAT melihat riwayat percakapan antara Client A dengan AI", 
    !clientAChatInB,
    `Client A chat leaked into Client B history: ${clientAChatInB}`);

  console.log("");

  // ====================================================================================
  // SKENARIO 5: Isolasi Idea Radar (Market Research)
  // ====================================================================================
  console.log("💡 [SKENARIO 5] Isolasi Idea Radar (Market Research)");
  console.log("   -> Client A scanning new market idea via AI Researcher...");
  const scanIdeaA = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/ideas/scan', method: 'POST', headers: { 'Authorization': `Bearer ${tokenA}` } }
  );

  const generatedIdeaTitle = scanIdeaA.data?.title || 'Idea Scan Test';
  console.log(`   └─ Scanned Idea Title: "${generatedIdeaTitle}" (user_id: ${scanIdeaA.data?.user_id})`);

  assertTest("Ide yang discan Client A terikat ke user_id USR-CLIENT-A", 
    scanIdeaA.data?.user_id === 'USR-CLIENT-A',
    `Idea user_id: ${scanIdeaA.data?.user_id}`);

  // Client B checks ideas
  const ideasB = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/ideas', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } }
  );

  const listIdeasB = Array.isArray(ideasB.data) ? ideasB.data : [];
  const ideaInB = listIdeasB.some(i => i.title === generatedIdeaTitle && i.user_id === 'USR-CLIENT-A');

  assertTest("Ide kustom Client A TIDAK MUNCUL saat Client B mengakses GET /api/ideas", 
    !ideaInB,
    `Client A Idea leaked in Client B radar: ${ideaInB}`);

  console.log("");

  // ====================================================================================
  // SKENARIO 6: Hak Istimewa Root Owner & User Directory Filter
  // ====================================================================================
  console.log("👑 [SKENARIO 6] Hak Istimewa Root Owner & User Directory Filter");

  // 6.1 Owner lists all users
  const adminUsers = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/admin/users', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } }
  );

  const usersList = adminUsers.data?.users || [];
  const hasBudi = usersList.some(u => u.email === 'client_a@example.com');
  const hasSiti = usersList.some(u => u.email === 'client_b@example.com');

  assertTest("Owner berhasil mengakses User Directory (GET /api/admin/users) berisi seluruh tenant", 
    adminUsers.status === 200 && hasBudi && hasSiti,
    `Found ${usersList.length} users: ${usersList.map(u => u.name).join(', ')}`);

  // 6.2 Owner filter per user
  const ownerFilterA = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/projects?user_id=USR-CLIENT-A', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } }
  );

  const listOwnerFilterA = Array.isArray(ownerFilterA.data) ? ownerFilterA.data : [];
  const onlyClientAProjects = listOwnerFilterA.every(p => p.user_id === 'USR-CLIENT-A');

  assertTest("Owner dapat memfilter proyek spesifik milik Client A (?user_id=USR-CLIENT-A)", 
    onlyClientAProjects && listOwnerFilterA.length > 0,
    `Projects returned: ${listOwnerFilterA.map(p => p.title).join(', ')}`);

  // 6.3 Client A tries to access Admin User Directory
  const clientAAdminAccess = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/admin/users', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } }
  );

  assertTest("Client A mencoba akses GET /api/admin/users WAJIB DITOLAK dengan HTTP 403 Forbidden", 
    clientAAdminAccess.status === 403,
    `Status: HTTP ${clientAAdminAccess.status}, Error: ${JSON.stringify(clientAAdminAccess.data || clientAAdminAccess.raw)}`);

  console.log("");

  // ====================================================================================
  // SUMMARY & METRICS
  // ====================================================================================
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log("================================================================================");
  console.log(`📊 FINAL TEST SUMMARY:`);
  console.log(`   - Total Executed Tests : ${totalTests}`);
  console.log(`   - Passed Tests         : ${passedTests}`);
  console.log(`   - Failed Tests         : ${failedTests}`);
  console.log(`   - Test Pass Rate       : ${passRate}%`);
  console.log(`   - Verification Verdict : ${failedTests === 0 ? "ALL GREEN (100% PRODUCTION READY)" : "BLOCKED BY BUGS"}`);
  console.log("================================================================================");

  return { totalTests, passedTests, failedTests, passRate };
}

runComprehensiveSuite().catch(console.error);
