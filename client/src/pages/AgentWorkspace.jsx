import { useState, useEffect, useRef } from 'react';
import { useAuth } from '../context/AuthContext';
import { apiRequest } from '../services/api';
import {
    User,
    MessageCircle,
    Clock,
    Play,
    CheckCircle2,
    XCircle,
    Send,
    LogOut,
    Headset
} from 'lucide-react';

const AgentWorkspace = () => {
    const { user, logout } = useAuth();
    const [waitingChats, setWaitingChats] = useState([]);
    const [myChats, setMyChats] = useState([]);
    const [selectedChat, setSelectedChat] = useState(null);
    const [agentInput, setAgentInput] = useState('');
    const chatEndRef = useRef(null);

    // 1. Polling Unificado
    useEffect(() => {
        if (!user) return;
        const fetchAll = async () => {
            try {
                const res = await apiRequest('/chats/my-queues');
                if (res && res.ok) {
                    const data = await res.json();
                    setWaitingChats(data.waiting);
                    setMyChats(data.active);

                    if (selectedChat) {
                        const all = [...data.active, ...data.waiting];
                        const updated = all.find(c => c.id === selectedChat.id);
                        if (updated && updated.messages.length !== selectedChat.messages.length) {
                            setSelectedChat(updated);
                        }
                    }
                }
            } catch (e) { console.error(e); }
        };
        fetchAll();
        const interval = setInterval(fetchAll, 3000);
        return () => clearInterval(interval);
    }, [user, selectedChat]);

    useEffect(() => { chatEndRef.current?.scrollIntoView({ behavior: "smooth" }); }, [selectedChat?.messages]);

    const handlePickup = async (chat) => {
        try {
            const res = await apiRequest('/chats/pickup', {
                method: 'POST',
                body: JSON.stringify({ chatId: chat.id })
            });
            if (res.ok) {
                const updatedChat = await res.json();
                setSelectedChat(updatedChat);
            } else {
                alert("Não foi possível puxar este atendimento.");
            }
        } catch (e) { console.error(e); }
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (!agentInput.trim() || !selectedChat) return;
        if (selectedChat.status === 'waiting') return alert("Você precisa puxar o atendimento antes de responder.");

        const text = agentInput;
        setAgentInput('');
        await apiRequest(`/chats/${selectedChat.id}/messages`, {
            method: 'POST',
            body: JSON.stringify({ sender: 'agent', agentName: user.name, text })
        });
    };

    const handleClose = async () => {
        if (!confirm("Encerrar atendimento?")) return;
        await apiRequest(`/chats/${selectedChat.id}/close`, { method: 'PUT' });
        setSelectedChat(null);
    };

    return (
        <main className="content-i">

            <div style={{ display: 'flex', height: '100vh', background: '#f1f5f9' }}>

                {/* SIDEBAR DO AGENTE */}
                <aside style={{ width: '350px', background: 'white', borderRight: '1px solid #e2e8f0', display: 'flex', flexDirection: 'column' }}>

                    {/* Header do Agente */}
                    <div style={{ padding: '20px', background: '#0f172a', color: 'white', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--primary)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold' }}>
                                {user.name.charAt(0)}
                            </div>
                            <div>
                                <div style={{ fontWeight: '600', fontSize: '14px' }}>{user.name}</div>
                                <div style={{ fontSize: '11px', color: '#4ade80', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                    <div style={{ width: '6px', height: '6px', borderRadius: '50%', background: '#4ade80' }}></div> Online
                                </div>
                            </div>
                        </div>
                        <button onClick={logout} style={{ background: 'rgba(255,255,255,0.1)', border: 'none', borderRadius: '6px', padding: '6px', color: '#ef4444', cursor: 'pointer' }}>
                            <LogOut size={16} />
                        </button>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', background: '#f8fafc' }}>

                        {/* SEÇÃO 1: EM ATENDIMENTO */}
                        <div style={{ padding: '15px 20px 5px', fontSize: '11px', fontWeight: '700', color: '#166534', display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <MessageCircle size={12} /> MEUS ATENDIMENTOS ({myChats.length})
                        </div>

                        <div style={{ padding: '0 10px 10px' }}>
                            {myChats.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px', fontStyle: 'italic' }}>
                                    Você está livre. Puxe alguém da fila.
                                </div>
                            ) : (
                                myChats.map(chat => (
                                    <div key={chat.id} onClick={() => setSelectedChat(chat)}
                                        style={{
                                            padding: '15px', cursor: 'pointer', marginBottom: '8px', borderRadius: '8px',
                                            background: selectedChat?.id === chat.id ? 'white' : 'white',
                                            border: selectedChat?.id === chat.id ? '1px solid var(--primary)' : '1px solid #e2e8f0',
                                            boxShadow: '0 1px 2px rgba(0,0,0,0.05)', position: 'relative', overflow: 'hidden'
                                        }}>
                                        <div style={{ position: 'absolute', left: 0, top: 0, bottom: 0, width: '4px', background: 'var(--primary)' }}></div>
                                        <div style={{ marginLeft: '10px' }}>
                                            <div style={{ fontWeight: '600', fontSize: '13px', color: '#1e293b' }}>{chat.variables?.nome_cliente || 'Cliente Identificado'}</div>
                                            <div style={{ fontSize: '11px', color: '#64748b', marginTop: '2px' }}>Fila: {chat.queue}</div>
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>

                        {/* SEÇÃO 2: FILA DE ESPERA */}
                        <div style={{ padding: '15px 20px 5px', fontSize: '11px', fontWeight: '700', color: '#c2410c', display: 'flex', alignItems: 'center', gap: '6px', borderTop: '1px solid #e2e8f0', marginTop: '10px' }}>
                            <Clock size={12} /> FILA DE ESPERA ({waitingChats.length})
                        </div>

                        <div style={{ padding: '0 10px 20px' }}>
                            {waitingChats.length === 0 ? (
                                <div style={{ padding: '20px', textAlign: 'center', color: '#94a3b8', fontSize: '12px' }}>
                                    A fila está vazia. Ótimo trabalho!
                                </div>
                            ) : (
                                waitingChats.map(chat => (
                                    <div key={chat.id} onClick={() => setSelectedChat(chat)}
                                        style={{
                                            padding: '15px', cursor: 'pointer', marginBottom: '8px', borderRadius: '8px',
                                            background: '#fff7ed', border: '1px solid #fed7aa',
                                            position: 'relative', opacity: selectedChat?.id === chat.id ? 1 : 0.8
                                        }}>
                                        <div style={{ fontWeight: '600', fontSize: '13px', color: '#9a3412' }}>{chat.variables?.nome_cliente || 'Anônimo'}</div>
                                        <div style={{ fontSize: '11px', color: '#c2410c', marginTop: '2px' }}>Aguardando em: {chat.queue}</div>
                                        <div style={{ position: 'absolute', right: '10px', top: '50%', transform: 'translateY(-50%)' }}>
                                            <Play size={16} color="#f97316" />
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>
                </aside>

                {/* ÁREA DE CHAT */}
                <main style={{ flex: 1, display: 'flex', flexDirection: 'column', background: '#f8fafc', position: 'relative' }}>
                    {selectedChat ? (
                        <>
                            {/* Header Chat */}
                            <header style={{ padding: '15px 25px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', height: '70px' }}>
                                <div style={{ display: 'flex', alignItems: 'center', gap: '15px' }}>
                                    <div style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#e0e7ff', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                        <User size={20} color="var(--primary)" />
                                    </div>
                                    <div>
                                        <h3 style={{ margin: 0, fontSize: '16px', fontWeight: '700', color: '#1e293b' }}>{selectedChat.variables?.nome_cliente || 'Desconhecido'}</h3>
                                        <span style={{ fontSize: '12px', color: '#64748b' }}>CPF: {selectedChat.variables?.cpf || '-'}</span>
                                    </div>
                                </div>

                                {selectedChat.status === 'waiting' ? (
                                    <button className="btn-primary" onClick={() => handlePickup(selectedChat)} style={{ background: '#f97316', display: 'flex', gap: '8px' }}>
                                        <Play size={16} fill="white" /> PUXAR ATENDIMENTO
                                    </button>
                                ) : (
                                    <button className="btn-danger" onClick={handleClose} style={{ display: 'flex', gap: '8px' }}>
                                        <XCircle size={16} /> Encerrar Sessão
                                    </button>
                                )}
                            </header>

                            {/* CRM Rápido (Dados do Cliente) */}
                            {selectedChat.status === 'open' && (
                                <div style={{ padding: '10px 25px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '20px', overflowX: 'auto' }}>
                                    {Object.entries(selectedChat.variables || {}).map(([key, val]) => (
                                        <div key={key} style={{ display: 'flex', flexDirection: 'column' }}>
                                            <span style={{ fontSize: '10px', color: '#94a3b8', textTransform: 'uppercase', fontWeight: 'bold' }}>{key.replace('_', ' ')}</span>
                                            <span style={{ fontSize: '12px', fontWeight: '600', color: '#334155' }}>{String(val)}</span>
                                        </div>
                                    ))}
                                </div>
                            )}

                            {/* Lista de Mensagens */}
                            <div style={{ flex: 1, padding: '25px', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: '15px' }}>
                                {selectedChat.messages.map((m, i) => (
                                    <div key={i} style={{
                                        alignSelf: m.sender === 'agent' ? 'flex-end' : (m.sender === 'system' ? 'center' : 'flex-start'),
                                        maxWidth: m.sender === 'system' ? '100%' : '70%'
                                    }}>
                                        {m.sender === 'system' ? (
                                            <div style={{ fontSize: '11px', color: '#94a3b8', background: '#f1f5f9', padding: '4px 12px', borderRadius: '12px' }}>
                                                {m.text}
                                            </div>
                                        ) : (
                                            <div style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'agent' ? 'flex-end' : 'flex-start' }}>
                                                <div style={{
                                                    padding: '12px 16px',
                                                    borderRadius: '12px',
                                                    background: m.sender === 'agent' ? 'var(--primary)' : 'white',
                                                    color: m.sender === 'agent' ? 'white' : '#1e293b',
                                                    border: m.sender === 'agent' ? 'none' : '1px solid #e2e8f0',
                                                    borderBottomRightRadius: m.sender === 'agent' ? '2px' : '12px',
                                                    borderBottomLeftRadius: m.sender !== 'agent' ? '2px' : '12px',
                                                    boxShadow: '0 1px 2px rgba(0,0,0,0.05)'
                                                }}>
                                                    {m.text}
                                                </div>
                                                <span style={{ fontSize: '10px', color: '#94a3b8', marginTop: '4px' }}>
                                                    {m.sender === 'agent' ? 'Você' : (m.sender === 'bot' ? 'Bot' : 'Cliente')} • {new Date(m.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                ))}
                                <div ref={chatEndRef} />
                            </div>

                            {/* Input */}
                            <form onSubmit={handleSend} style={{ padding: '20px', background: 'white', borderTop: '1px solid #e2e8f0', display: 'flex', gap: '10px' }}>
                                <input
                                    value={agentInput}
                                    onChange={e => setAgentInput(e.target.value)}
                                    placeholder={selectedChat.status === 'waiting' ? "Puxe o atendimento para responder..." : "Digite sua mensagem..."}
                                    disabled={selectedChat.status === 'waiting'}
                                    style={{ flex: 1, padding: '12px 16px', borderRadius: '8px', border: '1px solid #e2e8f0', outline: 'none', background: selectedChat.status === 'waiting' ? '#f1f5f9' : 'white' }}
                                />
                                <button type="submit" className="btn-primary" disabled={selectedChat.status === 'waiting'} style={{ width: '50px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    <Send size={20} />
                                </button>
                            </form>
                        </>
                    ) : (
                        <div style={{ display: 'flex', flexDirection: 'column', justifyContent: 'center', alignItems: 'center', height: '100%', color: '#cbd5e1' }}>
                            <Headset size={64} style={{ marginBottom: '15px' }} />
                            <h2 style={{ color: '#64748b' }}>Área de Atendimento</h2>
                            <p style={{ fontSize: '14px' }}>Selecione um cliente ao lado para começar.</p>
                        </div>
                    )}
                </main>
            </div>
        </main>
    );
};

export default AgentWorkspace;