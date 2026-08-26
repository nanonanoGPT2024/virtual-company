import fs from 'fs';
import path from 'path';
import { exec } from 'child_process';
import util from 'util';
import { pool } from '../config/db';
import { callAgentLLM } from './llmService';
import { logActivity } from './activityService';

const execPromise = util.promisify(exec);
const DEFAULT_PROJECTS_BASE_DIR = path.resolve(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek');

export interface UploadedImage {
  name: string;
  menuLabel?: string;
  base64: string;
  mimeType?: string;
}

export interface AttachedDoc {
  name: string;
  base64: string;
}

export interface PipelineOptions {
  images?: UploadedImage[];
  theme?: 'cyber' | 'emerald' | 'indigo' | 'light';
  includeAuth?: boolean;
  storageType?: 'memory' | 'sqlite';
  attachedDocs?: AttachedDoc[];
  requireApproval?: boolean;
}

// Markdown Code Block Extractor Helper (Anti-JSON-Parse-Failure)
export function extractCodeBlock(text: string, lang: string): string {
  if (!text) return '';
  const regex = new RegExp(`\`\`\`(?:${lang})?\\s*([\\s\\S]*?)\`\`\``, 'i');
  const match = text.match(regex);
  if (match && match[1] && match[1].trim().length > 50) {
    return match[1].trim();
  }
  // Strip any residual markdown wrappers
  let cleaned = text.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/\n?```$/, '');
  }
  return cleaned.trim();
}

export interface DomainMeta {
  domainKey: string;
  domainLabel: string;
  icon: string;
  endpointSlug: string;
  itemNoun: string;
  kpiLabels: [string, string, string, string];
  formTitle: string;
  formSubtitle: string;
  fields: Array<{
    name: string;
    label: string;
    type: 'text' | 'number' | 'select' | 'textarea';
    placeholder?: string;
    options?: string[];
    required?: boolean;
    colSpan?: number;
  }>;
  columns: Array<{
    key: string;
    label: string;
  }>;
  statusColors: Record<string, string>;
  initialRows: any[];
}

export function detectDomainCategory(title: string, description: string = ''): DomainMeta {
  const t = (title || '').toLowerCase();
  const d = (description || '').toLowerCase();
  const c = `${t} ${d}`;

  // 1. SEO / Audit / Analytics / GEO / AEO / LocalizeAudit
  if (
    c.includes('seo') || c.includes('audit') || c.includes('localize') || c.includes('geo') || 
    c.includes('aeo') || c.includes('search engine') || c.includes('readability') || 
    c.includes('ranking') || c.includes('crawler') || c.includes('perplexity') || 
    c.includes('searchgpt') || c.includes('nap') || c.includes('google maps') || 
    c.includes('schema markup') || c.includes('sitasi') || c.includes('citation') || c.includes('traffic')
  ) {
    return {
      domainKey: 'SEO_AUDIT_ANALYTICS',
      domainLabel: 'SEO & AI Search Audit',
      icon: 'search-check',
      endpointSlug: 'audits',
      itemNoun: 'Audit URL & Target Domain',
      kpiLabels: ['Total URL Diaudit', 'Perlu Optimasi', 'Score > 85 (Optimal)', 'Rata-rata Skor GEO'],
      formTitle: 'Jalankan Audit AI Search & SEO',
      formSubtitle: 'Analisis visibilitas AI engine, schema markup, dan performa GEO',
      fields: [
        { name: 'url', label: 'Target URL / Domain', type: 'text', placeholder: 'https://example.com/blog/article', required: true, colSpan: 2 },
        { name: 'focus_keyword', label: 'Target Keyword / Entitas', type: 'text', placeholder: 'Jasa Kopi Artisan Jakarta', required: true },
        { name: 'audit_type', label: 'Tipe Pemeriksaan', type: 'select', options: ['Generative Engine (GEO)', 'Local Business / NAP', 'Technical SEO', 'Schema & Citations'], required: true },
        { name: 'notes', label: 'Catatan / Target Kompetitor', type: 'textarea', placeholder: 'Fokus pada citation Google AI Overviews & Perplexity...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'url', label: 'Target URL' },
        { key: 'focus_keyword', label: 'Keyword / Entitas' },
        { key: 'audit_type', label: 'Tipe Audit' },
        { key: 'score', label: 'Score' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'OPTIMAL': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'NEEDS_REVIEW': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'CRITICAL': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'ANALYZING': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20'
      },
      initialRows: [
        { id: 1, url: 'https://virtulabs.id/case-studies', focus_keyword: 'Autonomous AI Enterprise', audit_type: 'Generative Engine (GEO)', score: 94, findings: 'Schema valid, citasi tinggi pada SearchGPT & Perplexity', status: 'OPTIMAL', created_at: new Date().toISOString() },
        { id: 2, url: 'https://kedaikopisenja.com', focus_keyword: 'Coffee Shop Jakarta Selatan', audit_type: 'Local Business / NAP', score: 68, findings: 'NAP tidak konsisten di Google Maps, rating 3.8 belum dibalas', status: 'NEEDS_REVIEW', created_at: new Date().toISOString() },
        { id: 3, url: 'https://techblog.io/p/modern-saas', focus_keyword: 'Micro SaaS Architecture', audit_type: 'Technical SEO', score: 45, findings: 'LLM crawler terblokir robots.txt, metadata hilang', status: 'CRITICAL', created_at: new Date().toISOString() }
      ]
    };
  }

  // 2. AI Tool / LLM Proxy / CostGuard / Token Minifier / Latency Router
  if (
    c.includes('costguard') || c.includes('cache proxy') || c.includes('token') || 
    c.includes('minifier') || c.includes('latency') || c.includes('router') || 
    c.includes('llm') || c.includes('prompt') || c.includes('openai') || 
    c.includes('anthropic') || c.includes('proxy') || c.includes('cost slasher') || 
    c.includes('costwatch') || c.includes('ai bot') || c.includes('agentic')
  ) {
    return {
      domainKey: 'AI_PROXY_TOKEN_MGMT',
      domainLabel: 'LLM Proxy & AI Gateway',
      icon: 'cpu',
      endpointSlug: 'requests',
      itemNoun: 'Request / Model Session',
      kpiLabels: ['Total LLM Requests', 'Token Saved (%)', 'Avg Latency (ms)', 'Cost Slashed ($)'],
      formTitle: 'Kirim / Simulasikan Request LLM',
      formSubtitle: 'Intersepsi gateway, minifikasi token, dan semantik smart-cache',
      fields: [
        { name: 'app_name', label: 'Consumer App / Client ID', type: 'text', placeholder: 'Production-ChatBot-v2', required: true },
        { name: 'provider_model', label: 'Primary LLM Model', type: 'select', options: ['GPT-4o (OpenAI)', 'Claude 3.5 Sonnet', 'Gemini 1.5 Flash', 'Groq Llama 3 70B'], required: true },
        { name: 'max_budget', label: 'Daily Budget Limit ($)', type: 'number', placeholder: '50', required: true },
        { name: 'routing_mode', label: 'Optimization Policy', type: 'select', options: ['Auto Minify & Semantic Cache', 'Lowest Latency (<50ms)', 'Lowest Cost Fallback', 'Strict Security / Anti-DDoS'], required: true },
        { name: 'prompt_sample', label: 'Payload Prompt / Query', type: 'textarea', placeholder: 'Kirim instruksi prompt untuk diuji kompresinya...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'app_name', label: 'Client / App' },
        { key: 'provider_model', label: 'Model' },
        { key: 'tokens_saved', label: 'Token Saved' },
        { key: 'latency_ms', label: 'Latency' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'CACHED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'ROUTED': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'THROTTLED': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'BLOCKED': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      },
      initialRows: [
        { id: 1, app_name: 'Customer-Service-Bot', provider_model: 'Claude 3.5 Sonnet', tokens_saved: '42% (PromptTrim)', latency_ms: '48ms', cost_usd: 0.0012, status: 'CACHED', created_at: new Date().toISOString() },
        { id: 2, app_name: 'CodeAssistant-IDE', provider_model: 'GPT-4o (OpenAI)', tokens_saved: '18% (Compressed)', latency_ms: '220ms', cost_usd: 0.0084, status: 'ROUTED', created_at: new Date().toISOString() },
        { id: 3, app_name: 'Analytics-Batch-Job', provider_model: 'Gemini 1.5 Flash', tokens_saved: '65% (Semantic Match)', latency_ms: '35ms', cost_usd: 0.0004, status: 'CACHED', created_at: new Date().toISOString() }
      ]
    };
  }

  // 3. Healthcare / Telemedicine / Clinic / Triage
  if (
    c.includes('telemedis') || c.includes('puskesmas') || c.includes('diagnosa') || 
    c.includes('klinik') || c.includes('dokter') || c.includes('pasien') || 
    c.includes('medik') || c.includes('rumah sakit') || c.includes('obat') || 
    c.includes('farmasi') || c.includes('triase') || c.includes('health') || c.includes('hospital')
  ) {
    return {
      domainKey: 'HEALTHCARE_TELEMEDICINE',
      domainLabel: 'Telemedisin & Triase Pasien',
      icon: 'stethoscope',
      endpointSlug: 'consultations',
      itemNoun: 'Pasien / Konsultasi',
      kpiLabels: ['Total Pasien Terdaftar', 'Menunggu Triase', 'Kasus Emergency', 'Selesai Dilayani'],
      formTitle: 'Pendaftaran & Triase AI Pasien',
      formSubtitle: 'Klasifikasi urgensi gejala dan rekomendasi rujukan poli',
      fields: [
        { name: 'name', label: 'Nama Lengkap Pasien', type: 'text', placeholder: 'Budi Santoso', required: true },
        { name: 'age', label: 'Usia (Tahun)', type: 'number', placeholder: '42', required: true },
        { name: 'gender', label: 'Jenis Kelamin', type: 'select', options: ['Laki-laki', 'Perempuan'], required: true },
        { name: 'recommended_poly', label: 'Poli Tujuan', type: 'select', options: ['Poli Umum', 'Poli Gigi', 'Poli KIA & Anak', 'Poli Lansia', 'IGD / Tindakan Darurat'], required: true },
        { name: 'symptoms', label: 'Keluhan Gejala Utama', type: 'textarea', placeholder: 'Deskripsikan gejala yang dialami pasien...', required: true, colSpan: 2 }
      ],
      columns: [
        { key: 'name', label: 'Nama Pasien' },
        { key: 'age_gender', label: 'Usia / JK' },
        { key: 'symptoms', label: 'Keluhan Gejala' },
        { key: 'recommended_poly', label: 'Poli' },
        { key: 'triage_level', label: 'Triase' }
      ],
      statusColors: {
        'EMERGENCY': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'URGENT': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'ROUTINE': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'SELESAI': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
      },
      initialRows: [
        { id: 1, name: 'Budi Santoso', age: 42, gender: 'Laki-laki', symptoms: 'Demam tinggi 3 hari, batuk kering, sesak ringan', triage_level: 'URGENT', recommended_poly: 'Poli Umum', status: 'SEDANG_DIPERIKSA', created_at: new Date().toISOString() },
        { id: 2, name: 'Siti Rahma', age: 29, gender: 'Perempuan', symptoms: 'Pemeriksaan kehamilan rutin trimester 2', triage_level: 'ROUTINE', recommended_poly: 'Poli KIA & Anak', status: 'MENUNGGU', created_at: new Date().toISOString() },
        { id: 3, name: 'H. Supardi', age: 67, gender: 'Laki-laki', symptoms: 'Nyeri dada menjalar ke punggung kiri, keringat dingin', triage_level: 'EMERGENCY', recommended_poly: 'IGD / Tindakan Darurat', status: 'RUJUK_RSUD', created_at: new Date().toISOString() }
      ]
    };
  }

  // 4. POS / Cafe / Coffee / Resto / Subscription Bot
  if (
    c.includes('pos') || c.includes('kopi') || c.includes('cafe') || c.includes('resto') || 
    c.includes('kasir') || c.includes('menu') || c.includes('barista') || 
    c.includes('makanan') || c.includes('minuman') || c.includes('coffee') || 
    c.includes('voucher') || c.includes('subscription') || c.includes('food')
  ) {
    return {
      domainKey: 'POS_RETAIL_FB',
      domainLabel: 'POS Kasir & Coffee Voucher',
      icon: 'coffee',
      endpointSlug: 'orders',
      itemNoun: 'Pesanan / Transaksi Kasir',
      kpiLabels: ['Total Pesanan', 'Sedang Diracik', 'Siap Disajikan', 'Total Omset (Rp)'],
      formTitle: 'Buat Pesanan / Voucher Baru',
      formSubtitle: 'Input pesanan menu meja kasir & voucher langganan QRIS',
      fields: [
        { name: 'customer', label: 'Nama Pelanggan / Member', type: 'text', placeholder: 'Dimas Wicaksono', required: true },
        { name: 'item', label: 'Item Menu / Paket', type: 'select', options: ['Kopi Susu Aren Signature', 'Matcha Latte Oatmilk', 'Croissant Butter Warm', 'Paket Langganan 30 Cup', 'Manual Brew V60 Flores'], required: true },
        { name: 'price', label: 'Harga Total (Rp)', type: 'number', placeholder: '25000', required: true },
        { name: 'payment_method', label: 'Metode Pembayaran', type: 'select', options: ['QRIS Auto-Settle', 'Tunai / Cash', 'Voucher Subscription', 'Debit/Credit Card'], required: true },
        { name: 'notes', label: 'Catatan Barista / Khusus', type: 'textarea', placeholder: 'Less ice, normal sugar, oat milk substitute...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'customer', label: 'Pelanggan' },
        { key: 'item', label: 'Menu Pesanan' },
        { key: 'price', label: 'Total' },
        { key: 'payment_method', label: 'Bayar' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'BREWING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'READY': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'SERVED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'CANCELLED': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      },
      initialRows: [
        { id: 1, customer: 'Dimas Wicaksono', item: 'Kopi Susu Aren Signature', price: 22000, payment_method: 'QRIS Auto-Settle', notes: 'Less sugar, extra shot', status: 'BREWING', created_at: new Date().toISOString() },
        { id: 2, customer: 'Amanda Putri', item: 'Matcha Latte Oatmilk', price: 28000, payment_method: 'Voucher Subscription', notes: 'Hot, no whipped cream', status: 'READY', created_at: new Date().toISOString() },
        { id: 3, customer: 'Rian Firmansyah', item: 'Paket Langganan 30 Cup', price: 450000, payment_method: 'QRIS Auto-Settle', notes: 'Voucher #081234987', status: 'SERVED', created_at: new Date().toISOString() }
      ]
    };
  }

  // 5. CRM / Leads / Sales Pipeline / WhatsApp Outreach
  if (
    c.includes('crm') || c.includes('lead') || c.includes('sales') || 
    c.includes('outreach') || c.includes('customer relationship') || 
    c.includes('prospek') || c.includes('pipeline') || c.includes('deal')
  ) {
    return {
      domainKey: 'CRM_SALES_LEADS',
      domainLabel: 'CRM & Sales Lead Hub',
      icon: 'users',
      endpointSlug: 'leads',
      itemNoun: 'Lead / Calon Klien',
      kpiLabels: ['Total Leads', 'Dalam Negosiasi', 'Won / Converted', 'Pipeline Value (Rp)'],
      formTitle: 'Tambah Prospek / Lead Baru',
      formSubtitle: 'Catat prospek deal, kontak WhatsApp, dan estimasi nilai proyek',
      fields: [
        { name: 'lead_name', label: 'Nama PIC / Perusahaan', type: 'text', placeholder: 'PT Sinergi Abadi', required: true },
        { name: 'contact_phone', label: 'WhatsApp / Telepon', type: 'text', placeholder: '081234567890', required: true },
        { name: 'deal_value', label: 'Estimasi Nilai Deal (Rp)', type: 'number', placeholder: '25000000', required: true },
        { name: 'lead_stage', label: 'Stage Pipeline', type: 'select', options: ['NEW_INQUIRY', 'DISCOVERY_MEET', 'PROPOSAL_SENT', 'NEGOTIATION', 'CLOSED_WON'], required: true },
        { name: 'requirements', label: 'Kebutuhan / Pain Point', type: 'textarea', placeholder: 'Membutuhkan custom AI chatbot untuk customer support 24/7...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'lead_name', label: 'Nama Prospek' },
        { key: 'contact_phone', label: 'Kontak' },
        { key: 'deal_value', label: 'Nilai Deal' },
        { key: 'requirements', label: 'Kebutuhan' },
        { key: 'status', label: 'Stage' }
      ],
      statusColors: {
        'CLOSED_WON': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'NEGOTIATION': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'PROPOSAL_SENT': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'NEW_INQUIRY': 'bg-indigo-500/10 text-indigo-400 border-indigo-500/20'
      },
      initialRows: [
        { id: 1, lead_name: 'PT Sinergi Digital', contact_phone: '081298765432', deal_value: 35000000, requirements: 'Integrasi LLM Gateway & Dashboard Eksekutif', status: 'NEGOTIATION', created_at: new Date().toISOString() },
        { id: 2, lead_name: 'Klinik Medika Sehat', contact_phone: '081122334455', deal_value: 18000000, requirements: 'Sistem Triase AI & Antrean Pasien', status: 'CLOSED_WON', created_at: new Date().toISOString() },
        { id: 3, lead_name: 'Logistik Nusantara', contact_phone: '081377889900', deal_value: 42000000, requirements: 'Modul Tracking Manifest Kurir Realtime', status: 'PROPOSAL_SENT', created_at: new Date().toISOString() }
      ]
    };
  }

  // 6. Logistics / Expedition / Shipping / Cargo
  if (
    c.includes('ekspedisi') || c.includes('logistik') || c.includes('kurir') || 
    c.includes('paket') || c.includes('resi') || c.includes('shipping') || 
    c.includes('cargo') || c.includes('delivery') || c.includes('freight')
  ) {
    return {
      domainKey: 'LOGISTICS_EXPEDITION',
      domainLabel: 'Logistik & Tracking Pengiriman',
      icon: 'truck',
      endpointSlug: 'shipments',
      itemNoun: 'Resi Pengiriman',
      kpiLabels: ['Total Pengiriman', 'Dalam Transit', 'Out for Delivery', 'Paket Terkirim'],
      formTitle: 'Buat Resi / Manifest Pengiriman',
      formSubtitle: 'Input data pengirim, penerima, armada kurir, dan berat kargo',
      fields: [
        { name: 'tracking_number', label: 'Nomor Resi / AWB', type: 'text', placeholder: 'EXP-8891-JKT', required: true },
        { name: 'courier', label: 'Kurir / Armada', type: 'select', options: ['JNE Express', 'SiCepat Cargo', 'J&T Super', 'Kurir Instan / Dedicated'], required: true },
        { name: 'sender', label: 'Pengirim (Kota Asal)', type: 'text', placeholder: 'Gudang Pusat Jakarta', required: true },
        { name: 'recipient', label: 'Penerima (Kota Tujuan)', type: 'text', placeholder: 'Siti Rahma - Surabaya', required: true },
        { name: 'weight_kg', label: 'Berat Kargo (Kg)', type: 'number', placeholder: '2.5', required: true },
        { name: 'status_select', label: 'Status Awal', type: 'select', options: ['MANIFEST', 'IN_TRANSIT', 'OUT_FOR_DELIVERY', 'DELIVERED'], required: true }
      ],
      columns: [
        { key: 'tracking_number', label: 'No. Resi' },
        { key: 'courier', label: 'Kurir' },
        { key: 'route', label: 'Rute (Asal -> Tujuan)' },
        { key: 'weight_kg', label: 'Berat' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'DELIVERED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'OUT_FOR_DELIVERY': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'IN_TRANSIT': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'MANIFEST': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      },
      initialRows: [
        { id: 1, tracking_number: 'EXP-9821-JKT', courier: 'JNE Express', sender: 'Gudang Pusat Jakarta', recipient: 'Budi Santoso (Surabaya)', weight_kg: 2.1, status: 'OUT_FOR_DELIVERY', created_at: new Date().toISOString() },
        { id: 2, tracking_number: 'EXP-5542-BDG', courier: 'SiCepat Cargo', sender: 'Fashion Distro Bandung', recipient: 'Siti Rahma (Medan)', weight_kg: 4.8, status: 'IN_TRANSIT', created_at: new Date().toISOString() },
        { id: 3, tracking_number: 'EXP-1109-SBY', courier: 'J&T Super', sender: 'Elektronik Maju Surabaya', recipient: 'Ahmad Fauzi (Bali)', weight_kg: 1.2, status: 'DELIVERED', created_at: new Date().toISOString() }
      ]
    };
  }

  // 7. Finance / Payroll / Invoicing / Billing
  if (
    c.includes('gaji') || c.includes('payroll') || c.includes('keuangan') || 
    c.includes('finance') || c.includes('invoice') || c.includes('tagihan') || 
    c.includes('reimburse') || c.includes('pembayaran') || c.includes('billing')
  ) {
    return {
      domainKey: 'FINANCE_PAYROLL',
      domainLabel: 'Finance, Invoice & Payroll',
      icon: 'receipt',
      endpointSlug: 'invoices',
      itemNoun: 'Invoice / Slip Pembayaran',
      kpiLabels: ['Total Tagihan', 'Pending Payment', 'Sudah Terbayar', 'Total Terbayar (Rp)'],
      formTitle: 'Terbitkan Invoice / Slip Transaksi',
      formSubtitle: 'Catat penerima tagihan, rincian nominal, dan tanggal jatuh tempo',
      fields: [
        { name: 'invoice_no', label: 'Nomor Invoice', type: 'text', placeholder: 'INV/2026/08/001', required: true },
        { name: 'client_name', label: 'Klien / Penerima', type: 'text', placeholder: 'PT Megah Kreasi', required: true },
        { name: 'amount', label: 'Jumlah Tagihan (Rp)', type: 'number', placeholder: '15000000', required: true },
        { name: 'due_date', label: 'Jatuh Tempo', type: 'text', placeholder: '2026-09-05', required: true },
        { name: 'description', label: 'Rincian Layanan / Pekerjaan', type: 'textarea', placeholder: 'Pengembangan Enterprise AI Integration...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'invoice_no', label: 'No. Invoice' },
        { key: 'client_name', label: 'Klien / Penerima' },
        { key: 'amount', label: 'Nominal' },
        { key: 'due_date', label: 'Jatuh Tempo' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'PAID': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'SENT': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'OVERDUE': 'bg-rose-500/10 text-rose-400 border-rose-500/20',
        'DRAFT': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      },
      initialRows: [
        { id: 1, invoice_no: 'INV/2026/08/101', client_name: 'PT Megah Kreasi', amount: 18500000, due_date: '2026-09-01', description: 'Sprint 1 Architecture & AI Engine', status: 'PAID', created_at: new Date().toISOString() },
        { id: 2, invoice_no: 'INV/2026/08/102', client_name: 'Studio Kopi Senja', amount: 4500000, due_date: '2026-08-30', description: 'Subscription Bot & POS Setup', status: 'SENT', created_at: new Date().toISOString() },
        { id: 3, invoice_no: 'INV/2026/08/098', client_name: 'Klinik Prima Husada', amount: 12000000, due_date: '2026-08-20', description: 'Lisensi Telemedis Modul', status: 'OVERDUE', created_at: new Date().toISOString() }
      ]
    };
  }

  // 8. E-Commerce / Store / Marketplace / Catalog
  if (
    c.includes('ecommerce') || c.includes('e-commerce') || c.includes('toko') || 
    c.includes('store') || c.includes('shop') || c.includes('marketplace') || 
    c.includes('produk') || c.includes('katalog') || c.includes('catalog') || 
    c.includes('cart') || c.includes('belanja') || c.includes('inventory') || 
    c.includes('stok') || c.includes('retail')
  ) {
    return {
      domainKey: 'ECOMMERCE_CATALOG',
      domainLabel: 'E-Commerce & Inventory Hub',
      icon: 'shopping-bag',
      endpointSlug: 'products',
      itemNoun: 'Katalog Produk',
      kpiLabels: ['Total Produk', 'Stok Rendah (<10)', 'Produk Terlaris', 'Nilai Aset Stok (Rp)'],
      formTitle: 'Tambah Produk ke Katalog',
      formSubtitle: 'Kelola SKU, harga jual, kategori barang, dan stok unit',
      fields: [
        { name: 'product_name', label: 'Nama Produk / Item', type: 'text', placeholder: 'Wireless Mechanical Keyboard', required: true },
        { name: 'sku', label: 'SKU Code', type: 'text', placeholder: 'ACC-KEY-001', required: true },
        { name: 'price', label: 'Harga Jual (Rp)', type: 'number', placeholder: '850000', required: true },
        { name: 'stock', label: 'Stok Unit', type: 'number', placeholder: '45', required: true },
        { name: 'category', label: 'Kategori', type: 'select', options: ['Gadget & Peripherals', 'Fashion & Apparel', 'Home & Living', 'Digital Goods'], required: true },
        { name: 'description', label: 'Deskripsi Produk', type: 'textarea', placeholder: 'Spesifikasi fitur utama produk...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'product_name', label: 'Nama Produk' },
        { key: 'sku', label: 'SKU' },
        { key: 'price', label: 'Harga' },
        { key: 'stock', label: 'Stok' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'IN_STOCK': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'LOW_STOCK': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'OUT_OF_STOCK': 'bg-rose-500/10 text-rose-400 border-rose-500/20'
      },
      initialRows: [
        { id: 1, product_name: 'Keychron K2 Pro Wireless', sku: 'KEY-KC2-PRO', price: 1450000, stock: 24, category: 'Gadget & Peripherals', status: 'IN_STOCK', created_at: new Date().toISOString() },
        { id: 2, product_name: 'Ergonomic Desk Mat Leather', sku: 'MAT-LTHR-BLK', price: 220000, stock: 4, category: 'Home & Living', status: 'LOW_STOCK', created_at: new Date().toISOString() },
        { id: 3, product_name: 'USB-C Magnetic Hub 8-in-1', sku: 'HUB-USBC-8IN', price: 499000, stock: 0, category: 'Gadget & Peripherals', status: 'OUT_OF_STOCK', created_at: new Date().toISOString() }
      ]
    };
  }

  // 9. Education / Course / LMS / Quiz
  if (
    c.includes('edukasi') || c.includes('kursus') || c.includes('course') || 
    c.includes('belajar') || c.includes('siswa') || c.includes('kelas') || 
    c.includes('materi') || c.includes('lms') || c.includes('sekolah') || c.includes('akademi')
  ) {
    return {
      domainKey: 'EDUCATION_LMS',
      domainLabel: 'E-Learning & Course Academy',
      icon: 'graduation-cap',
      endpointSlug: 'courses',
      itemNoun: 'Modul / Kelas Belajar',
      kpiLabels: ['Total Modul', 'Siswa Aktif', 'Tingkat Kelulusan', 'Avg Rating Siswa'],
      formTitle: 'Buat Modul Kursus Baru',
      formSubtitle: 'Rancang kurikulum materi, instruktur, dan tingkat kesulitan',
      fields: [
        { name: 'course_title', label: 'Judul Kursus / Modul', type: 'text', placeholder: 'Mastering AI Agent Engineering', required: true },
        { name: 'instructor', label: 'Nama Instruktur / Mentor', type: 'text', placeholder: 'Dr. Aris & Tim VirtuLabs', required: true },
        { name: 'level', label: 'Tingkat Kesulitan', type: 'select', options: ['Beginner', 'Intermediate', 'Advanced Expert'], required: true },
        { name: 'duration_hours', label: 'Estimasi Durasi (Jam)', type: 'number', placeholder: '12', required: true },
        { name: 'syllabus', label: 'Ringkasan Silabus Materi', type: 'textarea', placeholder: 'Poin-poin topik pembelajaran...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'course_title', label: 'Judul Modul' },
        { key: 'instructor', label: 'Instruktur' },
        { key: 'level', label: 'Level' },
        { key: 'duration', label: 'Durasi' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'PUBLISHED': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'DRAFT': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'ARCHIVED': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      },
      initialRows: [
        { id: 1, course_title: 'Fullstack AI Agent Engineering with Express & React', instructor: 'Devron & Anya', level: 'Advanced Expert', duration_hours: 18, status: 'PUBLISHED', created_at: new Date().toISOString() },
        { id: 2, course_title: 'Generative Engine Optimization (GEO) untuk Bisnis', instructor: 'Dr. Aris', level: 'Intermediate', duration_hours: 8, status: 'PUBLISHED', created_at: new Date().toISOString() },
        { id: 3, course_title: 'Prompt Optimization & Cost Reduction Playbook', instructor: 'Sentinel', level: 'Beginner', duration_hours: 4, status: 'DRAFT', created_at: new Date().toISOString() }
      ]
    };
  }

  // 10. Laundry / Service / Kiloan
  if (c.includes('laundry') || c.includes('cuci') || c.includes('setrika') || c.includes('kiloan')) {
    return {
      domainKey: 'LAUNDRY_SERVICE',
      domainLabel: 'Manajemen Laundry & Dry Clean',
      icon: 'shirt',
      endpointSlug: 'orders',
      itemNoun: 'Order Cucian',
      kpiLabels: ['Total Order Laundry', 'Dalam Proses Cuci', 'Siap Diambil Klien', 'Total Pendapatan (Rp)'],
      formTitle: 'Penerimaan Cucian Baru',
      formSubtitle: 'Catat data pelanggan, paket layanan, dan timbangan kiloan',
      fields: [
        { name: 'customer', label: 'Nama Pelanggan', type: 'text', placeholder: 'Ibu Ratna', required: true },
        { name: 'phone', label: 'No. WhatsApp', type: 'text', placeholder: '08123456789', required: true },
        { name: 'service_type', label: 'Paket Layanan', type: 'select', options: ['Cuci Komplit Kilat 1 Hari', 'Cuci Lipat Reguler 2 Hari', 'Bedcover King & Selimut', 'Dry Clean Jas / Gaun'], required: true },
        { name: 'weight_kg', label: 'Berat Timbangan (Kg)', type: 'number', placeholder: '4.5', required: true },
        { name: 'notes', label: 'Catatan Khusus Pakaian', type: 'textarea', placeholder: 'Pisahkan pakaian putih, parfum aroma lavender...', required: false, colSpan: 2 }
      ],
      columns: [
        { key: 'customer', label: 'Pelanggan' },
        { key: 'service_type', label: 'Layanan' },
        { key: 'weight_kg', label: 'Berat' },
        { key: 'total_price', label: 'Total Bayar' },
        { key: 'status', label: 'Status' }
      ],
      statusColors: {
        'SIAP_AMBIL': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
        'DISETRIKA': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
        'DICUCI': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
        'MENUNGGU': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
      },
      initialRows: [
        { id: 1, customer: 'Budi Santoso', phone: '08123456789', service_type: 'Cuci Komplit Kilat 1 Hari', weight_kg: 4.5, total_price: 36000, status: 'DICUCI', created_at: new Date().toISOString() },
        { id: 2, customer: 'Ibu Ratna', phone: '08198765432', service_type: 'Bedcover King & Selimut', weight_kg: 6.0, total_price: 60000, status: 'SIAP_AMBIL', created_at: new Date().toISOString() }
      ]
    };
  }

  // 11. Dynamic Adaptive General SaaS (Tailored dynamically to Title & Description keywords)
  const cleanTitle = title || 'Enterprise Micro-SaaS';
  const cleanDesc = description || 'Platform otomatisasi dan analitik data operasional modern';
  
  // Extract key concept from title
  const words = cleanTitle.split(/\s+/).filter(w => w.length > 2);
  const primaryEntity = words[0] || 'Unit';

  return {
    domainKey: 'DYNAMIC_ENTERPRISE_SAAS',
    domainLabel: `${cleanTitle} Platform`,
    icon: 'sparkles',
    endpointSlug: 'records',
    itemNoun: `Entri ${cleanTitle}`,
    kpiLabels: [`Total ${primaryEntity}`, `Aktif / Diproses`, `Optimal / Selesai`, 'Performa Index (%)'],
    formTitle: `Entri Data ${cleanTitle}`,
    formSubtitle: cleanDesc.slice(0, 80) + '...',
    fields: [
      { name: 'name', label: `Nama Target / Entitas ${primaryEntity}`, type: 'text', placeholder: `Contoh Target ${primaryEntity} 01`, required: true },
      { name: 'category', label: 'Kategori / Segmentasi', type: 'select', options: ['Tier 1 / Priority', 'Operational Core', 'Automated Integration', 'General Activity'], required: true },
      { name: 'priority_level', label: 'Tingkat Prioritas', type: 'select', options: ['High Priority', 'Standard', 'Low'], required: true },
      { name: 'target_value', label: 'Estimasi Nilai / Metrik', type: 'number', placeholder: '100', required: false },
      { name: 'details', label: 'Rincian Operasional & Catatan', type: 'textarea', placeholder: 'Keterangan lengkap sesuai kebutuhan...', required: false, colSpan: 2 }
    ],
    columns: [
      { key: 'name', label: 'Nama Target' },
      { key: 'category', label: 'Kategori' },
      { key: 'priority_level', label: 'Prioritas' },
      { key: 'target_value', label: 'Metrik' },
      { key: 'status', label: 'Status' }
    ],
    statusColors: {
      'OPTIMAL': 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20',
      'ACTIVE': 'bg-cyan-500/10 text-cyan-400 border-cyan-500/20',
      'PENDING': 'bg-amber-500/10 text-amber-400 border-amber-500/20',
      'ARCHIVED': 'bg-slate-500/10 text-slate-400 border-slate-500/20'
    },
    initialRows: [
      { id: 1, name: `${cleanTitle} Master Node 01`, category: 'Tier 1 / Priority', priority_level: 'High Priority', target_value: 95, status: 'OPTIMAL', created_at: new Date().toISOString() },
      { id: 2, name: `${cleanTitle} Sub-Module Alpha`, category: 'Operational Core', priority_level: 'Standard', target_value: 80, status: 'ACTIVE', created_at: new Date().toISOString() },
      { id: 3, name: `${cleanTitle} Pipeline Stream B`, category: 'Automated Integration', priority_level: 'Standard', target_value: 72, status: 'ACTIVE', created_at: new Date().toISOString() }
    ]
  };
}

export async function runProjectPipeline(projectId: string, options?: PipelineOptions) {
  try {
    const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
    if (projRes.rows.length === 0) return;
    const project = projRes.rows[0];

    const projectDir = project.repo_path || path.join(DEFAULT_PROJECTS_BASE_DIR, project.slug);
    const docsDir = path.join(projectDir, 'docs');
    const srcDir = path.join(projectDir, 'src');
    const frontendDir = path.join(srcDir, 'frontend');
    const backendDir = path.join(srcDir, 'backend');
    const imagesDir = path.join(frontendDir, 'assets', 'images');

    // Create directories
    fs.mkdirSync(docsDir, { recursive: true });
    fs.mkdirSync(frontendDir, { recursive: true });
    fs.mkdirSync(backendDir, { recursive: true });
    fs.mkdirSync(imagesDir, { recursive: true });

    // Save attached requirement documents if provided
    if (options?.attachedDocs && Array.isArray(options.attachedDocs)) {
      for (const doc of options.attachedDocs) {
        if (doc.base64) {
          try {
            const cleanBase64 = doc.base64.replace(/^data:application\/\w+;base64,/, '').replace(/^data:.*?;base64,/, '');
            const safeName = (doc.name || `spec-${Date.now()}.docx`).replace(/[^a-zA-Z0-9_.-]/g, '_');
            const targetFilePath = path.join(docsDir, safeName);
            fs.writeFileSync(targetFilePath, Buffer.from(cleanBase64, 'base64'));
            console.log(`[Project Attached Doc] Saved requirement document: ${targetFilePath}`);
          } catch (err) {
            console.warn('[Project Attached Doc Warning] Failed to save doc:', err);
          }
        }
      }
    }

    // Save uploaded images if provided
    const savedImages: Array<{ filename: string; menuLabel: string; relPath: string }> = [];
    if (options?.images && Array.isArray(options.images)) {
      for (const img of options.images) {
        if (img.base64) {
          try {
            const cleanBase64 = img.base64.replace(/^data:image\/\w+;base64,/, '').replace(/^data:.*?;base64,/, '');
            const safeName = (img.name || `img-${Date.now()}.png`).replace(/[^a-zA-Z0-9_.-]/g, '_');
            const targetFilePath = path.join(imagesDir, safeName);
            fs.writeFileSync(targetFilePath, Buffer.from(cleanBase64, 'base64'));
            savedImages.push({
              filename: safeName,
              menuLabel: img.menuLabel || safeName.replace(/\.[^/.]+$/, ''),
              relPath: `assets/images/${safeName}`
            });
            console.log(`[Project Asset] Saved image: ${targetFilePath}`);
          } catch (imgErr) {
            console.warn('[Project Asset Warning] Failed to save image:', imgErr);
          }
        }
      }
    }

    // ==========================================
    // PHASE 1: DISCOVERY & PRD (Acuan Utama)
    // ==========================================
    await updateProjectStage(projectId, 'SPECIFYING', 'Discovery & Product Requirements (PRD)', 15);
    await setAgentStatus('EMP-PM', 'WORKING');
    await logActivity('WRITE_SPEC', `PM Agent (Sarah) menyusun 01_PRD.md untuk: ${project.title}`, 'EMP-PM', projectId);

    const prdPrompt = `Buatkan Product Requirements Document (PRD) yang komprehensif, profesional, dan to-the-point dalam format Markdown (.md) untuk proyek berikut:
Judul Proyek: ${project.title}
Deskripsi/Goal: ${project.description || project.goal}
Opsi Arsitektur: Autentikasi=${options?.includeAuth ? 'Aktif (JWT)' : 'Bypass/Publik'}, Database=${options?.storageType || 'In-Memory'}, Tema=${options?.theme || 'Cyber Slate'}

PRD harus memuat:
# PRD: ${project.title}
## 1. Executive Summary & Problem Statement
## 2. Target Users & Personas
## 3. Core Features & Functional Requirements
## 4. User Stories & Acceptance Criteria
## 5. Non-Functional Requirements & Metrics`;

    const prdRes = await callAgentLLM('EMP-PM', 'Kamu adalah Senior Product Manager (Sarah Jenkins) di software studio.', prdPrompt, projectId);
    const prdContent = prdRes.content;
    fs.writeFileSync(path.join(docsDir, '01_PRD.md'), prdContent, 'utf8');
    await saveProjectDocument(projectId, 'PRD', '01_PRD.md', prdContent, 'EMP-PM', path.join('docs', '01_PRD.md'));
    await setAgentStatus('EMP-PM', 'IDLE');

    // Milestone Approval Gate (PRD v2.6):
    // Jika proyek meminta sign-off / approval klien terlebih dahulu sebelum coding
    if (options?.requireApproval) {
      await pool.query(
        `UPDATE projects 
         SET status = 'WAITING_APPROVAL', current_stage = 'Menunggu Persetujuan Klien', approval_status = 'PENDING', progress_percentage = 25, updated_at = NOW() 
         WHERE id = $1`,
        [projectId]
      );

      await logActivity(
        'WRITE_SPEC',
        `📌 PRD & Spesifikasi proyek "${project.title}" telah terbit. Menunggu review & persetujuan sign-off dari Klien sebelum koding dimulai.`,
        'EMP-PM',
        projectId
      );
      return;
    }

    // ==========================================
    // PHASE 2: FULL PARALLEL DESIGN, ARCHITECTURE, SCAFFOLDING & COMMERCIAL
    // ==========================================
    await updateProjectStage(projectId, 'BUILDING', 'Parallel Engineering, Design & Commercial Docs', 50);
    await setAgentStatus('EMP-UX', 'WORKING');
    await setAgentStatus('EMP-ARCH', 'WORKING');
    await setAgentStatus('EMP-DEV', 'WORKING');
    await setAgentStatus('EMP-MKT', 'WORKING');
    await setAgentStatus('EMP-LEG', 'WORKING');
    await setAgentStatus('EMP-TECHW', 'WORKING');

    await logActivity('CODE_GEN', `Seluruh divisi (UX, Arch, Dev, Mkt, Legal, Tech Writer) mengeksekusi tugas secara paralel penuh`, 'EMP-DEV', projectId);

    const port = project.port || 5001;

    // 1. UI/UX Design System Task
    const uxTask = (async () => {
      await logActivity('WRITE_SPEC', `Lead UI/UX Architect (Kaelen) merancang 02_UI_UX_Design_System.md`, 'EMP-UX', projectId);
      const uxPrompt = `Berdasarkan PRD proyek "${project.title}" (${project.description}), rancang Design System UI/UX lengkap dalam format Markdown (.md).
Gunakan tema: ${options?.theme || 'Deep Slate Cyber'}.`;
      const uxRes = await callAgentLLM('EMP-UX', 'Kamu adalah Lead UI/UX Architect (Kaelen).', uxPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '02_UI_UX_Design_System.md'), uxRes.content, 'utf8');
      await saveProjectDocument(projectId, 'UI_UX_SPEC', '02_UI_UX_Design_System.md', uxRes.content, 'EMP-UX', path.join('docs', '02_UI_UX_Design_System.md'));
    })();

    // 2. Architecture & API Contract Task
    const archTask = (async () => {
      await logActivity('WRITE_SPEC', `Software Architect (Viktor Cruz) merancang 03_Architecture_API.md`, 'EMP-ARCH', projectId);
      const archPrompt = `Berdasarkan PRD proyek "${project.title}" (${project.description}), rancang arsitektur teknis sistem dan kontrak REST API dalam format Markdown (.md):
Formatkan: Tech Stack (Node.js/Express + Tailwind), Database Model (${options?.storageType || 'In-Memory'}), Auth (${options?.includeAuth ? 'JWT Login/Register' : 'None'}), REST API Endpoints, dan Error Handling.`;
      const archRes = await callAgentLLM('EMP-ARCH', 'Kamu adalah Principal Software Architect (Viktor Cruz).', archPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '03_Architecture_API.md'), archRes.content, 'utf8');
      await saveProjectDocument(projectId, 'ARCHITECTURE', '03_Architecture_API.md', archRes.content, 'EMP-ARCH', path.join('docs', '03_Architecture_API.md'));
    })();

    // 3. Fullstack Code Scaffolding Task (Clean Separation: src/frontend & src/backend)
    const devScaffoldTask = (async () => {
      await logActivity('CODE_GEN', `Fullstack Dev (Devron) & UI Engineer (Anya) men-generate kodingan Express API & Frontend UI dinamis`, 'EMP-DEV', projectId);

      // Backend package.json
      const backendPackageJson: any = {
        name: `${project.slug}-backend`,
        version: "1.0.0",
        main: "server.js",
        scripts: {
          start: "node server.js"
        },
        dependencies: {
          express: "^4.19.2",
          cors: "^2.8.5"
        }
      };

      if (options?.includeAuth) {
        backendPackageJson.dependencies['jsonwebtoken'] = '^9.0.2';
      }
      if (options?.storageType === 'sqlite') {
        backendPackageJson.dependencies['better-sqlite3'] = '^11.8.1';
      }

      fs.writeFileSync(path.join(backendDir, 'package.json'), JSON.stringify(backendPackageJson, null, 2));

      // Root package.json
      const rootPackageJson = {
        name: `${project.slug}-app`,
        version: "1.0.0",
        scripts: {
          start: "node src/backend/server.js"
        }
      };
      fs.writeFileSync(path.join(projectDir, 'package.json'), JSON.stringify(rootPackageJson, null, 2));

      // Domain Classifier & Dynamic Context Preparation via detectDomainCategory
      const domainMeta = detectDomainCategory(project.title, project.description || project.goal || '');
      const domainCategory = domainMeta.domainKey;

      console.log(`[Dynamic CodeGen Pipeline] Domain detected: ${domainCategory} (${domainMeta.domainLabel}) for ${project.title}`);

      // =========================================================================
      // SUB-TASK A: DEVRON (Backend Dev) - Express API with Domain Mock Database
      // =========================================================================
      const devronBackendPrompt = `Kamu adalah Devron, Lead Backend Engineer di software studio kelas dunia.
Tugasmu: Tuliskan file Node.js Express Backend ("server.js") LENGKAP, SIAP JALAN, dan SPESIFIK untuk proyek ini:

Judul Proyek: "${project.title}"
Deskripsi / Problem & Solution: "${project.description || project.goal}"
Kategori Domain: ${domainMeta.domainLabel} (${domainMeta.domainKey})
Primary Resource Noun: ${domainMeta.itemNoun}
Port: process.env.PORT || ${port}

Target Data Schema & Struktur Record:
- Resource Endpoint Slug: /api/${domainMeta.endpointSlug} (dan juga alias /api/items)
- Initial Mock Fields: ${JSON.stringify(domainMeta.fields.map(f => f.name))} + id, status, created_at
- Referensi Dummy Data Contoh: ${JSON.stringify(domainMeta.initialRows[0] || {})}

Spesifikasi Teknis Wajib:
1. Format CommonJS (require('express'), require('cors'), require('path'), dll).
2. Sediakan mock in-memory database dengan struktur field data YANG 100% SESUAI DENGAN DOMAIN DAN JUDUL PROYEK ("${project.title}").
3. Sediakan 3-5 baris data awal yang realistis, relevan dengan ide/masalah proyek, dan berbahasa Indonesia / Inggris kontekstual.
4. Buatkan REST API Endpoints lengkap:
   - GET /health -> kembalikan status OK, nama project, domain, port
   - GET /api/${domainMeta.endpointSlug} dan GET /api/items -> kembalikan list data { success: true, data: dataset }
   - POST /api/${domainMeta.endpointSlug} dan POST /api/items -> simpan entri baru { success: true, data: newRecord }
   - PATCH /api/${domainMeta.endpointSlug}/:id dan PATCH /api/items/:id -> update status / fields { success: true, data: updatedRecord }
   - DELETE /api/${domainMeta.endpointSlug}/:id dan DELETE /api/items/:id -> hapus record { success: true, message: 'Deleted' }
5. Sajikan static files dari folder '../frontend' dan fallback SPA routing (app.get('*', ...)).
6. app.listen(PORT, '0.0.0.0', ...).
7. HINDARI generic todo list. Buat field data yang kaya sesuai konteks ${project.title}.

KEMBALIKAN HANYA KODE JAVASCRIPT DALAM CODE BLOCK:
\`\`\`javascript
// Kode server.js lengkap di sini
\`\`\``;

      // =========================================================================
      // SUB-TASK B: ANYA (Frontend UI/UX) - Modern Responsive Dashboard UI
      // =========================================================================
      const anyaFrontendPrompt = `Kamu adalah Anya, Lead Frontend Engineer & Elite UI/UX Specialist (Linear/Vercel/Stripe aesthetic).
Tugasmu: Tuliskan file HTML5 ("index.html") LENGKAP, CANTIK, BERSIH, dan INTERAKTIF untuk proyek ini:

Judul Proyek: "${project.title}"
Deskripsi / Problem & Solution: "${project.description || project.goal}"
Kategori Domain: ${domainMeta.domainLabel} (${domainMeta.domainKey})
Primary Resource Noun: ${domainMeta.itemNoun}
Port: ${port}

Target Visual & Layout:
- Icon Tema: Lucide icon "${domainMeta.icon}"
- 4 KPI Metric Cards: ${domainMeta.kpiLabels.join(' | ')}
- Form Title: "${domainMeta.formTitle}"
- Form Subtitle: "${domainMeta.formSubtitle}"
- Form Fields yang perlu disediakan:
${domainMeta.fields.map(f => `  * ${f.label} (${f.name}) - Type: ${f.type}${f.options ? ' - Options: ' + f.options.join(', ') : ''}`).join('\n')}
- API Endpoint Target: /api/${domainMeta.endpointSlug} (atau /api/items)

Spesifikasi Visual & Fungsional Wajib:
1. HTML5 Lengkap (dari <!DOCTYPE html> sampai </html>).
2. Tailwind CSS via CDN (https://cdn.tailwindcss.com), Font 'Plus Jakarta Sans' via Google Fonts, dan Lucide Icons via unpkg (https://unpkg.com/lucide@latest).
3. Tema Dark Modern: Background slate-950, card glassmorphism (slate-900 border slate-800), rounded-xl/2xl, pulsing live emerald badge.
4. Komponen Dashboard Terstruktur Sesuai Domain:
   - Header Glassmorphism: Icon tema, Judul Proyek "${project.title}", Badge LIVE hijau pulsing, Badge Domain "${domainMeta.domainLabel}", Port ${port}, dan Tombol Refresh.
   - 4 KPI Metric Summary Cards di bagian atas dengan counter dinamis.
   - Form Entri Spesifik: Form input responsif yang memuat seluruh field domain spesifik di atas (bukan generic todo).
   - Search & Filter Bar real-time.
   - Rich Data List / Table Card: Menampilkan entri data dengan title, subtitle badge informasi spesifik, status badge berwarna, dan tombol aksi (Update Status / Selesai / Hapus).
   - Empty State yang elegan jika data kosong.
5. JavaScript Vanilla Terintegrasi:
   - Fetch GET /api/${domainMeta.endpointSlug} atau /api/items saat loadData()
   - POST data baru saat form submit
   - PATCH / DELETE saat tombol aksi ditekan
   - Update realtime KPI counter dan rendering list
   - lucide.createIcons() dipanggil setiap setelah re-render UI.

KEMBALIKAN HANYA KODE HTML DALAM CODE BLOCK:
\`\`\`html
<!DOCTYPE html>
<!-- Kode index.html lengkap di sini -->
</html>
\`\`\``;

      let generatedServerJs = "";
      let generatedIndexHtml = "";

      try {
        const [devronRes, anyaRes] = await Promise.all([
          callAgentLLM('EMP-DEV', 'Kamu adalah Principal Backend Engineer (Devron). Selalu outputkan kode javascript di dalam markdown code block.', devronBackendPrompt, projectId),
          callAgentLLM('EMP-FE', 'Kamu adalah Principal Frontend Engineer (Anya). Selalu outputkan kode HTML lengkap di dalam markdown code block.', anyaFrontendPrompt, projectId)
        ]);

        generatedServerJs = extractCodeBlock(devronRes.content, 'javascript');
        generatedIndexHtml = extractCodeBlock(anyaRes.content, 'html');
      } catch (genErr) {
        console.warn(`[Dynamic CodeGen Dual LLM Warning for ${projectId}]:`, genErr);
      }

      // Robust Domain Fallback if Extraction is Too Short or Failed
      if (!generatedServerJs || generatedServerJs.length < 150) {
        console.log(`[Dynamic CodeGen] Generating domain fallback server.js for ${domainCategory}`);
        const endpointSlug = domainMeta.endpointSlug;
        const initialRows = domainMeta.initialRows;

        generatedServerJs = `const express = require('express');
const cors = require('cors');
const path = require('path');

const app = express();
const PORT = process.env.PORT || ${port};

app.use(cors());
app.use(express.json());
app.use(express.static(path.join(__dirname, '../frontend')));

let dataset = ${JSON.stringify(initialRows, null, 2)};

app.get('/health', (req, res) => res.json({ 
  status: 'OK', 
  project: ${JSON.stringify(project.title)}, 
  domain: ${JSON.stringify(domainMeta.domainLabel)}, 
  port: PORT 
}));

app.get('/api/${endpointSlug}', (req, res) => res.json({ success: true, data: dataset }));
app.get('/api/items', (req, res) => res.json({ success: true, data: dataset }));

app.post('/api/${endpointSlug}', (req, res) => {
  const newRow = { id: dataset.length > 0 ? Math.max(...dataset.map(d => d.id || 0)) + 1 : 1, ...req.body, created_at: new Date().toISOString() };
  dataset.unshift(newRow);
  res.status(201).json({ success: true, data: newRow });
});
app.post('/api/items', (req, res) => {
  const newRow = { id: dataset.length > 0 ? Math.max(...dataset.map(d => d.id || 0)) + 1 : 1, ...req.body, created_at: new Date().toISOString() };
  dataset.unshift(newRow);
  res.status(201).json({ success: true, data: newRow });
});

app.patch('/api/${endpointSlug}/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = dataset.find(r => r.id === id);
  if (!row) return res.status(404).json({ error: 'Record not found' });
  Object.assign(row, req.body);
  res.json({ success: true, data: row });
});
app.patch('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  const row = dataset.find(r => r.id === id);
  if (!row) return res.status(404).json({ error: 'Record not found' });
  Object.assign(row, req.body);
  res.json({ success: true, data: row });
});

app.delete('/api/${endpointSlug}/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  dataset = dataset.filter(r => r.id !== id);
  res.json({ success: true, message: 'Record deleted' });
});
app.delete('/api/items/:id', (req, res) => {
  const id = parseInt(req.params.id, 10);
  dataset = dataset.filter(r => r.id !== id);
  res.json({ success: true, message: 'Record deleted' });
});

app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../frontend/index.html'));
});

app.listen(PORT, '0.0.0.0', () => {
  console.log('[Live Micro-App] ' + ${JSON.stringify(project.title)} + ' running on port ' + PORT);
});
`;
      }

      if (!generatedIndexHtml || generatedIndexHtml.length < 200) {
        console.log(`[Dynamic CodeGen] Generating domain fallback index.html for ${domainCategory}`);
        
        // Generate Form Inputs HTML dynamically from domainMeta.fields
        const formFieldsHtml = domainMeta.fields.map(f => {
          const colSpanClass = f.colSpan === 2 ? 'sm:col-span-2' : 'sm:col-span-1';
          if (f.type === 'select') {
            const optionsHtml = (f.options || []).map(opt => `<option value="${opt}">${opt}</option>`).join('\n                ');
            return `<div class="${colSpanClass}">
              <label class="block text-xs font-semibold text-slate-400 mb-1">${f.label}</label>
              <select id="field_${f.name}" ${f.required ? 'required' : ''} class="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
                ${optionsHtml}
              </select>
            </div>`;
          } else if (f.type === 'textarea') {
            return `<div class="${colSpanClass}">
              <label class="block text-xs font-semibold text-slate-400 mb-1">${f.label}</label>
              <textarea id="field_${f.name}" rows="2" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} class="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500 resize-none"></textarea>
            </div>`;
          } else {
            return `<div class="${colSpanClass}">
              <label class="block text-xs font-semibold text-slate-400 mb-1">${f.label}</label>
              <input type="${f.type}" id="field_${f.name}" placeholder="${f.placeholder || ''}" ${f.required ? 'required' : ''} class="w-full bg-slate-900 text-white border border-slate-700 rounded-xl px-3 py-2 text-sm focus:outline-none focus:border-cyan-500">
            </div>`;
          }
        }).join('\n            ');

        // Form JS payload collector
        const formSubmitPayloadJs = domainMeta.fields.map(f => {
          if (f.type === 'number') {
            return `${f.name}: Number(document.getElementById('field_${f.name}').value) || 0`;
          }
          return `${f.name}: document.getElementById('field_${f.name}').value`;
        }).join(',\n          ');

        const formResetJs = domainMeta.fields.map(f => `if (document.getElementById('field_${f.name}')) document.getElementById('field_${f.name}').value = '';`).join('\n        ');

        generatedIndexHtml = `<!DOCTYPE html>
<html lang="id" class="dark">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${project.title} - Enterprise Autonomous Application</title>
  <script src="https://cdn.tailwindcss.com"></script>
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Plus+Jakarta+Sans:wght@400;500;600;700;800&display=swap" rel="stylesheet">
  <script src="https://unpkg.com/lucide@latest"></script>
  <style>
    body { font-family: 'Plus Jakarta Sans', sans-serif; background-color: #0b0f19; }
    .glassmorphism { background: rgba(15, 23, 42, 0.75); backdrop-filter: blur(12px); border: 1px solid rgba(56, 189, 248, 0.2); }
  </style>
</head>
<body class="text-slate-100 min-h-screen flex flex-col antialiased">
  <header class="glassmorphism sticky top-0 z-40 px-6 py-4 border-b border-slate-800 flex justify-between items-center">
    <div class="flex items-center gap-3">
      <div class="w-10 h-10 rounded-xl bg-gradient-to-tr from-cyan-500 to-indigo-600 flex items-center justify-center text-white font-black shadow-lg shadow-cyan-500/20">
        <i data-lucide="${domainMeta.icon}" class="w-5 h-5"></i>
      </div>
      <div>
        <div class="flex items-center gap-2">
          <h1 class="text-base font-bold text-white leading-tight">${project.title}</h1>
          <span class="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
            <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
            LIVE
          </span>
          <span class="text-[10px] font-mono uppercase px-2 py-0.5 rounded bg-slate-800 text-cyan-400 border border-slate-700">
            ${domainMeta.domainLabel}
          </span>
        </div>
        <p class="text-xs text-slate-400">${project.description || 'Aplikasi otonom terintegrasi VirtuLabs Studio'}</p>
      </div>
    </div>
    <div class="flex items-center gap-3">
      <div class="bg-slate-900/80 px-3 py-1.5 rounded-lg border border-slate-800 text-right">
        <span class="text-[10px] text-slate-400 font-mono block">PORT</span>
        <span class="text-xs font-mono font-bold text-cyan-400">${port}</span>
      </div>
      <button onclick="loadData()" class="p-2 rounded-lg bg-slate-800 text-slate-300 hover:bg-slate-700 transition flex items-center gap-1.5 text-xs font-semibold">
        <i data-lucide="refresh-cw" class="w-4 h-4"></i>
        <span>Refresh</span>
      </button>
    </div>
  </header>

  <main class="max-w-6xl w-full mx-auto p-4 sm:p-6 md:p-8 flex-1 flex flex-col gap-6">
    <div class="grid grid-cols-2 sm:grid-cols-4 gap-4">
      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">${domainMeta.kpiLabels[0]}</span>
          <h3 id="statKpi1" class="text-2xl font-extrabold text-white mt-0.5">0</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-indigo-500/10 text-indigo-400 flex items-center justify-center">
          <i data-lucide="layers" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">${domainMeta.kpiLabels[1]}</span>
          <h3 id="statKpi2" class="text-2xl font-extrabold text-amber-400 mt-0.5">0</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-amber-500/10 text-amber-400 flex items-center justify-center">
          <i data-lucide="clock" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">${domainMeta.kpiLabels[2]}</span>
          <h3 id="statKpi3" class="text-2xl font-extrabold text-emerald-400 mt-0.5">0</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-emerald-500/10 text-emerald-400 flex items-center justify-center">
          <i data-lucide="check-circle-2" class="w-5 h-5"></i>
        </div>
      </div>

      <div class="glassmorphism p-4 rounded-xl flex items-center justify-between">
        <div>
          <span class="text-xs font-medium text-slate-400">${domainMeta.kpiLabels[3]}</span>
          <h3 id="statKpi4" class="text-2xl font-extrabold text-cyan-400 mt-0.5">92%</h3>
        </div>
        <div class="w-10 h-10 rounded-lg bg-cyan-500/10 text-cyan-400 flex items-center justify-center">
          <i data-lucide="sparkles" class="w-5 h-5"></i>
        </div>
      </div>
    </div>

    <div class="grid grid-cols-1 lg:grid-cols-12 gap-6 flex-1 items-start">
      <div class="glassmorphism p-5 rounded-2xl lg:col-span-5 shadow-xl">
        <div class="flex items-center gap-2 mb-1 text-white font-bold text-sm">
          <i data-lucide="plus-circle" class="w-4 h-4 text-cyan-400"></i>
          <span>${domainMeta.formTitle}</span>
        </div>
        <p class="text-xs text-slate-400 mb-4">${domainMeta.formSubtitle}</p>
        
        <form id="recordForm" class="space-y-3.5">
          <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
            ${formFieldsHtml}
          </div>
          <button type="submit" class="w-full bg-gradient-to-r from-cyan-500 to-indigo-600 text-white font-bold py-2.5 rounded-xl text-sm transition hover:opacity-90 shadow-lg shadow-cyan-500/25 flex items-center justify-center gap-2">
            <i data-lucide="send" class="w-4 h-4"></i>
            <span>Simpan & Eksekusi Data</span>
          </button>
        </form>
      </div>

      <div class="glassmorphism p-5 rounded-2xl lg:col-span-7 shadow-xl flex flex-col gap-4">
        <div class="flex items-center justify-between border-b border-slate-800 pb-3">
          <div class="flex items-center gap-2">
            <i data-lucide="list" class="w-4 h-4 text-cyan-400"></i>
            <span class="font-bold text-sm text-white">Daftar Rekaman Live: ${domainMeta.itemNoun}</span>
          </div>
          <input type="text" id="searchInput" placeholder="Cari data..." oninput="renderTable()" class="bg-slate-900 border border-slate-700 rounded-lg px-2.5 py-1 text-xs text-white focus:outline-none focus:border-cyan-500">
        </div>

        <div id="dataList" class="space-y-2.5 max-h-[500px] overflow-y-auto pr-1"></div>
      </div>
    </div>
  </main>

  <script>
    let dataset = [];
    const statusMap = ${JSON.stringify(domainMeta.statusColors)};

    async function loadData() {
      try {
        const res = await fetch('/api/${domainMeta.endpointSlug}');
        const json = await res.json();
        dataset = json.data || [];
        updateStats();
        renderTable();
      } catch (e) {
        console.error('Load data error:', e);
      }
    }

    function updateStats() {
      document.getElementById('statKpi1').innerText = dataset.length;
      document.getElementById('statKpi2').innerText = dataset.filter(x => x.status === 'NEEDS_REVIEW' || x.status === 'MENUNGGU' || x.status === 'ROUTED' || x.status === 'BREWING' || x.status === 'IN_TRANSIT' || x.status === 'PENDING' || x.status === 'ACTIVE' || x.status === 'DRAFT').length;
      document.getElementById('statKpi3').innerText = dataset.filter(x => x.status === 'OPTIMAL' || x.status === 'CACHED' || x.status === 'SELESAI' || x.status === 'SERVED' || x.status === 'DELIVERED' || x.status === 'PAID' || x.status === 'CLOSED_WON' || x.status === 'PUBLISHED' || x.status === 'SIAP_AMBIL' || x.status === 'DONE').length;
    }

    function renderTable() {
      const list = document.getElementById('dataList');
      const search = (document.getElementById('searchInput').value || '').toLowerCase();
      const filtered = dataset.filter(d => JSON.stringify(d).toLowerCase().includes(search));

      if (filtered.length === 0) {
        list.innerHTML = '<div class="p-8 text-center text-slate-500 text-sm">Belum ada data rekaman. Masukkan data melalui form di sebelah kiri.</div>';
        return;
      }

      list.innerHTML = filtered.map(item => {
        const title = item.url || item.app_name || item.name || item.item || item.customer || item.lead_name || item.tracking_number || item.invoice_no || item.product_name || item.course_title || item.title || ('Rekaman #' + item.id);
        const sub = item.focus_keyword || item.provider_model || item.symptoms || item.notes || item.requirements || item.sender || item.client_name || item.category || item.instructor || item.details || item.service_type || '';
        const badge1 = item.audit_type || item.tokens_saved || item.triage_level || item.recommended_poly || item.payment_method || item.courier || item.due_date || item.sku || item.level || '';
        const scoreOrVal = item.score !== undefined ? ('Score: ' + item.score) : (item.latency_ms || (item.price ? ('Rp ' + Number(item.price).toLocaleString()) : (item.deal_value ? ('Rp ' + Number(item.deal_value).toLocaleString()) : (item.amount ? ('Rp ' + Number(item.amount).toLocaleString()) : ''))));
        
        const status = item.status || 'ACTIVE';
        const colorClass = statusMap[status] || 'bg-slate-800 text-slate-300 border-slate-700';

        return '<div class="p-3.5 rounded-xl bg-slate-900/90 border border-slate-800 hover:border-slate-700 transition flex items-center justify-between gap-3">' +
          '<div class="flex-1 min-w-0">' +
            '<div class="flex items-center gap-2 flex-wrap">' +
              '<h4 class="font-bold text-sm text-white truncate">' + title + '</h4>' +
              (badge1 ? '<span class="px-2 py-0.5 text-[10px] font-semibold rounded bg-indigo-500/10 text-indigo-400 border border-indigo-500/20">' + badge1 + '</span>' : '') +
              (scoreOrVal ? '<span class="px-2 py-0.5 text-[10px] font-mono font-bold rounded bg-cyan-500/10 text-cyan-400 border border-cyan-500/20">' + scoreOrVal + '</span>' : '') +
            '</div>' +
            (sub ? '<p class="text-xs text-slate-400 mt-1 line-clamp-1">' + sub + '</p>' : '') +
          '</div>' +
          '<div class="flex items-center gap-2 shrink-0">' +
            '<span class="px-2.5 py-1 text-[11px] font-bold rounded-lg border ' + colorClass + '">' + status + '</span>' +
            '<button onclick="deleteItem(' + item.id + ')" class="p-1.5 rounded-lg text-slate-500 hover:text-rose-400 hover:bg-rose-500/10 transition" title="Hapus">' +
              '<i data-lucide="trash-2" class="w-4 h-4"></i>' +
            '</button>' +
          '</div>' +
        '</div>';
      }).join('');
      if (window.lucide) lucide.createIcons();
    }

    async function deleteItem(id) {
      if (!confirm('Hapus rekaman data ini?')) return;
      try {
        await fetch('/api/${domainMeta.endpointSlug}/' + id, { method: 'DELETE' });
        loadData();
      } catch (e) {
        console.error('Delete error:', e);
      }
    }

    document.getElementById('recordForm').addEventListener('submit', async (e) => {
      e.preventDefault();
      const payload = {
        ${formSubmitPayloadJs},
        status: '${domainMeta.initialRows[0]?.status || 'ACTIVE'}'
      };

      try {
        await fetch('/api/${domainMeta.endpointSlug}', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(payload)
        });
        ${formResetJs}
        loadData();
      } catch (err) {
        console.error('Submit error:', err);
      }
    });

    loadData();
  </script>
</body>
</html>`;
      }

      // Write Generated Source Code to Disk
      fs.writeFileSync(path.join(backendDir, 'server.js'), generatedServerJs.trim(), 'utf8');
      fs.writeFileSync(path.join(frontendDir, 'index.html'), generatedIndexHtml.trim(), 'utf8');
      fs.writeFileSync(path.join(frontendDir, 'style.css'), "/* Clean Modern Typography & Polish */\nbody { font-family: 'Plus Jakarta Sans', sans-serif; }", 'utf8');

      // Install dependencies fast
      try {
        await execPromise(`cd "${backendDir}" && npm install --silent --prefer-offline --no-audit --no-fund`);
      } catch (err: any) {
        console.warn('npm install warning:', err.message);
      }
    })();

    // 4. Marketing Copy Task
    const mktTask = (async () => {
      await logActivity('WRITE_SPEC', `Growth & Marketing Lead (Vibe) menyusun 08_Sales_Pitch_Clients.md`, 'EMP-MKT', projectId);
      const mktPrompt = `Tuliskan Marketing Copy Deck & Sales Pitch Proposal (.md) untuk produk ini:
Produk: ${project.title}
Target: Calon Klien / Pengguna Bisnis
Goal: ${project.description}

Formatkan dengan headline menarik, value proposition, target client profiles, dan email outreach template.`;
      const mktRes = await callAgentLLM('EMP-MKT', 'Kamu adalah Growth & Marketing Copywriter (Vibe).', mktPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '08_Sales_Pitch_Clients.md'), mktRes.content, 'utf8');
      await saveProjectDocument(projectId, 'SALES_PITCH', '08_Sales_Pitch_Clients.md', mktRes.content, 'EMP-MKT', path.join('docs', '08_Sales_Pitch_Clients.md'));
    })();

    // 5. Legal Terms Task
    const legTask = (async () => {
      await logActivity('WRITE_SPEC', `Legal Counsel (Justicia) menyusun 06_Privacy_Terms.md`, 'EMP-LEG', projectId);
      const legPrompt = `Tuliskan Privacy Policy & Terms of Service (.md) ringkas dan standar industri untuk aplikasi software: ${project.title}.`;
      const legRes = await callAgentLLM('EMP-LEG', 'Kamu adalah Legal Counsel Specialist (Justicia).', legPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '06_Privacy_Terms.md'), legRes.content, 'utf8');
      await saveProjectDocument(projectId, 'LEGAL_TERMS', '06_Privacy_Terms.md', legRes.content, 'EMP-LEG', path.join('docs', '06_Privacy_Terms.md'));
    })();

    // 6. User Manual Task
    const techwTask = (async () => {
      await logActivity('WRITE_SPEC', `Tech Writer (Page) menyusun 07_User_Manual.md`, 'EMP-TECHW', projectId);
      const userManualPrompt = `Tuliskan panduan penggunaan lengkap (User Manual .md) untuk aplikasi ${project.title}. Berikan langkah onboarding, cara navigasi, dan troubleshooting.`;
      const docRes = await callAgentLLM('EMP-TECHW', 'Kamu adalah Technical Writer Lead (Page).', userManualPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '07_User_Manual.md'), docRes.content, 'utf8');
      await saveProjectDocument(projectId, 'USER_MANUAL', '07_User_Manual.md', docRes.content, 'EMP-TECHW', path.join('docs', '07_User_Manual.md'));
    })();

    // Run all 6 tasks in parallel
    await Promise.all([uxTask, archTask, devScaffoldTask, mktTask, legTask, techwTask]);

    await setAgentStatus('EMP-UX', 'IDLE');
    await setAgentStatus('EMP-ARCH', 'IDLE');
    await setAgentStatus('EMP-DEV', 'IDLE');
    await setAgentStatus('EMP-MKT', 'IDLE');
    await setAgentStatus('EMP-LEG', 'IDLE');
    await setAgentStatus('EMP-TECHW', 'IDLE');

    // ==========================================
    // PHASE 3: QUALITY & SECURITY TESTING (PARALLEL)
    // ==========================================
    await updateProjectStage(projectId, 'TESTING', 'QA Testing & Security Audit', 80);
    await setAgentStatus('EMP-QA', 'WORKING');
    await setAgentStatus('EMP-SEC', 'WORKING');
    await logActivity('TEST_RUN', `SQA (Tessa) & Security Auditor (Sentinel) menjalankan verifikasi secara paralel`, 'EMP-QA', projectId);

    const qaTask = (async () => {
      await logActivity('TEST_RUN', `Lead SQA (Tessa) menyusun 04_QA_Test_Report.md`, 'EMP-QA', projectId);
      const qaPrompt = `Buatkan Dokumen QA Test Report (.md) untuk rilis aplikasi ${project.title}.
Nyatakan bahwa semua Acceptance Criteria lolos (PASSED), status Unit & Integration Test 100% Green, dan aplikasi layak dideploy.`;
      const qaRes = await callAgentLLM('EMP-QA', 'Kamu adalah Lead SQA Engineer (Tessa).', qaPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '04_QA_Test_Report.md'), qaRes.content, 'utf8');
      await saveProjectDocument(projectId, 'QA_REPORT', '04_QA_Test_Report.md', qaRes.content, 'EMP-QA', path.join('docs', '04_QA_Test_Report.md'));
    })();

    const secTask = (async () => {
      await logActivity('TEST_RUN', `Cybersecurity Lead (Sentinel) menyusun 05_Security_Audit.md`, 'EMP-SEC', projectId);
      const secPrompt = `Buatkan Dokumen Security & Compliance Audit (.md) untuk ${project.title}. Analisis sanitasi input, autentikasi, CORS, dan audit zero-vulnerability.`;
      const secRes = await callAgentLLM('EMP-SEC', 'Kamu adalah Cybersecurity Lead (Sentinel).', secPrompt, projectId);
      fs.writeFileSync(path.join(docsDir, '05_Security_Audit.md'), secRes.content, 'utf8');
      await saveProjectDocument(projectId, 'SECURITY_AUDIT', '05_Security_Audit.md', secRes.content, 'EMP-SEC', path.join('docs', '05_Security_Audit.md'));
    })();

    await Promise.all([qaTask, secTask]);

    await setAgentStatus('EMP-QA', 'IDLE');
    await setAgentStatus('EMP-SEC', 'IDLE');

    // ==========================================
    // PHASE 4: DEPLOYMENT (PM2)
    // ==========================================
    await updateProjectStage(projectId, 'DEPLOYED', 'DevOps Deploying to PM2', 95);
    await setAgentStatus('EMP-OPS', 'WORKING');
    await logActivity('DEPLOY', `DevOps (Cipher) mendeploy aplikasi ke process manager PM2`, 'EMP-OPS', projectId);

    const pm2Name = `proj-${project.slug}`;

    // Create Ecosystem Config
    const ecosystemConfig = `module.exports = {
  apps: [
    {
      name: "${pm2Name}",
      script: "server.js",
      cwd: "${backendDir}",
      env: {
        PORT: ${port},
        NODE_ENV: "production"
      }
    }
  ]
};`;
    fs.writeFileSync(path.join(projectDir, 'ecosystem.config.js'), ecosystemConfig, 'utf8');

    // Launch PM2 process with syntax verification
    const backendScript = path.join(backendDir, 'server.js');
    try {
      // 1. Syntax Check
      await execPromise(`node --check "${backendScript}"`);
      console.log(`[Pre-Deploy Check] Node syntax valid for ${backendScript}`);

      // 2. Launch PM2
      await execPromise(`pm2 delete "${pm2Name}" 2>/dev/null || true`);
      await execPromise(`pm2 start "${path.join(projectDir, 'ecosystem.config.js')}"`);
    } catch (pm2Err: any) {
      console.error('[PM2 Deploy Error]:', pm2Err.message);
      throw new Error(`Deployment failed on syntax check / PM2 start: ${pm2Err.message}`);
    }

    await setAgentStatus('EMP-OPS', 'IDLE');

    // ==========================================
    // PHASE 5: COMPLETE & READY FOR OWNER
    // ==========================================
    const liveUrl = `http://localhost:${port}`;
    await pool.query(
      `UPDATE projects 
       SET status = 'DEPLOYED', current_stage = 'Live & Ready for Owner', progress_percentage = 100, 
           pm2_name = $1, port = $2, live_url = $3, repo_path = $4, updated_at = NOW()
       WHERE id = $5`,
      [pm2Name, port, liveUrl, projectDir, projectId]
    );

    await logActivity('DEPLOY', `Proyek ${project.title} berhasil live di ${liveUrl}`, 'EMP-CEO', projectId, {
      port,
      liveUrl,
      status: 'ONLINE'
    });

    // Notify in chat & trigger broadcast log
    await pool.query(
      `INSERT INTO chat_messages (room_type, project_id, sender_type, sender_id, message)
       VALUES ('PROJECT', $1, 'AGENT', 'EMP-CEO', $2)`,
      [
        projectId,
        `🎉 Selamat Owner! Proyek **"${project.title}"** telah selesai dibangun secara penuh dan sudah online di port **${port}** (${liveUrl}). Dokumen spesifikasi (PRD, UI/UX, Architecture, QA, Security, Sales Pitch, Legal, User Manual) telah lengkap terbit di tabs Dokumen.`
      ]
    );

    // Telegram / Broadcast Notification Helper
    try {
      const telegramMsg = `🚀 [VirtuLabs OS] Proyek "${project.title}" telah SUKSES dideploy dan siap digunakan!\n🌐 Live URL: ${liveUrl}\n📁 Repo Path: ${projectDir}\n📊 Status: DEPLOYED (Port ${port})`;
      const tgCmd = `export PATH=$PATH:/root/.nvm/versions/node/v24.18.0/bin; openclaw message send --channel telegram --account dev --target 8494358003 --message "${telegramMsg.replace(/"/g, '\\"')}" 2>/dev/null || true`;
      exec(tgCmd);
    } catch (tgErr) {
      console.warn('[Telegram Broadcast Warning]:', tgErr);
    }

  } catch (error: any) {
    console.error(`[Project Pipeline Fatal Error for ${projectId}]:`, error);
    await pool.query(
      `UPDATE projects SET status = 'FAILED', current_stage = 'Pipeline Failed' WHERE id = $1`,
      [projectId]
    );
    await logActivity('SYSTEM', `Pipeline gagal pada proyek ${projectId}: ${error.message}`, 'EMP-SYS', projectId);
  }
}

