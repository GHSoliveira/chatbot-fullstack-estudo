import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
    Users,
    UserPlus,
    Shield,
    Trash2,
    Check,
    Briefcase,
    Headset,
    User,
    Lock,
    Search
} from 'lucide-react';

const AgentManager = () => {
    const [users, setUsers] = useState([]);
    const [form, setForm] = useState({ name: '', username: '', password: '', role: 'AGENT', queues: [] });
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    const QUEUES = ["SUPORTE", "SAC", "COBRANÇA", "ALTERAÇÃO DE PLANO", "ATIVAÇÃO DE PLANO"];

    const fetchUsers = async () => {
        try {
            setLoading(true);
            const res = await apiRequest('/users');
            if (res && res.ok) {
                const data = await res.json();
                setUsers(data);
            }
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchUsers(); }, []);

    const toggleQueue = (q) => {
        const newQueues = form.queues.includes(q)
            ? form.queues.filter(item => item !== q)
            : [...form.queues, q];
        setForm({ ...form, queues: newQueues });
    };

    const handleSave = async (e) => {
        e.preventDefault();
        if (!form.name || !form.username || !form.password) return alert("Preencha os campos obrigatórios.");

        try {
            const res = await apiRequest('/users', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            if (res && res.ok) {
                setForm({ name: '', username: '', password: '', role: 'AGENT', queues: [] });
                fetchUsers();
                alert("Usuário salvo com sucesso.");
            } else {
                const err = await res.json();
                alert(err.error || "Erro ao salvar");
            }
        } catch (error) { alert("Erro de conexão."); }
    };

    const handleDelete = async (id) => {
        if (!confirm("Tem certeza que deseja remover este acesso?")) return;
        try {
            const res = await apiRequest(`/users/${id}`, { method: 'DELETE' });
            if (res.ok) fetchUsers();
            else alert("Erro ao excluir.");
        } catch (e) { console.error(e); }
    };

    const getRoleStyle = (role) => {
        switch (role) {
            case 'ADMIN': return { bg: '#fee2e2', color: '#991b1b', icon: Shield, label: 'Admin' };
            case 'MANAGER': return { bg: '#fef9c3', color: '#854d0e', icon: Briefcase, label: 'Gestor' };
            default: return { bg: '#e0f2fe', color: '#0369a1', icon: Headset, label: 'Agente' };
        }
    };

    const filteredUsers = users.filter(u =>
        u.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.username.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <main className="content">

            <div className="page">
                <div className="page-header">
                    <div>
                        <h1>Gestão de Equipe</h1>
                        <p>Controle de acesso, permissões e distribuição de filas.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '320px 1fr', gap: '25px', alignItems: 'start' }}>

                    {/* --- FORMULÁRIO (CARD ESQUERDA) --- */}
                    <div className="card">
                        <div style={{ paddingBottom: '15px', marginBottom: '15px', borderBottom: '1px solid #e2e8f0', display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <div style={{ background: '#eff6ff', padding: '8px', borderRadius: '6px' }}>
                                <UserPlus size={20} className="text-blue-600" style={{ color: 'var(--primary)' }} />
                            </div>
                            <h3 style={{ fontSize: '14px', fontWeight: '700', margin: 0, color: '#1e293b' }}>Novo Acesso</h3>
                        </div>

                        <form onSubmit={handleSave} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Nome Completo</label>
                                <div style={{ position: 'relative' }}>
                                    <User size={16} style={{ position: 'absolute', top: '10px', left: '10px', color: '#94a3b8' }} />
                                    <input
                                        className="input-clean"
                                        placeholder="Ex: Ana Silva"
                                        value={form.name}
                                        onChange={e => setForm({ ...form, name: e.target.value })}
                                        style={{ paddingLeft: '34px' }}
                                    />
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Credenciais</label>
                                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
                                    <input
                                        className="input-clean"
                                        placeholder="Login"
                                        value={form.username}
                                        onChange={e => setForm({ ...form, username: e.target.value })}
                                    />
                                    <div style={{ position: 'relative' }}>
                                        <Lock size={14} style={{ position: 'absolute', top: '11px', right: '10px', color: '#94a3b8' }} />
                                        <input
                                            type="password"
                                            className="input-clean"
                                            placeholder="Senha"
                                            value={form.password}
                                            onChange={e => setForm({ ...form, password: e.target.value })}
                                        />
                                    </div>
                                </div>
                            </div>

                            <div>
                                <label style={{ fontSize: '11px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block', textTransform: 'uppercase' }}>Cargo (Role)</label>
                                <select
                                    className="select-clean"
                                    value={form.role}
                                    onChange={e => setForm({ ...form, role: e.target.value })}
                                    style={{ width: '100%' }}
                                >
                                    <option value="AGENT">Atendente (Agent)</option>
                                    <option value="MANAGER">Gestor (Manager)</option>
                                    <option value="ADMIN">Administrador (Admin)</option>
                                </select>
                            </div>

                            {form.role === 'AGENT' && (
                                <div style={{ background: '#f8fafc', padding: '12px', borderRadius: '6px', border: '1px solid #e2e8f0' }}>
                                    <label style={{ fontSize: '11px', fontWeight: '700', color: '#334155', marginBottom: '8px', display: 'block' }}>VINCULAR ÀS FILAS:</label>
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {QUEUES.map(q => (
                                            <label key={q} style={{
                                                fontSize: '12px', display: 'flex', alignItems: 'center', gap: '10px',
                                                cursor: 'pointer', color: '#475569', padding: '4px 0'
                                            }}>
                                                <div style={{
                                                    width: '16px', height: '16px', border: '1px solid #cbd5e1', borderRadius: '4px',
                                                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                    background: form.queues.includes(q) ? 'var(--primary)' : 'white',
                                                    borderColor: form.queues.includes(q) ? 'var(--primary)' : '#cbd5e1',
                                                    transition: 'all 0.2s'
                                                }}>
                                                    {form.queues.includes(q) && <Check size={12} color="white" strokeWidth={3} />}
                                                </div>
                                                <input type="checkbox" checked={form.queues.includes(q)} onChange={() => toggleQueue(q)} style={{ display: 'none' }} />
                                                {q}
                                            </label>
                                        ))}
                                    </div>
                                </div>
                            )}

                            <button type="submit" className="btn-primary" style={{ marginTop: '10px', width: '100%', justifyContent: 'center' }}>
                                Cadastrar Usuário
                            </button>
                        </form>
                    </div>

                    <div className="table-container" style={{ display: 'flex', flexDirection: 'column', height: '100%' }}>

                        <div style={{ padding: '15px', borderBottom: '1px solid #e2e8f0', background: '#fff' }}>
                            <div style={{ position: 'relative' }}>
                                <Search size={16} style={{ position: 'absolute', top: '10px', left: '10px', color: '#94a3b8' }} />
                                <input
                                    className="input-clean"
                                    placeholder="Buscar colaborador..."
                                    value={searchTerm}
                                    onChange={e => setSearchTerm(e.target.value)}
                                    style={{ paddingLeft: '35px', width: '100%' }}
                                />
                            </div>
                        </div>

                        <div style={{ overflowX: 'auto' }}>
                            <table className="data-table">
                                <thead>
                                    <tr>
                                        <th style={{ width: '250px' }}>Colaborador</th>
                                        <th>Acesso</th>
                                        <th>Função</th>
                                        <th>Filas / Permissões</th>
                                        <th style={{ textAlign: 'right' }}>Ação</th>
                                    </tr>
                                </thead>
                                <tbody>
                                    {loading ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Carregando equipe...</td></tr>
                                    ) : filteredUsers.length === 0 ? (
                                        <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Nenhum usuário encontrado.</td></tr>
                                    ) : (
                                        filteredUsers.map(u => {
                                            const style = getRoleStyle(u.role);
                                            const Icon = style.icon;
                                            return (
                                                <tr key={u.id}>
                                                    <td>
                                                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                                                            <div style={{
                                                                width: '36px', height: '36px', borderRadius: '50%',
                                                                background: '#f1f5f9', color: '#475569',
                                                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                                                fontWeight: '700', fontSize: '14px', border: '1px solid #e2e8f0'
                                                            }}>
                                                                {u.name.charAt(0).toUpperCase()}
                                                            </div>
                                                            <div style={{ display: 'flex', flexDirection: 'column' }}>
                                                                <span style={{ fontWeight: '600', color: '#0f172a', fontSize: '13px' }}>{u.name}</span>
                                                                <span style={{ fontSize: '11px', color: '#64748b' }}>ID: {u.id.split('_')[1] || 'sys'}</span>
                                                            </div>
                                                        </div>
                                                    </td>
                                                    <td>
                                                        <code style={{ background: '#f8fafc', padding: '4px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', color: '#334155', fontSize: '12px', fontFamily: 'monospace' }}>
                                                            {u.username}
                                                        </code>
                                                    </td>
                                                    <td>
                                                        <span style={{
                                                            display: 'inline-flex', alignItems: 'center', gap: '6px',
                                                            padding: '4px 10px', borderRadius: '20px', fontSize: '11px', fontWeight: '600',
                                                            background: style.bg, color: style.color, border: `1px solid ${style.color}20`
                                                        }}>
                                                            <Icon size={12} />
                                                            {style.label}
                                                        </span>
                                                    </td>
                                                    <td>
                                                        {u.role === 'AGENT' ? (
                                                            u.queues.length > 0 ? (
                                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '4px' }}>
                                                                    {u.queues.map(q => (
                                                                        <span key={q} style={{ fontSize: '10px', background: '#fff', border: '1px solid #cbd5e1', padding: '2px 6px', borderRadius: '4px', color: '#475569' }}>
                                                                            {q}
                                                                        </span>
                                                                    ))}
                                                                </div>
                                                            ) : <span style={{ fontSize: '11px', color: '#ef4444' }}>Sem fila atribuída</span>
                                                        ) : (
                                                            <span style={{ fontSize: '11px', color: '#94a3b8', fontStyle: 'italic' }}>Acesso total ao sistema</span>
                                                        )}
                                                    </td>
                                                    <td style={{ textAlign: 'right' }}>
                                                        <button
                                                            onClick={() => handleDelete(u.id)}
                                                            className="btn-danger"
                                                            title="Revogar acesso"
                                                            style={{ padding: '6px', width: '32px', height: '32px', display: 'inline-flex', alignItems: 'center', justifyContent: 'center' }}
                                                        >
                                                            <Trash2 size={16} />
                                                        </button>
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
            </div>
        </main>
    );
};

export default AgentManager;