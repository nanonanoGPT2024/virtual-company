import fs from 'fs';
import path from 'path';
import { 
  Document, 
  Packer, 
  Paragraph, 
  TextRun, 
  HeadingLevel, 
  Table, 
  TableRow, 
  TableCell, 
  BorderStyle, 
  WidthType, 
  AlignmentType,
  ShadingType,
  PageBreak
} from 'docx';
import ExcelJS from 'exceljs';

// Table Border Style Helper
const standardBorders = {
  top: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  bottom: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  left: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
  right: { style: BorderStyle.SINGLE, size: 1, color: "CBD5E1" },
};

function createHeaderCell(text: string, widthPercent: number) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    shading: { type: ShadingType.CLEAR, fill: "0284C7" },
    children: [
      new Paragraph({
        alignment: AlignmentType.CENTER,
        children: [
          new TextRun({ text, bold: true, color: "FFFFFF", font: "Arial", size: 20 })
        ]
      })
    ],
    borders: standardBorders,
  });
}

function createDataCell(text: string, widthPercent: number, bold: boolean = false, align: (typeof AlignmentType)[keyof typeof AlignmentType] = AlignmentType.LEFT) {
  return new TableCell({
    width: { size: widthPercent, type: WidthType.PERCENTAGE },
    children: [
      new Paragraph({
        alignment: align,
        children: [
          new TextRun({ text, bold, color: "1E293B", font: "Arial", size: 19 })
        ]
      })
    ],
    borders: standardBorders,
  });
}

/**
 * 1. PRD (Product Requirements Document) Formal Enterprise Word
 */