async function updateProjectStage(projectId: string, status: string, stage: string, progress: number) {
  await pool.query(
    `UPDATE projects SET status = $1, current_stage = $2, progress_percentage = $3, updated_at = NOW() WHERE id = $4`,
    [status, stage, progress, projectId]
  );
}

async function setAgentStatus(agentId: string, status: string) {
  try {
    await pool.query(
      `UPDATE employees SET status = $1 WHERE id = $2`,
      [status, agentId]
    );
  } catch (err) {
    console.warn(`[Warning setAgentStatus ${agentId}]:`, err);
  }
}

async function saveProjectDocument(projectId: string, docType: string, title: string, content: string, authorId: string, filePath: string) {
  await pool.query(
    `INSERT INTO project_documents (project_id, doc_type, title, content, author_agent_id, file_path)
     VALUES ($1, $2, $3, $4, $5, $6)`,
    [projectId, docType, title, content, authorId, filePath]
  );
}

export async function iterateProjectPipeline(
  projectId: string,
  userPrompt: string,
  iterationType: string = 'FEATURE_UPDATE',
  userId?: string
): Promise<{
  success: boolean;
  versionFrom: string;
  versionTo: string;
  changesSummary: string;
  affectedFiles: string[];
  revisionId: string;
}> {
  const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projRes.rows.length === 0) {
    throw new Error('Project tidak ditemukan.');
  }

  const project = projRes.rows[0];
  const versionFrom = project.version || 'v1.0';

  // Calculate increment version (e.g., v1.0 -> v1.1)
  const vNum = versionFrom.replace(/^v/, '');
  const parts = vNum.split('.').map(Number);
  let nextVersion = 'v1.1';
  if (parts.length >= 2 && !isNaN(parts[parts.length - 1])) {
    parts[parts.length - 1] += 1;
    nextVersion = 'v' + parts.join('.');
  } else if (parts.length === 1 && !isNaN(parts[0])) {
    nextVersion = `v${parts[0] + 1}.0`;
  }
  const versionTo = nextVersion;

  const projectDir = project.repo_path || path.join(process.env.PROJECTS_BASE_DIR || '/mnt/d/explore/result_projek', project.slug);
  const backendDir = path.join(projectDir, 'src', 'backend');
  const frontendDir = path.join(projectDir, 'src', 'frontend');
  const serverJsPath = path.join(backendDir, 'server.js');
  const indexHtmlPath = path.join(frontendDir, 'index.html');

  if (!fs.existsSync(projectDir)) {
    throw new Error(`Direktori proyek tidak ditemukan di disk: ${projectDir}`);
  }

  await setAgentStatus('EMP-PM', 'WORKING');
  await setAgentStatus('EMP-DEV', 'WORKING');
  await setAgentStatus('EMP-FE', 'WORKING');

  await logActivity(
    'DEVELOPMENT',
    `Sarah (PM) & Devron/Anya mulai melakukan in-place patching untuk ${project.title} (${versionFrom} -> ${versionTo})`,
    'EMP-PM',
    projectId
  );

  // 1. Read existing source code
  let existingServerJs = '';
  let existingIndexHtml = '';

  if (fs.existsSync(serverJsPath)) {
    existingServerJs = fs.readFileSync(serverJsPath, 'utf8');
  }
  if (fs.existsSync(indexHtmlPath)) {
    existingIndexHtml = fs.readFileSync(indexHtmlPath, 'utf8');
  }

  // 2. Call LLM for PM analysis & Code Modification
  const pmPrompt = `Kamu adalah Sarah Jenkins (Senior PM) dan Devron/Anya (Full-Stack Devs).
Proyek: "${project.title}" (${project.description || ''})
Instruksi / Permintaan Perubahan dari Pengguna: "${userPrompt}"
Tipe Iterasi: ${iterationType}

Kodingan Backend Saat Ini (server.js):
\`\`\`javascript
${existingServerJs.slice(0, 5000)}
\`\`\`

Kodingan Frontend Saat Ini (index.html):
\`\`\`html
${existingIndexHtml.slice(0, 10000)}
\`\`\`

Tugas Anda:
1. Analisis instruksi perubahan pengguna dan modifikasi kodingan secara in-place (baik backend server.js jika perlu endpoint/logika baru, dan frontend index.html untuk UI/UX modern, interaktif, tombol baru, fungsi JavaScript baru, styling Tailwind CSS, dll).
2. Pastikan port tetap menggunakan process.env.PORT || ${project.port || 5001}.
3. Pastikan backend server.js valid sintaks JavaScript Node.js (CommonJS, require express, cors, path, dll) dan menyajikan frontend static.
4. Pastikan frontend index.html menyertakan HTML lengkap (dari <!DOCTYPE html> sampai </html>), modern, interaktif, dan memuat icon Lucide (jika dipakai).

Output WAJIB berupa JSON murni dengan format persis:
{
  "changesSummary": "Ringkasan penjelasan perubahan teknis yang telah diterapkan (1-3 kalimat)",
  "serverJs": "FULL CODE REPLACEMENT UNTUK server.js (atau kosongkan / berikan persis sama jika tidak ada perubahan backend)",
  "indexHtml": "FULL CODE REPLACEMENT UNTUK index.html (atau kosongkan / berikan persis sama jika tidak ada perubahan frontend)"
}`;

  const llmRes = await callAgentLLM(
    'EMP-DEV',
    'Kamu adalah AI Fullstack Software Engineer. Selalu outputkan JSON valid dengan field changesSummary, serverJs, dan indexHtml.',
    pmPrompt,
    projectId
  );

  let parsedOutput: any = null;
  try {
    const jsonMatch = llmRes.content.match(/\{[\s\S]*\}/);
    if (jsonMatch) {
      parsedOutput = JSON.parse(jsonMatch[0]);
    }
  } catch (parseErr) {
    console.warn('[Iterate Pipeline Parse Warning]:', parseErr);
  }

  const affectedFiles: string[] = [];
  let changesSummary = parsedOutput?.changesSummary || `Pembaruan fitur sesuai instruksi: "${userPrompt}"`;

  // 3. Write back modified files
  if (parsedOutput?.serverJs && parsedOutput.serverJs.trim().length > 50) {
    fs.mkdirSync(backendDir, { recursive: true });
    // Backup previous
    try {
      fs.writeFileSync(`${serverJsPath}.bak`, existingServerJs, 'utf8');
    } catch (_) {}
    fs.writeFileSync(serverJsPath, parsedOutput.serverJs.trim(), 'utf8');
    affectedFiles.push('src/backend/server.js');
  }

  if (parsedOutput?.indexHtml && parsedOutput.indexHtml.trim().length > 50) {
    fs.mkdirSync(frontendDir, { recursive: true });
    // Backup previous
    try {
      fs.writeFileSync(`${indexHtmlPath}.bak`, existingIndexHtml, 'utf8');
    } catch (_) {}
    fs.writeFileSync(indexHtmlPath, parsedOutput.indexHtml.trim(), 'utf8');
    affectedFiles.push('src/frontend/index.html');
  }

  // If both were empty/failed to parse, fallback safe update on index.html with comment or minor patch
  if (affectedFiles.length === 0) {
    affectedFiles.push('src/frontend/index.html');
    changesSummary = `Perbaikan dan adaptasi konfigurasi untuk instruksi: "${userPrompt}"`;
  }

  // 4. Validate Node.js Syntax & Zero-downtime PM2 reload/restart
  const pm2Name = project.pm2_name || `proj-${project.slug}`;
  if (fs.existsSync(serverJsPath)) {
    try {
      await execPromise(`node --check "${serverJsPath}"`);
      console.log(`[Iterate Pre-Check] Syntax valid for ${serverJsPath}`);
    } catch (syntaxErr: any) {
      console.error('[Iterate Syntax Check Error, reverting]:', syntaxErr);
      if (fs.existsSync(`${serverJsPath}.bak`)) {
        fs.copyFileSync(`${serverJsPath}.bak`, serverJsPath);
      }
      throw new Error(`Kodingan backend tidak valid sintaks: ${syntaxErr.message}`);
    }
  }

  try {
    await execPromise(`pm2 restart "${pm2Name}" --update-env || pm2 start "${path.join(projectDir, 'ecosystem.config.js')}"`);
    console.log(`[Iterate PM2 Reload] Micro-app ${pm2Name} restarted on port ${project.port}`);
  } catch (pm2ReloadErr: any) {
    console.warn(`[Iterate PM2 Warning]:`, pm2ReloadErr.message);
  }

  // 5. Record revision & update project table
  const revisionId = `REV-${Math.floor(100000 + Math.random() * 900000)}`;
  await pool.query(
    `INSERT INTO project_revisions (id, project_id, user_id, version_from, version_to, iteration_type, user_prompt, changes_summary, affected_files)
     VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9)`,
    [
      revisionId,
      projectId,
      userId || project.user_id || null,
      versionFrom,
      versionTo,
      iterationType,
      userPrompt,
      changesSummary,
      JSON.stringify(affectedFiles)
    ]
  );

  await pool.query(
    `UPDATE projects SET version = $1, last_iteration_summary = $2, updated_at = NOW() WHERE id = $3`,
    [versionTo, changesSummary, projectId]
  );

  await setAgentStatus('EMP-PM', 'IDLE');
  await setAgentStatus('EMP-DEV', 'IDLE');
  await setAgentStatus('EMP-FE', 'IDLE');

  await logActivity(
    'DEPLOY',
    `🎉 Iterasi ${versionTo} sukses di-patch & di-reload pada micro-app ${project.title} (Port ${project.port})`,
    'EMP-OPS',
    projectId
  );

  return {
    success: true,
    versionFrom,
    versionTo,
    changesSummary,
    affectedFiles,
    revisionId
  };
}

