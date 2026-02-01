import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
    Database,
    Plus,
    Edit2,
    Trash2,
    Save,
    X,
    Variable
} from 'lucide-react';

const VariableManager = () => {
    const [vars, setVars] = useState([]);
    const [input, setInput] = useState('');
    const [loading, setLoading] = useState(true);

    // Estado para edição inline
    const [editingId, setEditingId] = useState(null);
    const [editValue, setEditValue] = useState('');

    const fetchVars = async () => {
        try {
            setLoading(true);
            const response = await apiRequest('/variables');
            if (response && response.ok) {
                const data = await response.json();
                setVars(data);
            }
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchVars(); }, []);

    // Helper para formatar nome da variável (snake_case)
    const formatVarName = (val) => val.trim().replace(/\s+/g, '_').toLowerCase();

    const handleAddVar = async (e) => {
        e.preventDefault();
        if (!input.trim()) return;

        try {
            const response = await apiRequest('/variables', {
                method: 'POST',
                body: JSON.stringify({ name: formatVarName(input) })
            });

            if (response && response.ok) {
                setInput('');
                fetchVars();
            }
        } catch (error) { alert("Erro ao criar variável."); }
    };

    const startEdit = (v) => {
        setEditingId(v.id);
        setEditValue(v.name);
    };

    const cancelEdit = () => {
        setEditingId(null);
        setEditValue('');
    };

    const saveEdit = async (id) => {
        if (!editValue.trim()) return;
        try {
            await apiRequest(`/variables/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ name: formatVarName(editValue) })
            });
            setEditingId(null);
            fetchVars();
        } catch (error) { alert("Erro ao editar."); }
    };

    const handleDeleteVar = async (id) => {
        if (!confirm("Excluir esta variável? Fluxos que a utilizam podem quebrar.")) return;
        try {
            await apiRequest(`/variables/${id}`, { method: 'DELETE' });
            setVars(prev => prev.filter(v => v.id !== id));
        } catch (error) { alert("Erro ao excluir."); }
    };

    return (
        <main className="content">

            <div className="page">
                <div className="page-header">
                    <div>
                        <h1>Variáveis de Contexto</h1>
                        <p>Defina as chaves de dados para armazenar informações dos usuários.</p>
                    </div>
                </div>

                {/* Card de Criação */}
                <div className="card" style={{ marginBottom: '30px', borderLeft: '4px solid var(--primary)' }}>
                    <h3 style={{ fontSize: '14px', margin: '0 0 15px 0', display: 'flex', alignItems: 'center', gap: '8px' }}>
                        <Plus size={16} /> Nova Variável
                    </h3>
                    <form onSubmit={handleAddVar} style={{ display: 'flex', gap: '10px' }}>
                        <div style={{ position: 'relative', flex: 1 }}>
                            <Database size={16} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                            <input
                                type="text"
                                value={input}
                                onChange={(e) => setInput(e.target.value)}
                                placeholder="Ex: cpf_cliente, status_pedido..."
                                className="input-clean"
                                style={{ paddingLeft: '35px' }}
                            />
                        </div>
                        <button type="submit" className="btn-primary">
                            Adicionar
                        </button>
                    </form>
                    <div style={{ marginTop: '10px', fontSize: '12px', color: '#64748b', background: '#f1f5f9', padding: '8px', borderRadius: '4px', display: 'inline-block' }}>
                        💡 Dica: Use <code>{`{nome_da_variavel}`}</code> dentro das mensagens para exibir o valor.
                    </div>
                </div>

                {/* Grid de Variáveis */}
                {loading ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: '#94a3b8' }}>Carregando variáveis...</div>
                ) : (
                    <div className="var-grid">
                        {vars.map(v => (
                            <div key={v.id} className="var-card" style={{ position: 'relative', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', height: '140px' }}>

                                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#64748b', fontSize: '11px', textTransform: 'uppercase', fontWeight: 'bold' }}>
                                    <Variable size={14} /> String
                                </div>

                                <div style={{ flex: 1, display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                                    {editingId === v.id ? (
                                        <input
                                            autoFocus
                                            className="input-clean"
                                            value={editValue}
                                            onChange={e => setEditValue(e.target.value)}
                                            style={{ textAlign: 'center', fontWeight: 'bold', color: 'var(--primary)' }}
                                        />
                                    ) : (
                                        <code style={{
                                            fontSize: '16px',
                                            color: 'var(--primary)',
                                            background: '#e0e7ff',
                                            padding: '4px 10px',
                                            borderRadius: '4px',
                                            fontWeight: '600'
                                        }}>
                                            {v.name}
                                        </code>
                                    )}
                                </div>

                                <div style={{ borderTop: '1px solid #f1f5f9', paddingTop: '10px', display: 'flex', justifyContent: 'center', gap: '5px' }}>
                                    {editingId === v.id ? (
                                        <>
                                            <button onClick={() => saveEdit(v.id)} className="btn-primary" style={{ padding: '4px 8px', fontSize: '11px' }}><Save size={14} /></button>
                                            <button onClick={cancelEdit} className="btn-secondary" style={{ padding: '4px 8px', fontSize: '11px' }}><X size={14} /></button>
                                        </>
                                    ) : (
                                        <>
                                            <button onClick={() => startEdit(v)} className="btn-secondary" style={{ padding: '6px', border: 'none', background: 'transparent' }} title="Renomear">
                                                <Edit2 size={16} color="#64748b" />
                                            </button>
                                            <button onClick={() => handleDeleteVar(v.id)} className="btn-secondary" style={{ padding: '6px', border: 'none', background: 'transparent' }} title="Excluir">
                                                <Trash2 size={16} color="#ef4444" />
                                            </button>
                                        </>
                                    )}
                                </div>
                            </div>
                        ))}

                        {vars.length === 0 && (
                            <div style={{ gridColumn: '1/-1', textAlign: 'center', padding: '40px', border: '2px dashed #e2e8f0', borderRadius: '8px', color: '#94a3b8' }}>
                                Nenhuma variável cadastrada.
                            </div>
                        )}
                    </div>
                )}
            </div>
        </main>
    );
};

export default VariableManager;