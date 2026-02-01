import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
    FileText,
    Plus,
    Trash2,
    Save,
    MessageSquare,
    MousePointer2,
    X
} from 'lucide-react';

const TemplateManager = () => {
    const [templates, setTemplates] = useState([]);
    const [name, setName] = useState('');
    const [text, setText] = useState('');
    const [buttons, setButtons] = useState([]);
    const [loading, setLoading] = useState(true);

    const fetchTemplates = async () => {
        try {
            setLoading(true);
            const res = await apiRequest('/templates');
            if (res && res.ok) {
                const data = await res.json();
                setTemplates(data);
            }
        } catch (error) {
            console.error("Erro ao carregar templates:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchTemplates(); }, []);

    const handleAddButton = () => {
        if (buttons.length >= 3) return alert("Máximo de 3 botões por modelo.");
        setButtons([...buttons, { id: `btn_${Date.now()}`, label: '' }]);
    };

    const handleRemoveButton = (id) => {
        setButtons(buttons.filter(b => b.id !== id));
    };

    const updateButtonLabel = (index, value) => {
        const newBtns = [...buttons];
        newBtns[index].label = value;
        setButtons(newBtns);
    };

    const handleSave = async () => {
        if (!name.trim() || !text.trim()) return alert("Preencha nome e texto do modelo.");

        // Validação de botões vazios
        if (buttons.some(b => !b.label.trim())) return alert("Preencha o texto de todos os botões.");

        try {
            const res = await apiRequest('/templates', {
                method: 'POST',
                body: JSON.stringify({ name, text, buttons })
            });

            if (res && res.ok) {
                setName(''); setText(''); setButtons([]);
                fetchTemplates();
                alert("Modelo salvo com sucesso!");
            }
        } catch (error) {
            alert("Erro ao salvar template.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Excluir este modelo?")) return;
        await apiRequest(`/templates/${id}`, { method: 'DELETE' });
        fetchTemplates();
    };

    return (
        <main className="content">

            <div className="page">
                <div className="page-header">
                    <div>
                        <h1>Modelos de Mensagem</h1>
                        <p>Crie respostas padrão com botões interativos para usar nos fluxos.</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>

                    {/* EDITOR DE TEMPLATE */}
                    <div className="card">
                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                            <Plus size={18} className="text-blue-600" /> Novo Modelo
                        </h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>
                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Nome do Identificador</label>
                                <input
                                    className="input-clean"
                                    placeholder="Ex: Menu Principal"
                                    value={name}
                                    onChange={e => setName(e.target.value)}
                                />
                            </div>

                            <div>
                                <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b', marginBottom: '4px', display: 'block' }}>Corpo da Mensagem</label>
                                <div style={{ position: 'relative' }}>
                                    <textarea
                                        className="input-clean"
                                        placeholder="Olá {nome}, como podemos ajudar hoje?"
                                        value={text}
                                        onChange={e => setText(e.target.value)}
                                        style={{ height: '100px', resize: 'none' }}
                                    />
                                    <MessageSquare size={16} style={{ position: 'absolute', bottom: '10px', right: '10px', color: '#cbd5e1' }} />
                                </div>
                                <span style={{ fontSize: '11px', color: '#94a3b8' }}>Dica: Use <code>{`{variavel}`}</code> para personalizar.</span>
                            </div>

                            <div style={{ background: '#f8fafc', padding: '15px', borderRadius: '8px', border: '1px solid #e2e8f0' }}>
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                                    <label style={{ fontSize: '12px', fontWeight: '600', color: '#475569' }}>BOTÕES ({buttons.length}/3)</label>
                                    {buttons.length < 3 && (
                                        <button onClick={handleAddButton} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '11px' }}>
                                            <Plus size={12} /> Adicionar
                                        </button>
                                    )}
                                </div>

                                {buttons.length === 0 ? (
                                    <div style={{ textAlign: 'center', padding: '10px', border: '1px dashed #cbd5e1', borderRadius: '6px', color: '#94a3b8', fontSize: '12px' }}>
                                        Sem botões configurados.
                                    </div>
                                ) : (
                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                                        {buttons.map((btn, index) => (
                                            <div key={btn.id} style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                                <MousePointer2 size={16} color="#64748b" />
                                                <input
                                                    className="input-clean"
                                                    placeholder={`Texto do botão ${index + 1}`}
                                                    value={btn.label}
                                                    onChange={e => updateButtonLabel(index, e.target.value)}
                                                />
                                                <button onClick={() => handleRemoveButton(btn.id)} className="btn-danger" style={{ padding: '8px' }}>
                                                    <X size={14} />
                                                </button>
                                            </div>
                                        ))}
                                    </div>
                                )}
                            </div>

                            <button onClick={handleSave} className="btn-primary" style={{ width: '100%', marginTop: '10px' }}>
                                <Save size={18} /> Salvar Modelo
                            </button>
                        </div>
                    </div>

                    {/* LISTA DE PREVIEW */}
                    <div>
                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '15px', color: '#64748b', textTransform: 'uppercase' }}>Modelos Existentes</h3>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', maxHeight: 'calc(100vh - 180px)', overflowY: 'auto' }}>
                            {loading ? <p>Carregando...</p> : templates.length === 0 ? (
                                <div style={{ padding: '40px', textAlign: 'center', color: '#94a3b8', border: '2px dashed #e2e8f0', borderRadius: '8px' }}>
                                    Nenhum modelo criado.
                                </div>
                            ) : (
                                templates.map(t => (
                                    <div key={t.id} style={{ background: 'white', border: '1px solid #e2e8f0', borderRadius: '8px', overflow: 'hidden' }}>
                                        <div style={{ padding: '12px 15px', borderBottom: '1px solid #f1f5f9', display: 'flex', justifyContent: 'space-between', alignItems: 'center', background: '#f8fafc' }}>
                                            <span style={{ fontWeight: '600', fontSize: '13px', color: '#334155' }}>{t.name}</span>
                                            <button onClick={() => handleDelete(t.id)} className="btn-danger" style={{ padding: '4px', background: 'transparent', color: '#ef4444', border: 'none' }}>
                                                <Trash2 size={16} />
                                            </button>
                                        </div>
                                        <div style={{ padding: '15px' }}>
                                            <div style={{ background: '#e0e7ff', padding: '10px', borderRadius: '6px 6px 6px 0', fontSize: '13px', color: '#1e1b4b', marginBottom: '10px', lineHeight: '1.4' }}>
                                                {t.text}
                                            </div>
                                            {t.buttons && t.buttons.length > 0 && (
                                                <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                                                    {t.buttons.map((b, i) => (
                                                        <span key={i} style={{ fontSize: '11px', background: 'white', border: '1px solid #cbd5e1', padding: '4px 10px', borderRadius: '20px', color: '#2563eb', fontWeight: '500' }}>
                                                            {b.label}
                                                        </span>
                                                    ))}
                                                </div>
                                            )}
                                        </div>
                                    </div>
                                ))
                            )}
                        </div>
                    </div>

                </div>
            </div>
        </main>
    );
};

export default TemplateManager;