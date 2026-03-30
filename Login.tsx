@import url('https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&family=Fira+Code:wght@400;500&display=swap');
@tailwind base;
@tailwind components;
@tailwind utilities;

@layer base {
  :root { --color-bg: #0a0d12; --color-surface: #0f1318; }
  * { box-sizing: border-box; }
  body { @apply bg-[#0a0d12] text-slate-200 font-sans antialiased; }
  ::-webkit-scrollbar { width: 4px; height: 4px; }
  ::-webkit-scrollbar-track { @apply bg-transparent; }
  ::-webkit-scrollbar-thumb { @apply bg-slate-700 rounded-full; }
}

@layer components {
  .glass { @apply bg-white/5 backdrop-blur-sm border border-white/10; }
  .card  { @apply bg-[#131820] border border-[#1c2534] rounded-lg; }
  .btn-primary { @apply bg-blue-600 hover:bg-blue-500 text-white px-4 py-2 rounded-md text-sm font-medium transition-colors; }
  .btn-ghost   { @apply text-slate-400 hover:text-slate-200 hover:bg-white/5 px-3 py-2 rounded-md text-sm transition-colors; }
  .input { @apply bg-[#0a0d12] border border-[#1c2534] rounded-md px-3 py-2 text-sm text-slate-200 placeholder-slate-500 focus:outline-none focus:border-blue-500 transition-colors w-full; }
}
