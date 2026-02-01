import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import { useNavigate } from 'react-router-dom';
import {
    Users, MessageSquare, Bot, Clock, Headset, Search, ListFilter, Activity,
    Eye, History, ArrowRightLeft, XCircle, X, User
} from 'lucide-react';

const MonitoringDashboard = () => {
    const navigate = useNavigate();
    const [data, setData] = useState({ chats: [], agents: [] });
    const [loading, setLoading] = useState(true);

    // Estados dos Modais
    const [viewChat, setViewChatState] = useState(null);
    const viewChatRef = useRef(null); // Ref para evitar bug de fechamento

    const [transferChat, setTransferChat] = useState(null);
    const [historyChat, setHistoryChat] = useState(null);
    const [clientHistory, setClientHistory] = useState([]);

    // Transferência
    const [targetQueue, setTargetQueue] = useState('');
    const [targetAgent, setTargetAgent] = useState('');

    // Filtros
    const [filterQueue, setFilterQueue] = useState('ALL');
    const [filterAgent, setFilterAgent] = useState('ALL');
    const [searchClient, setSearchClient] = useState('');

    const QUEUES = ["SUPORTE", "SAC", "COBRANÇA", "ALTERAÇÃO DE PLANO", "ATIVAÇÃO DE PLANO"];
    const chatEndRef = useRef(null);

    // Wrapper para atualizar State e Ref juntos
    const setViewChat = (chat) => {
        viewChatRef.current = chat;
        setViewChatState(chat);
    };

    useEffect(() => {
        const fetchData = async () => {
            try {
                const res = await apiRequest('/monitoring/overview');
                if (res && res.ok) {
                    const json = await res.json();
                    setData(json);

                    // Atualiza chat espiado em tempo real se estiver aberto
                    if (viewChatRef.current) {
                        const updated = json.chats.find(c => c.id === viewChatRef.current.id);
                        if (updated) setViewChatState(updated);
                    }
                }
            } catch (error) { console.error(error); }
            finally { setLoading(false); }
        };
        fetchData();
        const interval = setInterval(fetchData, 3000);
        return () => clearInterval(interval);
    }, []);

    useEffect(() => {
        if (viewChat) chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [viewChat]);

    // Ações
    const loadHistory = async (cpf) => {
        if (!cpf || cpf === 'anonimo') return alert("Sem CPF.");
        const res = await apiRequest(`/chats/history/${cpf}`);
        if (res.ok) { setClientHistory(await res.json()); setHistoryChat(cpf); }
    };

    const handleForceClose = async (id) => {
        if (!confirm("Forçar encerramento?")) return;
        await apiRequest(`/chats/${id}/close`, { method: 'PUT' });
    };

    const handleTransfer = async () => {
        if (!transferChat) return;
        await apiRequest('/chats/transfer', {
            method: 'POST',
            body: JSON.stringify({
                chatId: transferChat.id,
                queue: targetQueue || transferChat.queue,
                agentId: targetAgent || null,
                agentName: targetAgent ? data.agents.find(a => a.id === targetAgent)?.name : null
            })
        });
        alert("Transferido!"); setTransferChat(null); setTargetQueue(''); setTargetAgent('');
    };

    // Filtros
    const filteredChats = data.chats.filter(c => {
        const qMatch = filterQueue === 'ALL' || c.queue === filterQueue;
        const aMatch = filterAgent === 'ALL' || c.agentName === filterAgent;
        const sMatch = searchClient === '' || (c.variables?.nome_cliente || '').toLowerCase().includes(searchClient.toLowerCase());
        return qMatch && aMatch && sMatch;
    });

    const kpis = {
        total: data.chats.length,
        inBot: data.chats.filter(c => c.status === 'bot').length,
        inQueue: data.chats.filter(c => c.status === 'waiting').length,
        inService: data.chats.filter(c => c.status === 'open' && c.agentId).length
    };

    return (
        <main className="content">

            <div className="page" style={{ maxWidth: '100%', padding: '0' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                        <Activity size={24} color="var(--primary)" />
                        <div><h1 style={{ fontSize: '18px', margin: 0 }}>Monitoramento Operacional</h1></div>
                    </div>
                    <button onClick={() => navigate('/system-logs')} className="btn-secondary" style={{ fontSize: '12px', display: 'flex', gap: '5px', alignItems: 'center' }}><ListFilter size={14} /> Logs</button>
                </div>

                <div className="kpi-row">
                    <div className="kpi-card"><div className="kpi-value">{kpis.total}</div><div className="kpi-label">Ativos</div></div>
                    <div className="kpi-card"><div className="kpi-value" style={{ color: '#0284c7' }}>{kpis.inBot}</div><div className="kpi-label">No Bot</div></div>
                    <div className="kpi-card"><div className="kpi-value" style={{ color: '#ea580c' }}>{kpis.inQueue}</div><div className="kpi-label">Fila</div></div>
                    <div className="kpi-card"><div className="kpi-value" style={{ color: '#16a34a' }}>{kpis.inService}</div><div className="kpi-label">Humanos</div></div>
                </div>

                <div className="dashboard-grid">
                    <div className="dashboard-card">
                        <div className="dashboard-header"><h3>Equipes</h3></div>
                        <div style={{ padding: '15px', borderBottom: '1px solid var(--border)' }}>
                            <div style={{ fontSize: '10px', fontWeight: 'bold', color: '#94a3b8', marginBottom: '10px' }}>FILAS</div>
                            {QUEUES.map(q => {
                                const count = data.chats.filter(c => c.queue === q).length;
                                const wait = data.chats.filter(c => c.queue === q && c.status === 'waiting').length;
                                return (
                                    <div key={q} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', marginBottom: '8px' }}>
                                        <span>{q}</span>
                                        <div><span style={{ fontWeight: 'bold' }}>{count}</span> {wait > 0 && <span style={{ color: '#ea580c', fontSize: '10px' }}>({wait} fila)</span>}</div>
                                    </div>
                                )
                            })}
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <div style={{ padding: '15px 15px 5px', fontSize: '10px', fontWeight: 'bold', color: '#94a3b8' }}>AGENTES ({data.agents.length})</div>
                            {data.agents.map(a => (
                                <div key={a.id} className="list-item">
                                    <div><div style={{ fontSize: '13px', fontWeight: '500' }}>{a.name}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{a.role}</div></div>
                                    <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                        <div style={{ width: '8px', height: '8px', borderRadius: '50%', background: a.isOnline ? '#22c55e' : '#cbd5e1' }}></div>
                                        <span style={{ fontSize: '10px', color: a.isOnline ? '#166534' : '#94a3b8', fontWeight: 'bold' }}>{a.isOnline ? 'ON' : 'OFF'}</span>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>

                    <div className="dashboard-card">
                        <div className="dashboard-header"><h3>Painel de Atendimentos</h3></div>
                        <div className="filter-bar">
                            <div style={{ position: 'relative', display: 'flex', alignItems: 'center' }}>
                                <Search size={14} style={{ position: 'absolute', left: '10px', color: '#94a3b8' }} />
                                <input className="filter-input" placeholder="Buscar..." value={searchClient} onChange={e => setSearchClient(e.target.value)} style={{ paddingLeft: '30px' }} />
                            </div>
                            <select className="filter-select" value={filterQueue} onChange={e => setFilterQueue(e.target.value)}>
                                <option value="ALL">Todas Filas</option>
                                {QUEUES.map(q => <option key={q} value={q}>{q}</option>)}
                            </select>
                        </div>
                        <div style={{ flex: 1, overflowY: 'auto' }}>
                            <table className="monitor-table">
                                <thead><tr><th>Cliente</th><th>Status</th><th>Agente</th><th>Ações</th></tr></thead>
                                <tbody>
                                    {filteredChats.length === 0 ? <tr><td colSpan="4" style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Nada encontrado.</td></tr> :
                                        filteredChats.map(c => (
                                            <tr key={c.id}>
                                                <td><div style={{ fontWeight: '600' }}>{c.variables?.nome_cliente || 'Anônimo'}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{c.customerCpf}</div></td>
                                                <td>{c.status === 'bot' ? <span className="badge badge-bot">BOT</span> : c.status === 'waiting' ? <span className="badge badge-queue">FILA</span> : <span className="badge badge-human">HUMANO</span>}</td>
                                                <td>{c.status === 'bot' ? '-' : <div><div style={{ fontWeight: '600', fontSize: '11px' }}>{c.queue}</div><div style={{ fontSize: '11px', color: '#64748b' }}>{c.agentName || '...'}</div></div>}</td>
                                                <td>
                                                    <div style={{ display: 'flex', gap: '2px' }}>
                                                        <button className="action-btn" onClick={() => setViewChat(c)}><Eye size={16} /></button>
                                                        <button className="action-btn" onClick={() => loadHistory(c.customerCpf)}><History size={16} /></button>
                                                        <button className="action-btn" onClick={() => setTransferChat(c)}><ArrowRightLeft size={16} /></button>
                                                        <button className="action-btn danger" onClick={() => handleForceClose(c.id)}><XCircle size={16} /></button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                </tbody>
                            </table>
                        </div>
                    </div>
                </div>

                {/* MODAL VIEW */}
                {viewChat && (
                    <div className="modal-overlay" onClick={() => setViewChat(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ height: '600px', display: 'flex', flexDirection: 'column' }}>
                            <div className="modal-header"><h2><Eye size={18} /> Monitorando: {viewChat.variables?.nome_cliente}</h2><button className="btn-close" onClick={() => setViewChat(null)}><X size={20} /></button></div>
                            <div className="modal-body" style={{ background: '#f8fafc', flex: 1, overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '10px' }}>
                                {viewChat.messages.map((m, i) => (
                                    <div key={i} className={`msg-bubble ${m.sender === 'agent' ? 'user' : 'bot'}`}
                                        style={{ background: m.sender === 'bot' || m.sender === 'system' ? 'white' : 'var(--primary)', color: m.sender === 'bot' || m.sender === 'system' ? '#1e293b' : 'white', alignSelf: m.sender === 'bot' || m.sender === 'system' ? 'flex-start' : 'flex-end' }}>
                                        <small style={{ display: 'block', opacity: 0.7, fontSize: '9px' }}>{m.sender.toUpperCase()}</small>{m.text}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL TRANSFER */}
                {transferChat && (
                    <div className="modal-overlay" onClick={() => setTransferChat(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()}>
                            <div className="modal-header"><h2><ArrowRightLeft size={18} /> Transferir</h2><button className="btn-close" onClick={() => setTransferChat(null)}><X size={20} /></button></div>
                            <div className="modal-body">
                                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Destino:</label>
                                <select className="filter-select" style={{ width: '100%', marginBottom: '15px' }} onChange={e => { setTargetQueue(e.target.value); setTargetAgent('') }}>
                                    <option value="">Selecione Fila...</option>{QUEUES.map(q => <option key={q} value={q}>{q}</option>)}
                                </select>
                                <label style={{ fontSize: '12px', fontWeight: 'bold', display: 'block', marginBottom: '5px' }}>Agente (Opcional):</label>
                                <select className="filter-select" style={{ width: '100%' }} onChange={e => { setTargetAgent(e.target.value); setTargetQueue('') }}>
                                    <option value="">Nenhum</option>{data.agents.map(a => <option key={a.id} value={a.id}>{a.name} ({a.isOnline ? 'ON' : 'OFF'})</option>)}
                                </select>
                            </div>
                            <div className="modal-footer">
                                <button className="btn-secondary" onClick={() => setTransferChat(null)}>Cancelar</button>
                                <button className="btn-primary" onClick={handleTransfer}>Confirmar</button>
                            </div>
                        </div>
                    </div>
                )}

                {/* MODAL HISTORY */}
                {historyChat && (
                    <div className="modal-overlay" onClick={() => setHistoryChat(null)}>
                        <div className="modal-content" onClick={e => e.stopPropagation()} style={{ height: '600px' }}>
                            <div className="modal-header"><h2><History size={18} /> Histórico</h2><button className="btn-close" onClick={() => setHistoryChat(null)}><X size={20} /></button></div>
                            <div className="modal-body">
                                {clientHistory.length === 0 ? <p style={{ textAlign: 'center', color: '#94a3b8' }}>Vazio.</p> : clientHistory.map(h => (
                                    <div key={h.id} className="history-item">
                                        <div style={{ fontWeight: 'bold', fontSize: '13px' }}>{new Date(parseInt(h.id.split('_')[1])).toLocaleString()}</div>
                                        <div style={{ fontSize: '11px', color: '#64748b' }}>Agente: {h.agentName || 'Bot'}</div>
                                        <div style={{ background: '#f8fafc', padding: '10px', marginTop: '5px', fontSize: '11px', border: '1px solid #e2e8f0' }}>{h.messages.length} msgs.</div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                )}
            </div>
        </main>
    );
};

export default MonitoringDashboard;