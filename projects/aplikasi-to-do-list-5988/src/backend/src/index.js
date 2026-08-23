const express = require('express');
const cors = require('cors');

const app = express();
const PORT = process.env.PORT || 5001;

app.use(cors());
app.use(express.json());

// In-Memory Data Store for aplikasi to do list
let items = [
  { id: 1, title: 'Contoh Data 1', status: 'ACTIVE', created_at: new Date().toISOString() },
  { id: 2, title: 'Contoh Data 2', status: 'COMPLETED', created_at: new Date().toISOString() }
];

app.get('/health', (req, res) => {
  res.json({ status: 'OK', project: 'aplikasi to do list', timestamp: new Date().toISOString() });
});

app.get('/api/items', (req, res) => {
  res.json({ success: true, count: items.length, data: items });
});

app.post('/api/items', (req, res) => {
  const { title, description } = req.body;
  const newItem = {
    id: items.length + 1,
    title: title || 'Item Baru',
    description: description || '',
    status: 'ACTIVE',
    created_at: new Date().toISOString()
  };
  items.push(newItem);
  res.status(201).json({ success: true, message: 'Item berhasil ditambahkan', data: newItem });
});

// Serve frontend UI directly from express for fast standalone hosting
app.get('/', (req, res) => {
  res.send(`
    <!DOCTYPE html>
    <html lang="id">
    <head>
      <meta charset="UTF-8">
      <meta name="viewport" content="width=device-width, initial-scale=1.0">
      <title>aplikasi to do list - Live Application</title>
      <script src="https://cdn.tailwindcss.com"></script>
      <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;800&display=swap" rel="stylesheet">
      <style>body { font-family: 'Inter', sans-serif; }</style>
    </head>
    <body class="bg-slate-950 text-slate-100 min-h-screen">
      <div class="max-w-4xl mx-auto p-6 md:p-10">
        <!-- Header -->
        <header class="border-b border-slate-800 pb-6 mb-8 flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div class="inline-flex items-center gap-2 px-3 py-1 rounded-full text-xs font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 mb-2">
              <span class="w-2 h-2 rounded-full bg-emerald-400 animate-pulse"></span>
              Live Autonomous Build
            </div>
            <h1 class="text-3xl font-extrabold text-white tracking-tight">aplikasi to do list</h1>
            <p class="text-slate-400 text-sm mt-1">aplikasi penggajian karyawan lengkap multi tenant</p>
          </div>
          <div class="text-right bg-slate-900 px-4 py-2 rounded-lg border border-slate-800">
            <span class="text-xs text-slate-500 uppercase tracking-wider block font-semibold">Port Listener</span>
            <span class="text-lg font-mono font-bold text-indigo-400">5001</span>
          </div>
        </header>

        <!-- Main Interactive Content -->
        <main class="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div class="md:col-span-1 bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <h2 class="text-lg font-bold text-white mb-4">Input Data Baru</h2>
            <form id="addForm" class="space-y-4">
              <div>
                <label class="block text-xs font-medium text-slate-400 mb-1">Judul / Entri</label>
                <input type="text" id="itemTitle" required placeholder="Ketik sesuatu..." class="w-full bg-slate-950 border border-slate-700 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-indigo-500">
              </div>
              <button type="submit" class="w-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium py-2 rounded-lg text-sm transition">
                + Tambah Data
              </button>
            </form>
          </div>

          <div class="md:col-span-2 bg-slate-900 border border-slate-800 p-5 rounded-xl">
            <div class="flex justify-between items-center mb-4">
              <h2 class="text-lg font-bold text-white">Live Data Feed</h2>
              <button id="refreshBtn" class="text-xs bg-slate-800 hover:bg-slate-700 text-slate-300 px-3 py-1.5 rounded-md transition">
                Refresh
              </button>
            </div>
            <div id="itemsList" class="space-y-3">
              <div class="text-sm text-slate-500">Memuat data...</div>
            </div>
          </div>
        </main>
      </div>

      <script>
        async function fetchItems() {
          const list = document.getElementById('itemsList');
          try {
            const res = await fetch('/api/items');
            const data = await res.json();
            if(data.data.length === 0) {
              list.innerHTML = '<div class="text-slate-500 text-sm">Belum ada data.</div>';
              return;
            }
            list.innerHTML = data.data.map(item => `
              <div class="p-3 bg-slate-950 border border-slate-800 rounded-lg flex justify-between items-center">
                <div>
                  <p class="text-sm font-semibold text-white">${item.title}</p>
                  <p class="text-xs text-slate-500">${new Date(item.created_at).toLocaleTimeString()}</p>
                </div>
                <span class="text-xs px-2.5 py-1 rounded bg-slate-800 text-indigo-400 font-mono font-medium">${item.status}</span>
              </div>
            `).join('');
          } catch (e) {
            list.innerHTML = '<div class="text-red-400 text-sm">Gagal memuat data.</div>';
          }
        }

        document.getElementById('addForm').addEventListener('submit', async (e) => {
          e.preventDefault();
          const title = document.getElementById('itemTitle').value;
          await fetch('/api/items', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ title })
          });
          document.getElementById('itemTitle').value = '';
          fetchItems();
        });

        document.getElementById('refreshBtn').addEventListener('click', fetchItems);
        fetchItems();
      </script>
    </body>
    </html>
  `);
});

app.listen(PORT, () => {
  console.log(`[Live App: aplikasi to do list] running at http://localhost:${PORT}`);
});
