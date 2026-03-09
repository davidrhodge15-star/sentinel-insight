import React, { useState, useEffect, useRef } from 'react';

function App() {
  const [messages, setMessages] = useState([]);
  const [input, setInput] = useState("");
  const [status, setStatus] = useState('ready');
  const chatEndRef = useRef(null);

  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages]);

  const askAI = async (query = input, isSummary = false) => {
    const finalQuery = isSummary ? "Summarize this document" : query;
    if (!finalQuery) return;
    setStatus('thinking');
    setMessages(prev => [...prev, { role: 'user', text: finalQuery }]);
    
    try {
      const res = await fetch(`http://localhost:8000/chat?question=${encodeURIComponent(finalQuery)}`);
      const data = await res.json();
      setStatus(data.answer.includes("Exhausted") ? 'quota' : 'ready');
      setMessages(prev => [...prev, { role: 'bot', text: data.answer }]);
    } catch (err) { setStatus('error'); }
    finally { setInput(""); }
  };

  const handleUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setStatus('thinking');
    const formData = new FormData();
    formData.append('file', file);
    const res = await fetch('http://localhost:8000/upload', { method: 'POST', body: formData });
    const data = await res.json();
    if (data.status === 'success') {
      setMessages(prev => [...prev, { role: 'bot', text: `SYSTEM: ${file.name} successfully mapped.` }]);
      setStatus('ready');
    }
  };

  const exportReport = () => {
    const content = messages.map(m => `${m.role.toUpperCase()}: ${m.text}`).join('\n\n');
    const blob = new Blob([content], { type: 'text/plain' });
    const link = document.createElement('a');
    link.href = URL.createObjectURL(blob);
    link.download = `Sentinel_Report_${Date.now()}.txt`;
    link.click();
  };

  return (
    <div style={styles.app}>
      <aside style={styles.sidebar}>
        <div style={styles.brand}>
          <div style={styles.logoBox}>S</div>
          <h1 style={styles.logoText}>SENTINEL</h1>
        </div>

        <div style={styles.nav}>
          <p style={styles.label}>OPERATIONS</p>
          <label style={styles.btn}>+ INGEST PDF<input type="file" onChange={handleUpload} style={{display:'none'}}/></label>
          <button onClick={() => askAI(null, true)} style={styles.btn}>⚡ QUICK SUMMARY</button>
          <button onClick={exportReport} style={styles.btn}>📥 EXPORT LOG</button>
        </div>

        {/* BILLING & QUOTA SECTION */}
        <div style={styles.billingCard}>
          <p style={styles.label}>QUOTA & BILLING</p>
          <div style={styles.quotaRow}>
            <span>Status:</span>
            <span style={{color: colors[status]}}>{status === 'quota' ? 'LIMITED' : 'ACTIVE'}</span>
          </div>
          <button 
            onClick={() => window.open('https://aistudio.google.com/app/api-keys?project=gen-lang-client-0192446114', '_blank')}
            style={styles.upgradeBtn}
          >
            🚀 UPGRADE TO PAY-AS-YOU-GO
          </button>
        </div>
      </aside>

      <main style={styles.main}>
        <div style={styles.feed}>
          {messages.map((m, i) => (
            <div key={i} style={m.role === 'user' ? styles.uRow : styles.bRow}>
              <div style={m.role === 'user' ? styles.uBubble : styles.bBubble}>{m.text}</div>
            </div>
          ))}
          <div ref={chatEndRef} />
        </div>
        <div style={styles.inputArea}>
          <input value={input} onChange={(e) => setInput(e.target.value)} onKeyPress={(e) => e.key === 'Enter' && askAI()} style={styles.input} placeholder="Query intelligence core..." />
          <button onClick={() => askAI()} style={styles.execBtn}>EXECUTE</button>
        </div>
      </main>
    </div>
  );
}

const colors = { ready: '#00e5ff', thinking: '#f9ff00', quota: '#ff8c00', error: '#f05' };
const styles = {
  app: { display: 'flex', height: '100vh', backgroundColor: '#02040a', color: '#f0f6fc', fontFamily: 'sans-serif' },
  sidebar: { width: '260px', backgroundColor: '#0d1117', padding: '25px', display: 'flex', flexDirection: 'column', gap: '20px', borderRight: '1px solid #30363d' },
  brand: { display: 'flex', alignItems: 'center', gap: '10px' },
  logoBox: { width: '30px', height: '30px', background: '#00e5ff', color: '#000', borderRadius: '4px', display: 'flex', justifyContent: 'center', alignItems: 'center', fontWeight: 'bold' },
  logoText: { fontSize: '1.1rem', letterSpacing: '2px', margin: 0 },
  nav: { display: 'flex', flexDirection: 'column', gap: '10px' },
  label: { fontSize: '0.6rem', color: '#8b949e', letterSpacing: '1px' },
  btn: { padding: '10px', background: '#161b22', border: '1px solid #30363d', color: '#00e5ff', borderRadius: '6px', cursor: 'pointer', textAlign: 'center', fontSize: '0.75rem' },
  billingCard: { marginTop: 'auto', padding: '15px', background: 'rgba(0, 229, 255, 0.03)', border: '1px solid #1e293b', borderRadius: '8px' },
  quotaRow: { display: 'flex', justifyContent: 'space-between', fontSize: '0.7rem', marginBottom: '10px' },
  upgradeBtn: { width: '100%', padding: '8px', background: 'linear-gradient(90deg, #00e5ff, #0099ff)', color: '#000', border: 'none', borderRadius: '4px', fontSize: '0.65rem', fontWeight: 'bold', cursor: 'pointer' },
  main: { flexGrow: 1, display: 'flex', flexDirection: 'column', padding: '25px' },
  feed: { flexGrow: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' },
  uRow: { alignSelf: 'flex-end', maxWidth: '75%' },
  bRow: { alignSelf: 'flex-start', maxWidth: '85%' },
  uBubble: { padding: '12px', background: '#00e5ff', color: '#000', borderRadius: '15px 15px 2px 15px' },
  bBubble: { padding: '15px', background: '#161b22', border: '1px solid #30363d', borderRadius: '15px 15px 15px 2px' },
  inputArea: { marginTop: '20px', display: 'flex', gap: '10px', background: '#0d1117', padding: '10px', borderRadius: '10px', border: '1px solid #30363d' },
  input: { flexGrow: 1, background: 'transparent', border: 'none', color: '#fff', outline: 'none' },
  execBtn: { background: '#00e5ff', color: '#000', border: 'none', padding: '8px 20px', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer' }
};

export default App;