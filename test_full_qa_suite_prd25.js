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

async function runFullQASuite() {
  console.log("================================================================================");
  console.log("🧪 VIRTULABS FULL QA TEST SUITE — PRD v2.5 VERIFICATION");
  console.log("   Target Host: http://localhost:4000 (Backend API), http://localhost:5173 (Frontend)");
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

  // --- PRE-FLIGHT AUTHENTICATION ---
  console.log("🔑 [PRE-FLIGHT] Authenticating Test Personas...");
  const authA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'client_a@example.com', password: 'password123' });
  const authB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'client_b@example.com', password: 'password123' });
  const authOwner = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } }, { email: 'nano@company.os', password: 'owner123' });

  const tokenA = authA.data?.token;
  const userA = authA.data?.user;
  const tokenB = authB.data?.token;
  const userB = authB.data?.user;
  const tokenOwner = authOwner.data?.token;
  const userOwner = authOwner.data?.user;

  assertTest("Login Client A (Budi Santoso)", authA.status === 200 && Boolean(tokenA), `User ID: ${userA?.id}`);
  assertTest("Login Client B (Dr. Siti Rahma)", authB.status === 200 && Boolean(tokenB), `User ID: ${userB?.id}`);
  assertTest("Login Owner (Nano)", authOwner.status === 200 && Boolean(tokenOwner), `User ID: ${userOwner?.id}`);
  console.log("");

  // ====================================================================================
  // BAGIAN 1: Sinkronisasi Mutlak Antara Live Activities Stream & Project Pipeline Hub
  // ====================================================================================
  console.log("📊 [BAGIAN 1] Sinkronisasi Mutlak: Live Activities Stream & Project Pipeline Hub");

  // 1.1 Skenario Login Client A
  const projA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  const actA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities?limit=50', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });

  const listProjA = Array.isArray(projA.data) ? projA.data : [];
  const listActA = Array.isArray(actA.data) ? actA.data : [];

  const clientAProjIds = new Set(listProjA.map(p => p.id));
  const hasClientBLogsInA = listActA.some(l => l.project_id === 'PROJ-SITI-01' || (l.project_title && l.project_title.includes('MedikaCare')) || (l.summary && l.summary.includes('MedikaCare')));
  const onlyClientALogsInA = listActA.every(l => !l.project_id || clientAProjIds.has(l.project_id));

  assertTest("Client A Pipeline Hub: Menampilkan proyek Kopi Senja (PROJ-BUDI-01)", 
    listProjA.some(p => p.id === 'PROJ-BUDI-01'),
    `Projects: ${listProjA.map(p => p.title).join(', ')}`);

  assertTest("Client A Live Activities: HANYA log proyek Client A (Kopi Senja) & 0 log dari Client B (MedikaCare)", 
    listActA.length > 0 && !hasClientBLogsInA && onlyClientALogsInA,
    `Total Logs A: ${listActA.length}, Client B Log Leak: ${hasClientBLogsInA}`);

  // 1.2 Skenario Login Client B
  const projB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });
  const actB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities?limit=50', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });

  const listProjB = Array.isArray(projB.data) ? projB.data : [];
  const listActB = Array.isArray(actB.data) ? actB.data : [];

  const clientBProjIds = new Set(listProjB.map(p => p.id));
  const hasClientALogsInB = listActB.some(l => l.project_id === 'PROJ-BUDI-01' || (l.project_title && l.project_title.includes('Kopi Senja')) || (l.summary && l.summary.includes('Kopi Senja')));
  const onlyClientBLogsInB = listActB.every(l => !l.project_id || clientBProjIds.has(l.project_id));

  assertTest("Client B Pipeline Hub: Menampilkan proyek MedikaCare (PROJ-SITI-01)", 
    listProjB.some(p => p.id === 'PROJ-SITI-01'),
    `Projects: ${listProjB.map(p => p.title).join(', ')}`);

  assertTest("Client B Live Activities: HANYA log proyek Client B (MedikaCare) & 0 log dari Client A (Kopi Senja)", 
    listActB.length > 0 && !hasClientALogsInB && onlyClientBLogsInB,
    `Total Logs B: ${listActB.length}, Client A Log Leak: ${hasClientALogsInB}`);

  // 1.3 Skenario Login Owner (Global Stream & Filter Per-Klien)
  const actOwnerAll = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities?limit=100', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const listActOwner = Array.isArray(actOwnerAll.data) ? actOwnerAll.data : [];

  const ownerHasA = listActOwner.some(l => l.project_id === 'PROJ-BUDI-01');
  const ownerHasB = listActOwner.some(l => l.project_id === 'PROJ-SITI-01');

  assertTest("Owner Global Live Activities: Memiliki akses melihat seluruh stream gabungan (Client A + Client B)", 
    ownerHasA && ownerHasB && listActOwner.length >= (listActA.length + listActB.length),
    `Total Global Logs: ${listActOwner.length} (Includes Client A: ${ownerHasA}, Client B: ${ownerHasB})`);

  // Owner Filter per Klien
  const projOwnerFilterA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects?user_id=USR-CLIENT-A', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  const projOwnerFilterB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects?user_id=USR-CLIENT-B', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });

  assertTest("Owner Filter Pipeline Hub per Klien: Berhasil memfilter proyek spesifik Client A dan Client B", 
    projOwnerFilterA.data?.every(p => p.user_id === 'USR-CLIENT-A') && projOwnerFilterB.data?.every(p => p.user_id === 'USR-CLIENT-B'),
    `Filter Client A count: ${projOwnerFilterA.data?.length}, Filter Client B count: ${projOwnerFilterB.data?.length}`);
  console.log("");

  // ====================================================================================
  // BAGIAN 2: Workbench Studio & Multi-Tenant Security Gate
  // ====================================================================================
  console.log("🔒 [BAGIAN 2] Workbench Studio & Multi-Tenant Security Gate");

  // 2.1 Owner Mode Inspeksi (Read-Only) pada file project Client A
  const ownerInspectFiles = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects/PROJ-BUDI-01/files', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });
  assertTest("Owner dapat menginspeksi file tree proyek Klien (Read Access)", 
    ownerInspectFiles.status === 200 && Array.isArray(ownerInspectFiles.data?.files),
    `Status: ${ownerInspectFiles.status}, Root files count: ${ownerInspectFiles.data?.files?.length}`);

  // 2.2 Owner dilarang keras mengubah/patch kodingan milik Klien (HTTP 403 Forbidden)
  const ownerPatchAttempt = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/projects/PROJ-BUDI-01/iterate',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenOwner}`, 'Content-Type': 'application/json' }
  }, {
    prompt: 'Owner coba patch paksa kodingan Budi',
    iteration_type: 'SECURITY_TEST'
  });

  assertTest("Owner Mode Inspeksi (Read-Only): Ditolak keras dengan HTTP 403 Forbidden saat patch proyek Klien", 
    ownerPatchAttempt.status === 403 && (ownerPatchAttempt.data?.error || '').includes('Mode Inspeksi Read-Only'),
    `Status: HTTP ${ownerPatchAttempt.status}, Response: ${JSON.stringify(ownerPatchAttempt.data || ownerPatchAttempt.raw)}`);

  // 2.3 Client A mencoba patch proyek Client B (Cross-Tenant Attack -> HTTP 403)
  const crossTenantPatchAttempt = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/projects/PROJ-SITI-01/iterate',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' }
  }, {
    prompt: 'Client A hack Client B project',
    iteration_type: 'ATTACK'
  });

  assertTest("Client A mencoba patch proyek Client B: Ditolak dengan HTTP 403 Forbidden", 
    crossTenantPatchAttempt.status === 403,
    `Status: HTTP ${crossTenantPatchAttempt.status}, Response: ${JSON.stringify(crossTenantPatchAttempt.data || crossTenantPatchAttempt.raw)}`);

  // 2.4 Verifikasi Klien Pemilik: Klien sah dapat mengakses file & Workbench miliknya sendiri
  const clientAFiles = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects/PROJ-BUDI-01/files', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  assertTest("Klien Sah (Client A) memiliki akses penuh membaca file tree miliknya", 
    clientAFiles.status === 200 && Array.isArray(clientAFiles.data?.files),
    `Status: ${clientAFiles.status}, Root files count: ${clientAFiles.data?.files?.length}`);

  // Revisions & Document metadata accessible by owner & client
  const clientARevisions = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects/PROJ-BUDI-01/revisions', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  assertTest("Klien Sah (Client A) dapat melihat riwayat revisi dan changelog iterasi", 
    clientARevisions.status === 200 && Array.isArray(clientARevisions.data),
    `Revisions count: ${clientARevisions.data?.length}`);

  // Contextual Chat PM
  const clientAChatPM = await makeRequest({
    hostname: 'localhost',
    port: 4000,
    path: '/api/projects/PROJ-BUDI-01/chat-pm',
    method: 'POST',
    headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' }
  }, {
    message: 'Halo Sarah, tolong jelaskan struktur modul POS ini.'
  });
  assertTest("Klien Sah (Client A) dapat melakukan contextual chat dengan PM Sarah", 
    clientAChatPM.status === 200 && Boolean(clientAChatPM.data?.reply),
    `PM Reply length: ${clientAChatPM.data?.reply?.length} chars`);

  console.log("");

  // ====================================================================================
  // BAGIAN 3: Live Service & Micro-App Running Verification (Port 5001 & 5173)
  // ====================================================================================
  console.log("🌐 [BAGIAN 3] Live Service & Micro-App Verification");
  const microApp5001 = await makeRequest({ hostname: 'localhost', port: 5001, path: '/', method: 'GET' });
  assertTest("Micro-App Kopi Senja POS (Port 5001) berjalan dan dapat diakses (Live Preview Ready)", 
    microApp5001.status === 200,
    `Status: HTTP ${microApp5001.status}`);

  const feService = await makeRequest({ hostname: 'localhost', port: 5173, path: '/', method: 'GET' });
  assertTest("Frontend Dashboard (Port 5173) berjalan normal dan merespons", 
    feService.status === 200,
    `Status: HTTP ${feService.status}`);

  console.log("");

  // ====================================================================================
  // SUMMARY & VERDICT
  // ====================================================================================
  const passRate = ((passedTests / totalTests) * 100).toFixed(1);
  console.log("================================================================================");
  console.log(`📊 FINAL QA VERIFICATION SUMMARY:`);
  console.log(`   - Total Executed Test Cases : ${totalTests}`);
  console.log(`   - Passed Test Cases         : ${passedTests}`);
  console.log(`   - Failed Test Cases         : ${failedTests}`);
  console.log(`   - Quality Score / Pass Rate : ${passRate}%`);
  console.log(`   - QA Verdict                : ${failedTests === 0 ? "ALL GREEN (100% PRODUCTION & RELEASE READY)" : "BLOCKED"}`);
  console.log("================================================================================");

  return { totalTests, passedTests, failedTests, passRate };
}

runFullQASuite().catch(console.error);