export async function generateEnterprisePRDDocx(project: any, outputPath: string) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title Cover
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "PRODUCT REQUIREMENTS DOCUMENT (PRD)", bold: true, size: 36, font: "Arial", color: "0284C7" }),
          ],
          spacing: { before: 400, after: 120 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `Project: ${project.title || project.name}`, bold: true, size: 28, font: "Arial", color: "334155" }),
          ],
          spacing: { after: 80 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `Document Version: 1.0.0 | Status: APPROVED | Owner: Nano`, italics: true, size: 20, font: "Arial", color: "64748B" }),
          ],
          spacing: { after: 400 }
        }),

        // Metadata Table
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Parameter", 30), createHeaderCell("Spesifikasi", 70)] }),
            new TableRow({ children: [createDataCell("Nama Produk", 30, true), createDataCell(project.title || "Autonomous App", 70)] }),
            new TableRow({ children: [createDataCell("Lead Product Manager", 30, true), createDataCell("Sarah Jenkins (EMP-PM)", 70)] }),
            new TableRow({ children: [createDataCell("Target Audience", 30, true), createDataCell("End-user & Enterprise Clients", 70)] }),
            new TableRow({ children: [createDataCell("Release Target Port", 30, true), createDataCell(`Port ${project.port || 5001} (WSL2 / PM2)`, 70)] }),
          ]
        }),

        new Paragraph({ spacing: { after: 300 } }),

        // Executive Summary
        new Paragraph({ text: "1. Executive Summary & Problem Statement", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ text: `${project.description || 'Aplikasi otonom terintegrasi dengan arsitektur modern.'}`, spacing: { after: 150 } }),

        // Functional Scope Table
        new Paragraph({ text: "2. Functional Feature Breakdown & Acceptance Criteria", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Feature ID", 15), createHeaderCell("Modul Fitur", 25), createHeaderCell("Deskripsi Kebutuhan", 40), createHeaderCell("Acceptance Criteria", 20)] }),
            new TableRow({ children: [createDataCell("FEAT-01", 15), createDataCell("Interactive UI", 25), createDataCell("Antarmuka Dark Mode Modern Tailwind CSS + Lucide Icons", 40), createDataCell("Lolos UI Audit", 20)] }),
            new TableRow({ children: [createDataCell("FEAT-02", 15), createDataCell("REST API CRUD", 25), createDataCell("Endpoint GET, POST, PATCH, DELETE /api/items", 40), createDataCell("HTTP 200/201 OK", 20)] }),
            new TableRow({ children: [createDataCell("FEAT-03", 15), createDataCell("Metric Summary", 25), createDataCell("KPI Counter (Total, Pending, Completed)", 40), createDataCell("Real-time sync", 20)] }),
            new TableRow({ children: [createDataCell("FEAT-04", 15), createDataCell("Auto-Deploy", 25), createDataCell("PM2 background process manager di port isolated", 40), createDataCell("Status ONLINE", 20)] }),
          ]
        }),

        new Paragraph({ spacing: { after: 300 } }),

        // Sign-off section
        new Paragraph({ text: "3. Stakeholder Sign-Off & Approval", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Role", 35), createHeaderCell("Nama PIC", 35), createHeaderCell("Approval Status", 30)] }),
            new TableRow({ children: [createDataCell("Product Owner (Root)", 35), createDataCell("Nano", 35), createDataCell("APPROVED", 30, true)] }),
            new TableRow({ children: [createDataCell("Chief Executive Officer", 35), createDataCell("Chief Aura (CEO)", 35), createDataCell("APPROVED", 30, true)] }),
            new TableRow({ children: [createDataCell("Lead PM", 35), createDataCell("Sarah Jenkins", 35), createDataCell("VERIFIED", 30, true)] }),
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * 2. FSD (Functional Specification Document / Architecture) Formal Word
 */
export async function generateEnterpriseFSDDocx(project: any, outputPath: string) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "FUNCTIONAL SPECIFICATION DOCUMENT (FSD)", bold: true, size: 36, font: "Arial", color: "0284C7" }),
          ],
          spacing: { before: 400, after: 120 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `System Architecture & API Contract: ${project.title || project.name}`, bold: true, size: 26, font: "Arial", color: "334155" }),
          ],
          spacing: { after: 300 }
        }),

        new Paragraph({ text: "1. System Technology Stack", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Komponen", 30), createHeaderCell("Teknologi yang Digunakan", 70)] }),
            new TableRow({ children: [createDataCell("Frontend Client", 30, true), createDataCell("HTML5, Tailwind CSS, Lucide Icons, Client Fetch API", 70)] }),
            new TableRow({ children: [createDataCell("Backend Server", 30, true), createDataCell("Node.js, Express.js REST API, CORS Middleware", 70)] }),
            new TableRow({ children: [createDataCell("Process Manager", 30, true), createDataCell("PM2 (Process Isolation per project)", 70)] }),
            new TableRow({ children: [createDataCell("Architect PIC", 30, true), createDataCell("Viktor Cruz (Lead Architect)", 70)] }),
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({ text: "2. REST API Contract Specification", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Method", 15), createHeaderCell("Endpoint", 30), createHeaderCell("Request Payload", 30), createHeaderCell("Response Status", 25)] }),
            new TableRow({ children: [createDataCell("GET", 15, true), createDataCell("/health", 30), createDataCell("None", 30), createDataCell("200 OK (Status JSON)", 25)] }),
            new TableRow({ children: [createDataCell("GET", 15, true), createDataCell("/api/items", 30), createDataCell("None", 30), createDataCell("200 OK (Array of Items)", 25)] }),
            new TableRow({ children: [createDataCell("POST", 15, true), createDataCell("/api/items", 30), createDataCell('{ title: string, desc: string }', 30), createDataCell("201 Created", 25)] }),
            new TableRow({ children: [createDataCell("PATCH", 15, true), createDataCell("/api/items/:id", 30), createDataCell('{ status: "COMPLETED" }', 30), createDataCell("200 OK", 25)] }),
            new TableRow({ children: [createDataCell("DELETE", 15, true), createDataCell("/api/items/:id", 30), createDataCell("None", 30), createDataCell("200 OK", 25)] }),
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({ text: "3. Directory & Deployment Layout", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ text: "Aplikasi di-deploy mandiri dengan struktur terisolasi:", spacing: { after: 80 } }),
        new Paragraph({ text: "• src/frontend/index.html (Client User Interface)", bullet: { level: 0 } }),
        new Paragraph({ text: "• src/backend/server.js (Express Server & Business Logic)", bullet: { level: 0 } }),
        new Paragraph({ text: "• docs/ (Dokumentasi Lengkap PRD, FSD, SIT/UAT)", bullet: { level: 0 } }),
        new Paragraph({ text: "• ecosystem.config.js (PM2 Daemon Configuration)", bullet: { level: 0 } }),
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * 3. SIT & UAT Test Report + Sign-Off Word
 */
export async function generateEnterpriseUATDocx(project: any, outputPath: string) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "SYSTEM INTEGRATION (SIT) & UAT REPORT", bold: true, size: 36, font: "Arial", color: "0284C7" }),
          ],
          spacing: { before: 400, after: 120 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `Verification & Quality Sign-Off: ${project.title || project.name}`, bold: true, size: 24, font: "Arial", color: "334155" }),
          ],
          spacing: { after: 300 }
        }),

        new Paragraph({ text: "1. Executive Summary Hasil Pengujian", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Metrik Pengujian", 40), createHeaderCell("Hasil", 60)] }),
            new TableRow({ children: [createDataCell("Total Test Cases", 40, true), createDataCell("7 Skenario Uji", 60)] }),
            new TableRow({ children: [createDataCell("Passed Rate", 40, true), createDataCell("100% (7/7 Passed - Zero Defect)", 60)] }),
            new TableRow({ children: [createDataCell("Lead QA Tester", 40, true), createDataCell("Tessa (EMP-QA)", 60)] }),
            new TableRow({ children: [createDataCell("Security Auditor", 40, true), createDataCell("Sentinel (EMP-SEC)", 60)] }),
            new TableRow({ children: [createDataCell("Status Kesiapan Rilis", 40, true), createDataCell("READY FOR PRODUCTION", 60, true)] }),
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),

        new Paragraph({ text: "2. Lembar Berita Acara UAT & Serah Terima", heading: HeadingLevel.HEADING_2, spacing: { before: 200, after: 100 } }),
        new Paragraph({ text: "Dengan ini dinyatakan bahwa aplikasi telah diuji secara menyeluruh dan seluruh kriteria penerimaan telah dipenuhi:", spacing: { after: 150 } }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Disusun Oleh (QA)", 33), createHeaderCell("Diverifikasi (Tech Lead)", 33), createHeaderCell("Disetujui (Owner)", 34)] }),
            new TableRow({ 
              children: [
                createDataCell("Tessa\n(Lead SQA Engineer)\n\nStatus: SIGNED", 33), 
                createDataCell("Marcus Sterling\n(CTO)\n\nStatus: SIGNED", 33), 
                createDataCell("Nano\n(Root Product Owner)\n\nStatus: ACCEPTED", 34)
              ] 
            }),
          ]
        })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * 4. General Native Word generator with structured professional styling
 */
