import { useState, useEffect, useRef } from 'react';
import { apiRequest } from '../services/api';
import {
    Play,
    RefreshCcw,
    Send,
    Bot,
    User,
    Terminal,
    MessageSquare
} from 'lucide-react';

const ChatSimulator = () => {
    const [flows, setFlows] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [schedules, setSchedules] = useState([]);

    const [selectedFlowId, setSelectedFlowId] = useState('');
    const [activeFlow, setActiveFlow] = useState(null);
    const [messages, setMessages] = useState([]);
    const [isTyping, setIsTyping] = useState(false);

    const [currentNodeId, setCurrentNodeId] = useState(null);
    const [sessionVars, setSessionVars] = useState({});
    const [userInput, setUserInput] = useState('');
    const [chatId, setChatId] = useState(null);
    const [currentCpf, setCurrentCpf] = useState(null);
    const [isClosed, setIsClosed] = useState(false);

    const chatEndRef = useRef(null);

    // 1. CARREGAMENTO DE DADOS
    useEffect(() => {
        const loadData = async () => {
            try {
                const [f, t, s] = await Promise.all([
                    apiRequest('/flows'),
                    apiRequest('/templates'),
                    apiRequest('/schedules')
                ]);
                if (f && t && s) {
                    setFlows(await f.json());
                    setTemplates(await t.json());
                    setSchedules(await s.json());
                }
            } catch (e) { console.error(e); }
        };
        loadData();
    }, []);

    // Scroll Automático
    useEffect(() => {
        chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
    }, [messages, isTyping]);

    // --- MOTOR DE EXECUÇÃO (LÓGICA MANTIDA, APENAS LIMPEZA) ---

    const parseText = (text, vars) => {
        if (!text) return "";
        return text.replace(/\{(\w+)\}/g, (match, varName) => vars[varName] !== undefined ? vars[varName] : match);
    };

    const addBotMessage = async (text, buttons = null, idChat) => {
        if (!idChat) return;
        setIsTyping(true);
        const res = await apiRequest(`/chats/${idChat}/messages`, {
            method: 'POST',
            body: JSON.stringify({ sender: 'bot', text, buttons })
        });
        const saved = await res.json();
        setMessages(prev => [...prev, saved]);
        setIsTyping(false);
    };

    const processNextNode = async (nodeId, flowData, currentVars, idChat) => {
        const node = flowData.nodes.find(n => n.id === nodeId);
        if (!node) return;

        // Lógicas de Nó (Resumidas para focar no design)
        if (node.type === 'delayNode') {
            setIsTyping(true);
            setTimeout(() => {
                const edge = flowData.edges.find(e => e.source === nodeId);
                if (edge) processNextNode(edge.target, flowData, currentVars, idChat);
            }, (parseInt(node.data.delay) || 1) * 1000);
            return;
        }

        if (node.type === 'scheduleNode') {
            const schedule = schedules.find(s => s.id === node.data.scheduleId);
            const now = new Date();
            const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];
            const currentDay = days[now.getDay()];
            const currentTime = now.getHours().toString().padStart(2, '0') + ":" + now.getMinutes().toString().padStart(2, '0');
            const rule = schedule?.rules[currentDay];
            const isInside = rule?.active && currentTime >= rule.start && currentTime <= rule.end;
            const handle = isInside ? 'inside' : 'outside';
            const edge = flowData.edges.find(e => e.source === nodeId && e.sourceHandle === handle);
            if (edge) processNextNode(edge.target, flowData, currentVars, idChat);
            return;
        }

        if (node.type === 'messageNode' || node.type === 'startNode') {
            if (node.data?.text && node.data.text !== "Início") {
                await addBotMessage(parseText(node.data.text, currentVars), null, idChat);
            }
            const edge = flowData.edges.find(e => e.source === nodeId);
            if (edge) setTimeout(() => processNextNode(edge.target, flowData, currentVars, idChat), 1000);
        }

        else if (node.type === 'inputNode') {
            await addBotMessage(parseText(node.data?.text, currentVars), null, idChat);
            setCurrentNodeId(node.id);
        }

        else if (node.type === 'templateNode') {
            const template = templates.find(t => t.id === node.data.templateId);
            if (template) {
                await addBotMessage(parseText(template.text, currentVars), template.buttons, idChat);
                setCurrentNodeId(node.id);
            }
        }

        else if (node.type === 'setValueNode') {
            const newVars = { ...currentVars, [node.data.variableName]: node.data.value };
            setSessionVars(newVars);
            await apiRequest(`/chats/${idChat}/vars`, { method: 'PUT', body: JSON.stringify(newVars) });
            const edge = flowData.edges.find(e => e.source === nodeId);
            if (edge) processNextNode(edge.target, flowData, newVars, idChat);
        }

        else if (node.type === 'httpRequestNode') {
            const url = parseText(node.data.url, currentVars);
            try {
                // API Request direta (sem passar pelo apiRequest do sistema para não enviar token de admin)
                const res = await fetch(url);
                const data = await res.json();
                let newVars = { ...currentVars };
                if (res.ok) {
                    node.data.mappings.forEach(m => { if (m.jsonPath && m.varName) newVars[m.varName] = String(data[m.jsonPath]); });
                    setSessionVars(newVars);
                    await apiRequest(`/chats/${idChat}/vars`, { method: 'PUT', body: JSON.stringify(newVars) });
                }
                const edge = flowData.edges.find(e => e.source === nodeId);
                if (edge) processNextNode(edge.target, flowData, newVars, idChat);
            } catch (e) { await addBotMessage("⚠️ Erro de conexão com API externa.", null, idChat); }
        }

        else if (node.type === 'scriptNode') {
            try {
                const execute = new Function('vars', `${node.data.script}; return vars;`);
                const newVars = execute({ ...currentVars });
                setSessionVars(newVars);
                await apiRequest(`/chats/${idChat}/vars`, { method: 'PUT', body: JSON.stringify(newVars) });
                const edge = flowData.edges.find(e => e.source === nodeId);
                if (edge) processNextNode(edge.target, flowData, newVars, idChat);
            } catch (e) { console.error(e); }
        }

        else if (node.type === 'gotoNode') processNextNode(node.data.targetAnchorId, flowData, currentVars, idChat);
        else if (node.type === 'anchorNode') {
            const edge = flowData.edges.find(e => e.source === nodeId);
            if (edge) processNextNode(edge.target, flowData, currentVars, idChat);
        }

        else if (node.type === 'conditionNode') {
            let matchedEdge = null;
            const evalCond = (v1, op, v2) => {
                const val1 = isNaN(v1) ? String(v1) : Number(v1);
                const val2 = isNaN(v2) ? String(v2) : Number(v2);
                if (op === '==') return val1 == val2;
                if (op === '!=') return val1 != val2;
                if (op === '>') return val1 > val2;
                if (op === '<') return val1 < val2;
                return false;
            };
            for (const cond of (node.data.conditions || [])) {
                if (evalCond(currentVars[cond.variable], cond.operator, cond.value)) {
                    matchedEdge = flowData.edges.find(e => e.source === nodeId && e.sourceHandle === cond.id);
                    if (matchedEdge) break;
                }
            }
            if (!matchedEdge) matchedEdge = flowData.edges.find(e => e.source === nodeId && e.sourceHandle === 'else');
            if (matchedEdge) setTimeout(() => processNextNode(matchedEdge.target, flowData, currentVars, idChat), 500);
        }

        else if (node.type === 'queueNode') {
            const queue = node.data.queueName;
            await addBotMessage(`Transferindo para: ${queue}...`, null, idChat);
            const res = await apiRequest(`/queue/assign/${queue}`);
            if (res.ok) {
                // Sucesso: Transfere para espera
                await apiRequest('/chats/transfer', {
                    method: 'POST',
                    body: JSON.stringify({ queue, customerData: currentVars, chatId: idChat })
                });
                setCurrentNodeId(null);
            } else {
                await addBotMessage("⚠️ Fila indisponível no momento.");
            }
        }

        else if (node.type === 'endNode' || node.type === 'finalNode') {
            await addBotMessage("Atendimento finalizado.", null, idChat);
        }
    };

    // --- START & INTERACTION ---

    const startSimulation = async () => {
        if (!selectedFlowId) return;

        const fRes = await apiRequest(`/flows/${selectedFlowId}`);
        const flow = await fRes.json();

        const publishedFlow = flow.published;
        if (!publishedFlow || !publishedFlow.nodes || publishedFlow.nodes.length === 0) {
            return alert("Este fluxo não foi publicado para testes.");
        }

        const simCpf = `sim_${Date.now()}`;
        setCurrentCpf(simCpf);

        const cRes = await apiRequest('/chats/init', {
            method: 'POST',
            body: JSON.stringify({ customerCpf: simCpf })
        });
        const chat = await cRes.json();

        setChatId(chat.id);
        setMessages([]);
        setSessionVars({});
        setActiveFlow(publishedFlow);
        setCurrentNodeId(null);
        setIsClosed(false);

        const startNode = publishedFlow.nodes.find(n => n.type === 'startNode');
        if (startNode) processNextNode(startNode.id, publishedFlow, {}, chat.id);
    };

    const handleSend = async (e) => {
        e.preventDefault();
        if (isClosed || !userInput.trim() || !chatId) return;
        const text = userInput;
        setUserInput('');

        const res = await apiRequest(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ sender: 'user', text }) });
        const saved = await res.json();
        setMessages(prev => [...prev, saved]);

        const node = activeFlow.nodes.find(n => n.id === currentNodeId);
        if (node?.type === 'inputNode') {
            const newVars = { ...sessionVars, [node.data.variableName]: text };
            setSessionVars(newVars);
            await apiRequest(`/chats/${chatId}/vars`, { method: 'PUT', body: JSON.stringify(newVars) });
            const edge = activeFlow.edges.find(e => e.source === currentNodeId);
            if (edge) {
                setCurrentNodeId(null);
                processNextNode(edge.target, activeFlow, newVars, chatId);
            }
        }
    };

    const handleButtonClick = async (btnId, label) => {
        if (isClosed) return;
        setMessages(prev => [...prev, { sender: 'user', text: label }]);

        // Salva a escolha do botão como mensagem do user
        await apiRequest(`/chats/${chatId}/messages`, { method: 'POST', body: JSON.stringify({ sender: 'user', text: label }) });

        const edge = activeFlow.edges.find(e => e.source === currentNodeId && e.sourceHandle === btnId);
        if (edge) {
            setCurrentNodeId(null);
            processNextNode(edge.target, activeFlow, sessionVars, chatId);
        }
    };

    useEffect(() => {
        let interval;
        if (chatId && !isClosed && currentCpf) {
            interval = setInterval(async () => {
                const res = await apiRequest('/chats/init', { method: 'POST', body: JSON.stringify({ customerCpf: currentCpf }) });
                if (res && res.ok) {
                    const chatData = await res.json();
                    if (chatData.status === 'closed') {
                        setIsClosed(true);
                        setMessages(chatData.messages);
                        clearInterval(interval);
                    } else if (chatData.messages.length > messages.length) {
                        setMessages(chatData.messages);
                    }
                }
            }, 3000);
        }
        return () => clearInterval(interval);
    }, [chatId, isClosed, messages.length, currentCpf]);

    return (
        <main className="content">

            <div className="page" style={{ padding: '0', maxWidth: '100%', display: 'flex', flexDirection: 'column', height: 'calc(100vh - 80px)' }}>

                {/* Header de Controle */}
                <div style={{ padding: '15px 20px', background: 'white', borderBottom: '1px solid #e2e8f0', display: 'flex', gap: '15px', alignItems: 'center' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <MessageSquare size={20} className="text-blue-600" />
                        <h2 style={{ fontSize: '16px', fontWeight: '600', margin: 0 }}>Simulador</h2>
                    </div>

                    <div style={{ height: '24px', width: '1px', background: '#e2e8f0' }}></div>

                    <select className="select-clean" style={{ width: '250px' }} value={selectedFlowId} onChange={e => setSelectedFlowId(e.target.value)}>
                        <option value="">Selecione um fluxo...</option>
                        {flows.map(f => <option key={f.id} value={f.id}>{f.name} {f.published ? '' : '(Rascunho)'}</option>)}
                    </select>

                    <button className="btn-primary" onClick={startSimulation} disabled={!selectedFlowId}>
                        <Play size={16} /> Iniciar Sessão
                    </button>

                    {chatId && (
                        <button className="btn-secondary" onClick={() => { setMessages([]); setChatId(null); setIsClosed(false); }} title="Resetar">
                            <RefreshCcw size={16} />
                        </button>
                    )}
                </div>

                <div style={{ flex: 1, display: 'flex', overflow: 'hidden' }}>

                    {/* Área do Chat */}
                    <div className="chat-area" style={{ flex: 1, borderRight: 'none', borderLeft: 'none', borderRadius: 0, borderTop: 'none', borderBottom: 'none' }}>
                        <div className="messages-list" style={{ background: '#f8fafc' }}>
                            {messages.length === 0 && !chatId && (
                                <div style={{ textAlign: 'center', marginTop: '50px', color: '#94a3b8' }}>
                                    <Bot size={48} style={{ opacity: 0.2, margin: '0 auto 10px' }} />
                                    <p>Selecione um fluxo e clique em iniciar.</p>
                                </div>
                            )}

                            {messages.map((m, i) => (
                                <div key={i} className={`msg-bubble ${m.sender === 'user' ? 'user' : 'bot'}`}
                                    style={m.sender === 'system' ? { alignSelf: 'center', background: 'transparent', border: 'none', fontSize: '11px', color: '#64748b' } : {}}>

                                    {m.sender !== 'system' && (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', marginBottom: '4px', fontSize: '10px', opacity: 0.6, fontWeight: '700' }}>
                                            {m.sender === 'bot' ? <Bot size={12} /> : <User size={12} />}
                                            {m.sender.toUpperCase()}
                                        </div>
                                    )}

                                    {m.text}

                                    {m.buttons && (
                                        <div className="chat-buttons-container">
                                            {m.buttons.map(b => (
                                                <button key={b.id} className="chat-btn" onClick={() => handleButtonClick(b.id, b.label)} disabled={isClosed}>
                                                    {b.label}
                                                </button>
                                            ))}
                                        </div>
                                    )}
                                </div>
                            ))}
                            {isTyping && <div className="typing-indicator">FiberBot está digitando...</div>}
                            <div ref={chatEndRef} />
                        </div>

                        <form onSubmit={handleSend} className="chat-input" style={{ borderTop: '1px solid #e2e8f0' }}>
                            <input
                                className="input-clean"
                                value={userInput}
                                onChange={e => setUserInput(e.target.value)}
                                placeholder={isClosed ? "Atendimento encerrado." : "Digite sua mensagem..."}
                                disabled={!chatId || isClosed}
                            />
                            <button type="submit" className="btn-primary" disabled={!chatId || isClosed}>
                                <Send size={18} />
                            </button>
                        </form>
                    </div>

                    {/* Debug Panel Lateral */}
                    <div style={{ width: '300px', background: '#0f172a', borderLeft: '1px solid #1e293b', display: 'flex', flexDirection: 'column' }}>
                        <div style={{ padding: '15px', borderBottom: '1px solid #1e293b', display: 'flex', alignItems: 'center', gap: '8px', color: '#fff' }}>
                            <Terminal size={16} className="text-green-500" />
                            <span style={{ fontSize: '12px', fontWeight: '600', letterSpacing: '0.5px' }}>DEBUG DE VARIÁVEIS</span>
                        </div>
                        <div style={{ flex: 1, padding: '15px', overflowY: 'auto', fontFamily: 'monospace', fontSize: '11px', color: '#cbd5e1' }}>
                            {Object.keys(sessionVars).length === 0 ? (
                                <span style={{ color: '#475569' }}>// Nenhuma variável capturada</span>
                            ) : (
                                Object.entries(sessionVars).map(([key, val]) => (
                                    <div key={key} style={{ marginBottom: '8px' }}>
                                        <span style={{ color: '#38bdf8' }}>{key}:</span> <span style={{ color: '#a5f3fc' }}>"{val}"</span>
                                    </div>
                                ))
                            )}
                            {chatId && (
                                <div style={{ marginTop: '20px', paddingTop: '20px', borderTop: '1px dashed #334155' }}>
                                    <span style={{ color: '#64748b' }}>// Session ID:</span><br />
                                    <span style={{ color: '#94a3b8' }}>{chatId}</span>
                                </div>
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};

export default ChatSimulator;