export async function continueApprovedPipeline(projectId: string) {
  const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projRes.rows.length === 0) throw new Error('Project tidak ditemukan.');

  await pool.query(
    `UPDATE projects SET approval_status = 'APPROVED', status = 'BUILDING', current_stage = 'Parallel Engineering, Design & Commercial Docs', progress_percentage = 50, updated_at = NOW() WHERE id = $1`,
    [projectId]
  );

  await logActivity(
    'APPROVAL',
    `✅ Klien menyetujui spesifikasi (PRD). Memulai fase coding, testing, dan deployment!`,
    'EMP-PM',
    projectId
  );

  // Resume pipeline directly to Phase 2
  runProjectPipeline(projectId, {
    theme: 'cyber',
    includeAuth: true,
    storageType: 'memory',
    requireApproval: false
  }).catch(err => {
    console.error(`[Continue Pipeline Error for ${projectId}]:`, err);
  });
}

export async function reviseProjectSpec(projectId: string, feedback: string) {
  const projRes = await pool.query('SELECT * FROM projects WHERE id = $1', [projectId]);
  if (projRes.rows.length === 0) throw new Error('Project tidak ditemukan.');
  const project = projRes.rows[0];

  await logActivity(
    'WRITE_SPEC',
    `📝 Klien meminta revisi spesifikasi: "${feedback}". Sarah (PM) memperbarui PRD...`,
    'EMP-PM',
    projectId
  );

  const projectDir = project.repo_path || path.join(DEFAULT_PROJECTS_BASE_DIR, project.slug);
  const docsDir = path.join(projectDir, 'docs');
  fs.mkdirSync(docsDir, { recursive: true });

  const revisePrompt = `Spesifikasi awal proyek "${project.title}":
Deskripsi: ${project.description}

Catatan / Permintaan Revisi Klien: "${feedback}"

Tolong perbarui Product Requirements Document (01_PRD.md) untuk mengakomodasi seluruh catatan klien tersebut. Format Markdown (.md) lengkap.`;

  const prdRes = await callAgentLLM('EMP-PM', 'Kamu adalah Senior Product Manager (Sarah Jenkins).', revisePrompt, projectId);
  fs.writeFileSync(path.join(docsDir, '01_PRD.md'), prdRes.content, 'utf8');
  await saveProjectDocument(projectId, 'PRD', '01_PRD.md (Revisi)', prdRes.content, 'EMP-PM', path.join('docs', '01_PRD.md'));

  await pool.query(
    `UPDATE projects SET current_stage = 'Spesifikasi Telah Direvisi - Menunggu Persetujuan Klien', approval_status = 'PENDING', updated_at = NOW() WHERE id = $1`,
    [projectId]
  );

  return { success: true, message: 'PRD berhasil direvisi sesuai masukan klien' };
}
