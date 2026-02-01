import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import {
    Plus,
    Search,
    Workflow,
    Edit3,
    Trash2,
    CheckCircle2,
    AlertCircle,
    Calendar
} from 'lucide-react';

const FlowList = () => {
    const [flows, setFlows] = useState([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');
    const navigate = useNavigate();

    const fetchFlows = async () => {
        try {
            setLoading(true);
            const response = await apiRequest('/flows');
            if (response && response.ok) {
                const data = await response.json();
                setFlows(data);
            }
        } catch (error) {
            console.error("Erro ao buscar fluxos:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchFlows();
    }, []);

    const handleCreateFlow = async () => {
        const name = prompt("Nome do novo fluxo:");
        if (!name || name.trim() === "") return;

        try {
            const response = await apiRequest('/flows', {
                method: 'POST',
                body: JSON.stringify({ name })
            });

            if (response && response.ok) {
                const newFlow = await response.json();
                navigate(`/editor/${newFlow.id}`);
            }
        } catch (error) {
            alert("Erro ao criar fluxo.");
        }
    };

    const handleDeleteFlow = async (id, name) => {
        if (!window.confirm(`Deseja realmente excluir o fluxo "${name}"?\nEsta ação é irreversível.`)) return;

        try {
            const response = await apiRequest(`/flows/${id}`, {
                method: 'DELETE'
            });

            if (response && response.ok) {
                setFlows(prev => prev.filter(f => f.id !== id));
            }
        } catch (error) {
            alert("Erro ao excluir fluxo.");
        }
    };

    // Filtro de busca
    const filteredFlows = flows.filter(f =>
        f.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
        f.id.includes(searchTerm)
    );

    return (
        <main className="content">

            <div className="page">
                <div className="page-header">
                    <div>
                        <h1>Fluxos de Conversa</h1>
                        <p>Gerencie os roteiros automatizados do chatbot.</p>
                    </div>
                    <button className="btn-primary" onClick={handleCreateFlow}>
                        <Plus size={18} /> Novo Fluxo
                    </button>
                </div>

                {/* Barra de Ferramentas / Filtro */}
                <div style={{ background: 'white', padding: '15px', borderRadius: '8px', border: '1px solid var(--border)', marginBottom: '20px', display: 'flex', gap: '10px' }}>
                    <div style={{ position: 'relative', flex: 1, maxWidth: '400px' }}>
                        <Search size={16} style={{ position: 'absolute', left: '10px', top: '10px', color: '#94a3b8' }} />
                        <input
                            className="input-clean"
                            placeholder="Buscar fluxo por nome ou ID..."
                            value={searchTerm}
                            onChange={e => setSearchTerm(e.target.value)}
                            style={{ paddingLeft: '35px' }}
                        />
                    </div>
                </div>

                <div className="table-container">
                    <table className="data-table">
                        <thead>
                            <tr>
                                <th style={{ width: '40%' }}>Nome do Fluxo</th>
                                <th>Status</th>
                                <th>Última Atualização</th>
                                <th>ID</th>
                                <th style={{ textAlign: 'right' }}>Ações</th>
                            </tr>
                        </thead>
                        <tbody>
                            {loading ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px' }}>Carregando...</td></tr>
                            ) : filteredFlows.length === 0 ? (
                                <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: '#64748b' }}>Nenhum fluxo encontrado.</td></tr>
                            ) : (
                                filteredFlows.map(flow => (
                                    <tr key={flow.id}>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                                <div style={{ padding: '8px', background: '#f1f5f9', borderRadius: '6px', color: '#475569' }}>
                                                    <Workflow size={18} />
                                                </div>
                                                <span style={{ fontWeight: '600' }}>{flow.name}</span>
                                            </div>
                                        </td>
                                        <td>
                                            {flow.published ? (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    background: '#dcfce7', color: '#166534',
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600'
                                                }}>
                                                    <CheckCircle2 size={12} /> PUBLICADO
                                                </span>
                                            ) : (
                                                <span style={{
                                                    display: 'inline-flex', alignItems: 'center', gap: '4px',
                                                    background: '#f1f5f9', color: '#64748b',
                                                    padding: '2px 8px', borderRadius: '4px', fontSize: '11px', fontWeight: '600'
                                                }}>
                                                    <AlertCircle size={12} /> RASCUNHO
                                                </span>
                                            )}
                                        </td>
                                        <td>
                                            <div style={{ display: 'flex', alignItems: 'center', gap: '6px', color: '#64748b', fontSize: '12px' }}>
                                                <Calendar size={14} />
                                                {/* Data fictícia ou lastPublishedAt se tiver */}
                                                {flow.lastPublishedAt ? new Date(flow.lastPublishedAt).toLocaleDateString() : '-'}
                                            </div>
                                        </td>
                                        <td>
                                            <code style={{ background: '#f8fafc', padding: '2px 6px', borderRadius: '4px', fontSize: '11px', color: '#64748b' }}>
                                                {flow.id}
                                            </code>
                                        </td>
                                        <td style={{ textAlign: 'right' }}>
                                            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '8px' }}>
                                                <button
                                                    onClick={() => navigate(`/editor/${flow.id}`)}
                                                    className="btn-secondary"
                                                    title="Editar Fluxo"
                                                    style={{ padding: '6px 10px' }}
                                                >
                                                    <Edit3 size={16} />
                                                </button>
                                                <button
                                                    onClick={() => handleDeleteFlow(flow.id, flow.name)}
                                                    className="btn-danger"
                                                    title="Excluir"
                                                    style={{ padding: '6px 10px', background: '#fee2e2', color: '#ef4444', borderColor: '#fecaca' }}
                                                >
                                                    <Trash2 size={16} />
                                                </button>
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>
        </main>
    );
};

export default FlowList;