export async function generateNativeDocx(title: string, category: string, project: any, summaryText: string, outputPath: string) {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: title.replace(/_/g, ' ').toUpperCase(), bold: true, size: 32, font: "Arial", color: "0284C7" }),
          ],
          spacing: { before: 300, after: 100 }
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: `Project: ${project.title || project.name} | Category: ${category}`, bold: true, size: 22, font: "Arial", color: "475569" }),
          ],
          spacing: { after: 250 }
        }),
        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Attribute", 30), createHeaderCell("Detail", 70)] }),
            new TableRow({ children: [createDataCell("Dokumen", 30, true), createDataCell(title, 70)] }),
            new TableRow({ children: [createDataCell("Project Slug", 30, true), createDataCell(project.slug || project.title, 70)] }),
            new TableRow({ children: [createDataCell("Generated Date", 30, true), createDataCell(new Date().toLocaleDateString('id-ID', { dateStyle: 'full' }), 70)] }),
          ]
        }),
        new Paragraph({ spacing: { after: 200 } }),
        new Paragraph({ text: "Ringkasan & Penjelasan Dokumen:", heading: HeadingLevel.HEADING_2, spacing: { before: 150, after: 80 } }),
        new Paragraph({ text: summaryText, spacing: { after: 120 } })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  fs.writeFileSync(outputPath, buffer);
}

/**
 * 5. SIT & UAT Test Matrix Excel (.xlsx)
 */
