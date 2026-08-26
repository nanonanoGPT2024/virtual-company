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

async function runIdeaToProjectSuite() {
  console.log("================================================================================");
  console.log("🧪 QA SUITE: IDEA-TO-PROJECT CONVERSION & MULTI-TENANT ISOLATION");
  console.log("   Target Host: http://localhost:4000");
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

  // 1. AUTHENTICATION PRE-FLIGHT
  console.log("🔑 [1. AUTHENTICATION]");
  const authA = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'client_a@example.com', password: 'password123' }
  );
  const authB = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'client_b@example.com', password: 'password123' }
  );
  const authOwner = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/auth/login', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { email: 'nano@company.os', password: 'owner123' }
  );

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

  // 2. IDEA SCANNING BY CLIENT A
  console.log("💡 [2. IDEA RADAR & SCANNING]");
  const scanResA = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/ideas/scan', method: 'POST', headers: { 'Authorization': `Bearer ${tokenA}` } }
  );
  
  const ideaA = scanResA.data;
  assertTest("Client A berhasil melakukan market scan AI dan menghasilkan ide baru", 
    (scanResA.status === 201 || scanResA.status === 200) && Boolean(ideaA?.title) && ideaA?.user_id === userA.id,
    `Status: HTTP ${scanResA.status}, Title: "${ideaA?.title}", user_id: ${ideaA?.user_id}`);

  // Multi-tenant check on ideas
  const ideasB = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/ideas', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } }
  );
  const isIdeaALeakedToB = Array.isArray(ideasB.data) ? ideasB.data.some(i => i.id === ideaA.id && i.user_id === userA.id) : false;
  assertTest("Ide Client A terisolasi (TIDAK bocor ke Idea Radar Client B)", 
    !isIdeaALeakedToB,
    `Leaked to B: ${isIdeaALeakedToB}`);
  console.log("");

  // 3. IDEA-TO-PROJECT CONVERSION WITHOUT TOKEN (MUST FAIL)
  console.log("🛡️ [3. IDEA-TO-PROJECT AUTHENTICATION GATE]");
  const createProjNoToken = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/projects', method: 'POST', headers: { 'Content-Type': 'application/json' } },
    { title: ideaA.title, description: ideaA.problem_statement, goal: ideaA.proposed_solution }
  );

  assertTest("Membuat proyek dari ide TANPA TOKEN wajib ditolak HTTP 401 Unauthorized", 
    createProjNoToken.status === 401,
    `Status: HTTP ${createProjNoToken.status}, Response: ${JSON.stringify(createProjNoToken.data || createProjNoToken.raw)}`);

  // 4. IDEA-TO-PROJECT CONVERSION WITH CLIENT A TOKEN (AUTHORIZED)
  console.log("🚀 [4. IDEA-TO-PROJECT CONVERSION BY CLIENT A]");
  const testProjectTitle = `AutoTest Proj ${Date.now().toString().slice(-4)}`;
  const createProjA = await makeRequest(
    { hostname: 'localhost', port: 4000, path: '/api/projects', method: 'POST', headers: { 'Authorization': `Bearer ${tokenA}`, 'Content-Type': 'application/json' } },
    {
      title: testProjectTitle,
      description: ideaA.problem_statement || 'Test Automated Description',
      goal: ideaA.proposed_solution || 'Test Automated Goal'
    }
  );

  const createdProject = createProjA.data;
  assertTest("Client A berhasil mengonversi ide menjadi Project di Pipeline Hub", 
    createProjA.status === 201 && createdProject?.id && createdProject?.user_id === userA.id,
    `Status: HTTP ${createProjA.status}, Project ID: ${createdProject?.id}, Title: "${createdProject?.title}", user_id: ${createdProject?.user_id}`);
  console.log("");

  // 5. MULTI-TENANT ISOLATION ON NEWLY CREATED PROJECT
  console.log("🔒 [5. MULTI-TENANT ISOLATION ON PIPELINE & ACTIVITIES]");
  const projListA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  const projListB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });
  const projListOwner = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/projects', method: 'GET', headers: { 'Authorization': `Bearer ${tokenOwner}` } });

  const listA = Array.isArray(projListA.data) ? projListA.data : [];
  const listB = Array.isArray(projListB.data) ? projListB.data : [];
  const listOwner = Array.isArray(projListOwner.data) ? projListOwner.data : [];

  const foundInA = listA.some(p => p.id === createdProject?.id);
  const foundInB = listB.some(p => p.id === createdProject?.id);
  const foundInOwner = listOwner.some(p => p.id === createdProject?.id);

  assertTest("Project baru otomatis muncul di Pipeline Hub milik Client A", foundInA, `Total projects Client A: ${listA.length}`);
  assertTest("Project baru TIDAK MUNCUL di Pipeline Hub milik Client B (0% cross-tenant leak)", !foundInB, `Found in B: ${foundInB}`);
  assertTest("Project baru terlihat oleh Owner (God Mode Global View)", foundInOwner, `Total projects Owner: ${listOwner.length}`);

  // Live Activities Scoping (sort=DESC to check latest activities)
  const actA = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities?sort=DESC&limit=50', method: 'GET', headers: { 'Authorization': `Bearer ${tokenA}` } });
  const actB = await makeRequest({ hostname: 'localhost', port: 4000, path: '/api/activities?sort=DESC&limit=50', method: 'GET', headers: { 'Authorization': `Bearer ${tokenB}` } });

  const listActA = Array.isArray(actA.data) ? actA.data : [];
  const listActB = Array.isArray(actB.data) ? actB.data : [];

  const newProjectLogInA = listActA.some(l => l.project_id === createdProject?.id || (l.summary && l.summary.includes(testProjectTitle)));
  const newProjectLogInB = listActB.some(l => l.project_id === createdProject?.id || (l.summary && l.summary.includes(testProjectTitle)));

  assertTest("Inisiasi project baru tercatat di Live Activities feed Client A", newProjectLogInA, `Logged in A: ${newProjectLogInA}`);
  assertTest("Inisiasi project baru TIDAK BOCOR ke Live Activities feed Client B", !newProjectLogInB, `Leaked to B: ${newProjectLogInB}`);
  console.log("");

  // 6. MULTI-TENANT WORKBENCH & CODE ITERATION RESTRICTION
  console.log("🛡️ [6. MULTI-TENANT WORKBENCH & CODE ITERATION RESTRICTION]");
  // Client B tries to patch Client A's new project
  const attackPatch = await makeRequest(
    { hostname: 'localhost', port: 4000, path: `/api/projects/${createdProject?.id}/iterate`, method: 'POST', headers: { 'Authorization': `Bearer ${tokenB}`, 'Content-Type': 'application/json' } },
    { prompt: 'Client B inject code to Client A project', iteration_type: 'HACK' }
  );

  assertTest("Client B dilarang memodifikasi/patch project milik Client A (HTTP 403 Forbidden)", 
    attackPatch.status === 403,
    `Status: HTTP ${attackPatch.status}, Error: ${JSON.stringify(attackPatch.data || attackPatch.raw)}`);

  // Owner tries to patch Client A's new project (Must be read-only inspection)
  const ownerPatch = await makeRequest(
    { hostname: 'localhost', port: 4000, path: `/api/projects/${createdProject?.id}/iterate`, method: 'POST', headers: { 'Authorization': `Bearer ${tokenOwner}`, 'Content-Type': 'application/json' } },
    { prompt: 'Owner try patch client project', iteration_type: 'OWNER_PATCH' }
  );

  assertTest("Owner Mode Inspeksi (Read-Only) dilarang memodifikasi/patch project milik Client A (HTTP 403 Forbidden)", 
    ownerPatch.status === 403 && (ownerPatch.data?.error || '').includes('Mode Inspeksi Read-Only'),
    `Status: HTTP ${ownerPatch.status}, Error: ${JSON.stringify(ownerPatch.data || ownerPatch.raw)}`);

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
  console.log(`   - QA Verdict           : ${failedTests === 0 ? "ALL GREEN (100% PRODUCTION READY)" : "BLOCKED BY BUGS"}`);
  console.log("================================================================================");

  return { totalTests, passedTests, failedTests, passRate };
}

runIdeaToProjectSuite().catch(console.error);
