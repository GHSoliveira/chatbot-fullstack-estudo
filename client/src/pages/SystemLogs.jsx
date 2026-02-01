import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
    Activity,
    ShieldCheck,
    Save,
    ArrowRightLeft,
    LogIn,
    MessageSquare
} from 'lucide-react';

const SystemLogs = () => {
    const [logs, setLogs] = useState([]);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchLogs = async () => {
            try {
                const res = await apiRequest('/logs');
                if (res && res.ok) {
                    const data = await res.json();
                    if (Array.isArray(data)) setLogs(data);
                }
            } catch (err) {
                console.error("Erro ao carregar logs:", err);
            } finally {
                setLoading(false);
            }
        };

        fetchLogs();
        const interval = setInterval(fetchLogs, 5000);
        return () => clearInterval(interval);
    }, []);

    const getLogConfig = (type) => {
        switch (type) {
            case 'PUBLISH': return { color: '#10b981', icon: ShieldCheck, label: 'PUBLICAÇÃO' };
            case 'SAVE': return { color: '#3b82f6', icon: Save, label: 'SALVAMENTO' };
            case 'LOGIN': return { color: '#f59e0b', icon: LogIn, label: 'ACESSO' };
            case 'TRANSFER': return { color: '#8b5cf6', icon: ArrowRightLeft, label: 'TRANSFERÊNCIA' };
            case 'CHAT_START': return { color: '#ec4899', icon: MessageSquare, label: 'NOVO CHAT' };
            default: return { color: '#94a3b8', icon: Activity, label: 'SISTEMA' };
        }
    };

    return (
        <main className="content">

            <div className="page">
                <div className="page-header">
                    <div>
                        <h1>Logs de Auditoria</h1>
                        <p>Registro imutável de ações administrativas e operacionais.</p>
                    </div>
                </div>

                <div className="table-container" style={{ height: 'calc(100vh - 160px)', display: 'flex', flexDirection: 'column' }}>
                    <div style={{ padding: '15px', borderBottom: '1px solid var(--border)', background: '#f8fafc', display: 'flex', justifyContent: 'space-between' }}>
                        <span style={{ fontSize: '12px', fontWeight: 'bold', color: '#64748b' }}>ÚLTIMOS 1000 REGISTROS</span>
                        <span style={{ fontSize: '12px', color: '#94a3b8' }}>Atualização em tempo real</span>
                    </div>

                    <div style={{ flex: 1, overflowY: 'auto', background: '#0f172a' }}>
                        <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13px', fontFamily: 'monospace' }}>
                            <thead style={{ position: 'sticky', top: 0, background: '#1e293b', color: '#94a3b8' }}>
                                <tr>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', width: '180px' }}>TIMESTAMP</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left', width: '150px' }}>TIPO</th>
                                    <th style={{ padding: '12px 20px', textAlign: 'left' }}>MENSAGEM</th>
                                </tr>
                            </thead>
                            <tbody>
                                {loading ? (
                                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Carregando auditoria...</td></tr>
                                ) : logs.length === 0 ? (
                                    <tr><td colSpan="3" style={{ padding: '40px', textAlign: 'center', color: '#475569' }}>Nenhum registro encontrado.</td></tr>
                                ) : (
                                    logs.map(log => {
                                        const config = getLogConfig(log.type);
                                        const Icon = config.icon;
                                        return (
                                            <tr key={log.id} style={{ borderBottom: '1px solid #1e293b', color: '#cbd5e1' }}>
                                                <td style={{ padding: '12px 20px', color: '#64748b' }}>
                                                    {new Date(log.timestamp).toLocaleString()}
                                                </td>
                                                <td style={{ padding: '12px 20px' }}>
                                                    <span style={{
                                                        display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                        color: config.color, fontWeight: '700', fontSize: '11px',
                                                        background: `${config.color}15`, padding: '2px 8px', borderRadius: '4px'
                                                    }}>
                                                        <Icon size={12} /> {config.label}
                                                    </span>
                                                </td>
                                                <td style={{ padding: '12px 20px' }}>
                                                    {log.message}
                                                </td>
                                            </tr>
                                        );
                                    })
                                )}
                            </tbody>
                        </table>
                    </div>
                </div>
            </div>
        </main>
    );
};

export default SystemLogs;