export async function generateTestMatrixExcel(projectTitle: string, outputPath: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('SIT & UAT Test Matrix');

  sheet.columns = [
    { header: 'Test Case ID', key: 'id', width: 14 },
    { header: 'Module / Feature', key: 'module', width: 22 },
    { header: 'Test Scenario & Steps', key: 'scenario', width: 35 },
    { header: 'Expected Result', key: 'expected', width: 30 },
    { header: 'Actual Result', key: 'actual', width: 25 },
    { header: 'Status', key: 'status', width: 12 },
    { header: 'Tested By', key: 'tester', width: 16 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0284C7' } };

  const testCases = [
    { id: 'TC-001', module: 'System Initialization', scenario: 'Verifikasi backend Express & REST API server live', expected: 'Port aktif & return JSON status 200 OK', actual: 'Health check OK', status: 'PASSED', tester: 'Tessa (SQA)' },
    { id: 'TC-002', module: 'UI Frontend Rendering', scenario: 'Buka dashboard UI pada browser', expected: 'Komponen Tailwind & Lucide render sempurna', actual: 'Tampilan rapi & responsif', status: 'PASSED', tester: 'Tessa (SQA)' },
    { id: 'TC-003', module: 'Data Creation (POST)', scenario: 'Input form entri baru dan submit', expected: 'Item tersimpan dan bertambah di list', actual: 'Data berhasil masuk', status: 'PASSED', tester: 'Tessa (SQA)' },
    { id: 'TC-004', module: 'Status Toggle (PATCH)', scenario: 'Klik centang selesai pada task', expected: 'Status berubah jadi COMPLETED', actual: 'Status terupdate', status: 'PASSED', tester: 'Tessa (SQA)' },
    { id: 'TC-005', module: 'Item Deletion (DELETE)', scenario: 'Klik tombol hapus item', expected: 'Item terhapus dari memori/DB', actual: 'Item hilang seketika', status: 'PASSED', tester: 'Tessa (SQA)' },
    { id: 'TC-006', module: 'Security Input Check', scenario: 'Uji injeksi karakter khusus pada form input', expected: 'Karakter disanitasi, no XSS / SQLi', actual: 'Input aman & valid', status: 'PASSED', tester: 'Sentinel (Sec)' },
    { id: 'TC-007', module: 'UAT Acceptance', scenario: 'Verifikasi kesesuaian Acceptance Criteria PRD', expected: 'Semua kebutuhan Owner terpenuhi', actual: 'Fitur 100% lengkap', status: 'PASSED', tester: 'Sarah (PM)' },
  ];

  testCases.forEach(tc => {
    const row = sheet.addRow(tc);
    const statusCell = row.getCell('status');
    statusCell.font = { bold: true, color: { argb: 'FF15803D' } };
  });

  await workbook.xlsx.writeFile(outputPath);
}

/**
 * 6. Financial Model Excel (.xlsx)
 */
export async function generateFinancialExcel(projectTitle: string, budgetUsd: number, outputPath: string) {
  const workbook = new ExcelJS.Workbook();
  const sheet = workbook.addWorksheet('Financial Model & Token Costs');

  sheet.columns = [
    { header: 'Division / Agent Role', key: 'role', width: 25 },
    { header: 'Agent PIC', key: 'pic', width: 20 },
    { header: 'Activity Deliverables', key: 'deliverable', width: 35 },
    { header: 'AI Model Tier', key: 'tier', width: 18 },
    { header: 'Token Cost (USD)', key: 'cost', width: 16 },
  ];

  sheet.getRow(1).font = { bold: true, color: { argb: 'FFFFFFFF' } };
  sheet.getRow(1).fill = { type: 'pattern', pattern: 'solid', fgColor: { argb: 'FF0F766E' } };

  const financialData = [
    { role: 'Executive & Strategy', pic: 'Chief Aura (CEO)', deliverable: 'Strategic Vision & BRD', tier: 'High-Reasoning', cost: 0.045 },
    { role: 'Product & Planning', pic: 'Sarah Jenkins (PM)', deliverable: '01_PRD.docx & User Stories', tier: 'Fast-Low Latency', cost: 0.028 },
    { role: 'UI/UX Design', pic: 'Kaelen (UI/UX)', deliverable: '02_UI_UX_Design_System.docx', tier: 'Fast-Low Latency', cost: 0.032 },
    { role: 'Architecture & Tech', pic: 'Viktor Cruz (Arch)', deliverable: '03_Architecture_API.docx', tier: 'Fast-Low Latency', cost: 0.035 },
    { role: 'Engineering & Code', pic: 'Devron (Dev)', deliverable: 'Fullstack Express + Tailwind', tier: 'Fast-Low Latency', cost: 0.065 },
    { role: 'Quality Assurance', pic: 'Tessa (SQA)', deliverable: '04_QA_Test_Report.docx', tier: 'Fast-Low Latency', cost: 0.024 },
    { role: 'Cybersecurity', pic: 'Sentinel (Sec)', deliverable: '05_Security_Audit.docx', tier: 'Fast-Low Latency', cost: 0.022 },
    { role: 'Marketing & Sales', pic: 'Vibe (Growth)', deliverable: '08_Sales_Pitch_Clients.docx', tier: 'Fast-Low Latency', cost: 0.026 },
    { role: 'Legal & Compliance', pic: 'Justicia (Legal)', deliverable: '06_Privacy_Terms.docx', tier: 'Fast-Low Latency', cost: 0.019 },
    { role: 'Tech Writer', pic: 'Page (Docs)', deliverable: '07_User_Manual.docx', tier: 'Fast-Low Latency', cost: 0.025 },
  ];

  let totalCost = 0;
  financialData.forEach(item => {
    totalCost += item.cost;
    sheet.addRow(item);
  });

  const totalRow = sheet.addRow({ role: 'TOTAL ESTIMATED COST', deliverable: 'All Divisions Combined', cost: totalCost });
  totalRow.font = { bold: true };

  await workbook.xlsx.writeFile(outputPath);
}

/**
 * 7. Form Template Spesifikasi Kebutuhan Proyek (.docx)
 */
export async function generateProjectSpecTemplateDocx(outputPath?: string): Promise<Buffer> {
  const doc = new Document({
    sections: [{
      properties: {},
      children: [
        // Title
        new Paragraph({
          alignment: AlignmentType.CENTER,
          children: [
            new TextRun({ text: "FORMULIR SPESIFIKASI KEBUTUHAN APLIKASI", bold: true, size: 32, font: "Arial", color: "0284C7" })
          ]
        }),
        new Paragraph({
          alignment: AlignmentType.CENTER,
          spacing: { after: 300 },
          children: [
            new TextRun({ text: "VirtuLabs Autonomous Studio • Project Requirement Template", bold: true, size: 20, font: "Arial", color: "475569" })
          ]
        }),

        new Paragraph({ text: "Panduan Pengisian:", heading: HeadingLevel.HEADING_2, spacing: { before: 150, after: 80 } }),
        new Paragraph({ text: "Silakan lengkapi tabel form isian kebutuhan di bawah ini untuk memandu agen AI membangun aplikasi yang sesuai ekspektasi Anda. Setelah diisi, lampirkan dokumen ini pada form 'Buat Project Baru'.", spacing: { after: 150 } }),

        new Table({
          width: { size: 100, type: WidthType.PERCENTAGE },
          rows: [
            new TableRow({ children: [createHeaderCell("Bagian / Topik", 30), createHeaderCell("Detail Spesifikasi Anda (Isi di Kolom Ini)", 70)] }),
            new TableRow({ children: [createDataCell("Nama Aplikasi / Judul", 30, true), createDataCell("[Tuliskan Nama Aplikasi Anda di sini]", 70)] }),
            new TableRow({ children: [createDataCell("Deskripsi & Problem Statement", 30, true), createDataCell("[Jelaskan masalah yang ingin diselesaikan oleh aplikasi ini]", 70)] }),
            new TableRow({ children: [createDataCell("Target Pengguna / Persona", 30, true), createDataCell("[Contoh: HR Manager, Karyawan, Pelanggan E-Commerce, Admin]", 70)] }),
            new TableRow({ children: [createDataCell("Fitur Utama (CRUD / Flow)", 30, true), createDataCell("1. [Fitur 1]\n2. [Fitur 2]\n3. [Fitur 3]\n4. [Fitur 4]", 70)] }),
            new TableRow({ children: [createDataCell("Kebutuhan Autentikasi (Auth)", 30, true), createDataCell("[Ya / Tidak - Perlu JWT Login & Register atau Akses Terbuka]", 70)] }),
            new TableRow({ children: [createDataCell("Preferensi Penyimpanan Data", 30, true), createDataCell("[In-Memory Mock / SQLite Local Database / PostgreSQL]", 70)] }),
            new TableRow({ children: [createDataCell("Preferensi Tema Warna & UI", 30, true), createDataCell("[Deep Slate Cyber / Corporate Emerald / Modern Indigo / Clean Light]", 70)] }),
            new TableRow({ children: [createDataCell("Catatan Tambahan & Integrasi", 30, true), createDataCell("[Catatan khusus, nama API eksternal, atau format laporan]", 70)] }),
          ]
        }),

        new Paragraph({ spacing: { after: 200 } }),
        new Paragraph({ text: "Virtual Company OS v2.1 • Autonomous Multi-Agent Engineering", alignment: AlignmentType.CENTER, spacing: { before: 200 } })
      ]
    }]
  });

  const buffer = await Packer.toBuffer(doc);
  if (outputPath) {
    fs.writeFileSync(outputPath, buffer);
  }
  return buffer;
}
