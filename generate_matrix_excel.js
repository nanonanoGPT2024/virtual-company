const ExcelJS = require('/mnt/d/explore/virtual-company/src/backend/node_modules/exceljs');
const path = require('path');

async function buildMatrix() {
  const workbook = new ExcelJS.Workbook();
  workbook.creator = 'Claw PM & Tessa (Lead SQA)';
  workbook.created = new Date();

  const sheet = workbook.addWorksheet('Test_Scenarios_Matrix', {
    views: [{ state: 'frozen', ySplit: 1 }]
  });

  sheet.columns = [
    { header: 'No', key: 'no', width: 6 },
    { header: 'Modul / Fitur', key: 'module', width: 24 },
    { header: 'Test Case ID', key: 'id', width: 15 },
    { header: 'User Persona / Role', key: 'persona', width: 22 },
    { header: 'Skenario Uji & Deskripsi', key: 'scenario', width: 40 },
    { header: 'Langkah Pengujian (Steps to Reproduce)', key: 'steps', width: 48 },
    { header: 'Data Input / Payload API', key: 'payload', width: 34 },
    { header: 'Hasil yang Diharapkan (Expected Result)', key: 'expected', width: 42 },
    { header: 'Kriteria Isolasi & Multi-Tenant', key: 'isolation_criteria', width: 36 },
    { header: 'Status QA', key: 'status', width: 14 }
  ];

  sheet.getRow(1).eachCell((cell) => {
    cell.font = { bold: true, color: { argb: 'FFFFFFFF' }, size: 11 };
    cell.fill = {
      type: 'pattern',
      pattern: 'solid',
      fgColor: { argb: 'FF1E293B' }
    };
    cell.alignment = { vertical: 'middle', horizontal: 'center', wrapText: true };
  });
  sheet.getRow(1).height = 30;

  const testCases = [
    // 1. AUTH & RBAC
    {
      no: 1,
      module: 'Auth & Multi-User RBAC',
      id: 'TC-AUTH-001',
      persona: 'Client / Pengguna Umum',
      scenario: 'Registrasi Akun Baru (Self-Service)',
      steps: '1. Buka modal Auth\n2. Pilih tab Register\n3. Isi nama, email, password\n4. Submit form',
      payload: 'POST /api/auth/register {name, email, password}',
      expected: 'Akun terbuat dengan role CLIENT, token JWT terbit, auto-login ke dashboard.',
      isolation_criteria: 'Role diset ke CLIENT secara mutlak. Tidak bisa eskalasi role.',
      status: 'PASS'
    },
    {
      no: 2,
      module: 'Auth & Multi-User RBAC',
      id: 'TC-AUTH-002',
      persona: 'Client B vs Client A',
      scenario: 'Logout & Switch Account State Reset',
      steps: '1. Login sebagai Client A (ada proyek)\n2. Klik tombol Logout\n3. Login sebagai Client B (tanpa proyek)',
      payload: 'Auth State Transitions di React App',
      expected: 'State frontend (projects, ideas, chatMessages) di-reset bersih ke []. Layar Client B kosong tanpa sisa data Client A.',
      isolation_criteria: 'Zero residual cache data di browser memory/React state.',
      status: 'PASS'
    },

    // 2. IDEA RADAR TO PIPELINE (ROOT CAUSE RESOLVED)
    {
      no: 3,
      module: 'Idea Radar & Innovation',
      id: 'TC-IDEA-001',
      persona: 'Client B (Dr. Siti Rahma)',
      scenario: 'Approve & Build Ide oleh Klien B',
      steps: '1. Login sebagai Client B\n2. Buka tab Idea Radar\n3. Klik tombol [Approve & Build] pada salah satu ide',
      payload: 'POST /api/projects + Authorization: Bearer <Token_Client_B>',
      expected: 'Proyek baru terbuat di database dengan user_id = USR-CLIENT-B. Langsung muncul di Pipeline Hub Client B.',
      isolation_criteria: 'Proyek TIDAK BOLEH masuk ke akun Owner atau Client A.',
      status: 'PASS'
    },
    {
      no: 4,
      module: 'Idea Radar & Innovation',
      id: 'TC-IDEA-002',
      persona: 'Unauthenticated User',
      scenario: 'Mencoba Approve & Build Ide Tanpa Login',
      steps: '1. Akses API /api/projects secara anonim tanpa token Bearer',
      payload: 'POST /api/projects (No Header)',
      expected: 'Backend menolak keras dengan HTTP 401 Unauthorized.',
      isolation_criteria: 'Dilarang keras ada fallback diam-diam ke Owner (USR-OWNER-001).',
      status: 'PASS'
    },

    // 3. PROJECT PIPELINE HUB & ISOLASI DATA
    {
      no: 5,
      module: 'Project Pipeline Hub',
      id: 'TC-PIPE-001',
      persona: 'Client A (Budi Santoso)',
      scenario: 'Melihat Daftar Proyek di Pipeline Hub',
      steps: '1. Login sebagai Client A\n2. Masuk ke tab Project Pipeline Hub',
      payload: 'GET /api/projects + Token A',
      expected: 'Hanya menampilkan proyek milik Client A (Kopi Senja POS).',
      isolation_criteria: 'Proyek milik Client B atau user lain terfilter 100% dari response API.',
      status: 'PASS'
    },
    {
      no: 6,
      module: 'Project Pipeline Hub',
      id: 'TC-PIPE-002',
      persona: 'Client B (Dr. Siti Rahma)',
      scenario: 'Melihat Pipeline Saat Belum Punya Proyek',
      steps: '1. Login sebagai Client B (fresh account)\n2. Masuk ke tab Project Pipeline Hub',
      payload: 'GET /api/projects + Token B',
      expected: 'Menampilkan empty state "Belum ada proyek yang terdaftar". Proyek Client A tidak boleh terlihat.',
      isolation_criteria: 'Response API wajib [] (Array kosong).',
      status: 'PASS'
    },
    {
      no: 7,
      module: 'Project Pipeline Hub',
      id: 'TC-PIPE-003',
      persona: 'Root Owner (Bang Nano)',
      scenario: 'Master Oversight & Filter Klien di Pipeline',
      steps: '1. Login sebagai Owner\n2. Buka tab Pipeline\n3. Pilih filter per-klien pada dropdown',
      payload: 'GET /api/projects?user_id=USR-CLIENT-A',
      expected: 'Owner dapat melihat total proyek semua user, atau memfilter khusus proyek milik Klien terpilih.',
      isolation_criteria: 'Filter terisolasi akurat per user_id.',
      status: 'PASS'
    },

    // 4. LIVE ACTIVITIES STREAM
    {
      no: 8,
      module: 'Live Activities Stream',
      id: 'TC-ACT-001',
      persona: 'Client A (Budi Santoso)',
      scenario: 'Melihat Stream Aktivitas Real-Time',
      steps: '1. Login sebagai Client A\n2. Pantau widget Live Activities Stream di sidebar/tab',
      payload: 'GET /api/activities + Token A',
      expected: 'Hanya menampilkan log aktivitas proyek milik Client A (Kopi Senja POS). Log proyek Client B tidak ada.',
      isolation_criteria: 'WHERE project_id IN (SELECT id FROM projects WHERE user_id = Client_A_ID)',
      status: 'PASS'
    },
    {
      no: 9,
      module: 'Live Activities Stream',
      id: 'TC-ACT-002',
      persona: 'Client B (Dr. Siti Rahma)',
      scenario: 'Stream Aktivitas Client B Saat Belum Ada Proyek',
      steps: '1. Login sebagai Client B\n2. Buka Live Activities Stream',
      payload: 'GET /api/activities + Token B',
      expected: 'Stream kosong (0 activity) tanpa ada kebocoran log Kopi Senja Client A.',
      isolation_criteria: 'Zero cross-tenant log leakage.',
      status: 'PASS'
    },
    {
      no: 10,
      module: 'Live Activities Stream',
      id: 'TC-ACT-003',
      persona: 'Root Owner (Bang Nano)',
      scenario: 'Global Activity Stream & Inspect User',
      steps: '1. Login sebagai Owner\n2. Klik user tertentu di User Directory',
      payload: 'GET /api/activities?user_id=USR-CLIENT-A + Token Owner',
      expected: 'Secara default menampilkan seluruh aktivitas perusahaan. Saat mode inspect user, terfilter khusus user tersebut.',
      isolation_criteria: 'Scoping query akurat di backend SQL.',
      status: 'PASS'
    },

    // 5. WORKBENCH STUDIO & REVISION ITERATION
    {
      no: 11,
      module: 'Workbench Studio (v2.6)',
      id: 'TC-WB-001',
      persona: 'Client A (Pemilik Proyek)',
      scenario: 'Live Preview & In-Place Code Patching',
      steps: '1. Buka Workbench Studio Kopi Senja (Port 5001)\n2. Kirim instruksi perubahan di chat PM Sarah\n3. Devron & Anya patch kode',
      payload: 'POST /api/projects/:id/iterate {prompt: "..."}',
      expected: 'Kode terupdate, PM2 reload di port 5001 yang sama, iframe auto-reload, revision log bertambah.',
      isolation_criteria: 'Hanya pemilik proyek yang diizinkan melakukan patching kode.',
      status: 'PASS'
    },
    {
      no: 12,
      module: 'Workbench Studio (v2.6)',
      id: 'TC-WB-002',
      persona: 'Root Owner (Mode Inspeksi)',
      scenario: 'Owner Mencoba Patching Proyek Klien (Security Gate)',
      steps: '1. Login sebagai Owner\n2. Buka Workbench proyek milik Client A\n3. Coba kirim request iterate patch',
      payload: 'POST /api/projects/:id_client/iterate + Token Owner',
      expected: 'Backend menolak keras dengan HTTP 403 Forbidden (Mode Inspeksi Read-Only).',
      isolation_criteria: 'Integritas data klien terlindungi dari modifikasi sepihak.',
      status: 'PASS'
    },
    {
      no: 13,
      module: 'Workbench Studio (v2.6)',
      id: 'TC-WB-003',
      persona: 'Client A vs Client B (Hacking)',
      scenario: 'Client A Mencoba Patch Proyek Client B',
      steps: '1. Login sebagai Client A\n2. Kirim request patch ke ID proyek milik Client B',
      payload: 'POST /api/projects/:id_client_b/iterate + Token Client A',
      expected: 'Backend menolak keras dengan HTTP 403 / 404 Forbidden.',
      isolation_criteria: 'Strict multi-tenant ownership enforcement.',
      status: 'PASS'
    },

    // 6. DATABASE GUI VIEWER
    {
      no: 14,
      module: 'Database GUI Viewer',
      id: 'TC-DB-001',
      persona: 'Client A (Pemilik Proyek)',
      scenario: 'Melihat Data Tabel Live di Workbench',
      steps: '1. Buka Workbench Kopi Senja\n2. Klik tab [Database Data]\n3. Pilih dropdown tabel (orders / items)',
      payload: 'GET /api/projects/:id/database + Token A',
      expected: 'Menampilkan nama tabel, kolom, dan baris record data live. Tombol Live Reload memperbarui data.',
      isolation_criteria: 'Hanya mengekstrak data dari direktori proyek yang bersangkutan.',
      status: 'PASS'
    },

    // 7. FORMAL MILESTONE SIGN-OFF APPROVAL GATE
    {
      no: 15,
      module: 'Milestone Sign-Off Gate',
      id: 'TC-GATE-001',
      persona: 'Client (Saat Buat Proyek)',
      scenario: 'Pembuatan Proyek dengan Mode Approval Aktif',
      steps: '1. Buat proyek baru dengan toggle "Mode Approval & Sign-Off" diaktifkan\n2. Tunggu PM merumuskan PRD',
      payload: 'POST /api/projects {requireApproval: true}',
      expected: 'Pipeline otomatis jeda pada status WAITING_APPROVAL (Menunggu Persetujuan Klien) setelah PRD terbit.',
      isolation_criteria: 'Proses koding tidak akan berjalan sebelum ada sign-off resmi.',
      status: 'PASS'
    },
    {
      no: 16,
      module: 'Milestone Sign-Off Gate',
      id: 'TC-GATE-002',
      persona: 'Client (Persetujuan)',
      scenario: 'Klien Menyetujui Spesifikasi & Mulai Koding',
      steps: '1. Review dokumen PRD di dashboard\n2. Klik tombol [Setujui & Mulai Koding]',
      payload: 'POST /api/projects/:id/approve + Token Client',
      expected: 'Status berubah ke BUILDING, tim devron/anya langsung melanjutkan koding & deployment otomatis.',
      isolation_criteria: 'Hanya pemilik proyek yang berhak menyetujui.',
      status: 'PASS'
    },
    {
      no: 17,
      module: 'Milestone Sign-Off Gate',
      id: 'TC-GATE-003',
      persona: 'Client (Revisi Spec)',
      scenario: 'Klien Meminta Revisi Spesifikasi',
      steps: '1. Klik tombol [Minta Revisi Spec]\n2. Masukkan catatan perubahan\n3. Submit',
      payload: 'POST /api/projects/:id/request-spec-revision {feedback: "..."}',
      expected: 'Sarah (PM) otomatis merevisi 01_PRD.md sesuai catatan klien. Status tetap menunggu approval.',
      isolation_criteria: 'Revisi tersimpan di folder docs proyek bersangkutan.',
      status: 'PASS'
    },

    // 8. INFRASTRUCTURE & RECOVERY
    {
      no: 18,
      module: 'Infrastructure & Port',
      id: 'TC-INFRA-001',
      persona: 'System / DevOps (Cipher)',
      scenario: 'Alokasi Port Dinamis Anti-Collision',
      steps: '1. Buat beberapa proyek berturut-turut',
      payload: 'getNextAvailablePort() socket check',
      expected: 'Setiap proyek baru mendapatkan port unik yang benar-benar terbuka (5001, 5002, dst) tanpa error EADDRINUSE.',
      isolation_criteria: 'Port runtime terisolasi per micro-app.',
      status: 'PASS'
    },
    {
      no: 19,
      module: 'Infrastructure & Port',
      id: 'TC-INFRA-002',
      persona: 'System / DevOps (Cipher)',
      scenario: 'SSH Tunnel Child Process Cleanup (Anti-Zombie)',
      steps: '1. Jalankan tunnel publik\n2. Restart backend process',
      payload: 'SIGINT / SIGTERM / exit handler',
      expected: 'Proses background ssh localhost.run otomatis di-kill, tidak meninggalkan zombie/orphan process di OS.',
      isolation_criteria: 'Resource OS bersih dan efisien.',
      status: 'PASS'
    },
    {
      no: 20,
      module: 'Contextual Chat & War Room',
      id: 'TC-CHAT-001',
      persona: 'Client vs Agent',
      scenario: 'Sender Identity Resolution di Chatting',
      steps: '1. Client B kirim pesan di War Room / Direct Chat CEO\n2. Periksa balasan agen',
      payload: 'POST /api/chat {message: "Halo"} + Token B',
      expected: 'Agen menyapa "Ibu Dr. Siti Rahma (Client B)" secara profesional. Panggilan "Owner / Bang Nano" hanya untuk Root Owner.',
      isolation_criteria: 'Chat context terisolasi per user_id & room_type.',
      status: 'PASS'
    }
  ];

  testCases.forEach((tc) => {
    const row = sheet.addRow(tc);
    row.alignment = { vertical: 'top', wrapText: true };
    row.height = 48;

    const statusCell = row.getCell('status');
    statusCell.font = { bold: true };
    if (tc.status === 'PASS') {
      statusCell.font = { color: { argb: 'FF16A34A' }, bold: true };
    } else {
      statusCell.font = { color: { argb: 'FFDC2626' }, bold: true };
    }
  });

  sheet.eachRow((row) => {
    row.eachCell((cell) => {
      cell.border = {
        top: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        left: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        bottom: { style: 'thin', color: { argb: 'FFE2E8F0' } },
        right: { style: 'thin', color: { argb: 'FFE2E8F0' } }
      };
    });
  });

  const outputPath = '/mnt/d/explore/virtual-company/Test_Scenarios_Matrix_PRD_v26.xlsx';
  await workbook.xlsx.writeFile(outputPath);
  console.log('EXCEL_CREATED_OK:', outputPath);
}

buildMatrix().catch(console.error);
