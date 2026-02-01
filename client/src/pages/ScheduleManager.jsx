import { useState, useEffect } from 'react';
import { apiRequest } from '../services/api';
import {
    CalendarClock,
    Save,
    Trash2,
    Clock,
    CheckCircle2,
    XCircle,
    Plus
} from 'lucide-react';

const ScheduleManager = () => {
    const [schedules, setSchedules] = useState([]);
    const [name, setName] = useState('');
    const [loading, setLoading] = useState(true);

    const days = ["Domingo", "Segunda", "Terça", "Quarta", "Quinta", "Sexta", "Sábado"];

    // Estado inicial das regras (todos os dias abertos das 08h às 18h exceto domingo)
    const [rules, setRules] = useState(days.reduce((acc, day, index) => ({
        ...acc, [day]: { active: index !== 0, start: '08:00', end: '18:00' }
    }), {}));

    const fetchSchedules = async () => {
        try {
            setLoading(true);
            const res = await apiRequest('/schedules');
            if (res && res.ok) {
                const data = await res.json();
                setSchedules(data);
            }
        } catch (error) {
            console.error("Erro:", error);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => { fetchSchedules(); }, []);

    const handleSave = async () => {
        if (!name.trim()) return alert("Dê um nome ao grupo de horários.");

        try {
            const res = await apiRequest('/schedules', {
                method: 'POST',
                body: JSON.stringify({ name, rules })
            });

            if (res && res.ok) {
                setName('');
                // Reseta regras para o padrão
                setRules(days.reduce((acc, day, index) => ({
                    ...acc, [day]: { active: index !== 0, start: '08:00', end: '18:00' }
                }), {}));
                fetchSchedules();
                alert("Grupo de horário salvo!");
            }
        } catch (error) {
            alert("Erro ao salvar.");
        }
    };

    const handleDelete = async (id) => {
        if (!confirm("Tem certeza? Fluxos que usam este horário podem falhar.")) return;
        await apiRequest(`/schedules/${id}`, { method: 'DELETE' });
        fetchSchedules();
    };

    return (
        <main className="content">

            <div className="page">
                <div className="page-header">
                    <div>
                        <h1>Horários de Atendimento</h1>
                        <p>Defina janelas de funcionamento para direcionar o fluxo (Dentro/Fora do expediente).</p>
                    </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '400px 1fr', gap: '30px', alignItems: 'start' }}>

                    {/* EDITOR DE HORÁRIO */}
                    <div className="card">
                        <h3 style={{ fontSize: '14px', fontWeight: '600', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', color: '#334155' }}>
                            <Plus size={18} className="text-blue-600" /> Novo Grupo
                        </h3>

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ fontSize: '12px', fontWeight: '600', color: '#64748b' }}>Nome do Setor</label>
                            <input
                                className="input-clean"
                                placeholder="Ex: Suporte Comercial"
                                value={name}
                                onChange={e => setName(e.target.value)}
                            />
                        </div>

                        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px' }}>
                            {days.map(day => (
                                <div key={day} style={{
                                    display: 'flex', alignItems: 'center', justifyContent: 'space-between',
                                    background: rules[day].active ? '#f8fafc' : '#fff',
                                    padding: '8px', borderRadius: '6px', border: '1px solid #f1f5f9',
                                    opacity: rules[day].active ? 1 : 0.6
                                }}>
                                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '13px', cursor: 'pointer', minWidth: '90px' }}>
                                        <input
                                            type="checkbox"
                                            checked={rules[day].active}
                                            onChange={e => setRules({ ...rules, [day]: { ...rules[day], active: e.target.checked } })}
                                        />
                                        <span style={{ fontWeight: rules[day].active ? '600' : '400' }}>{day}</span>
                                    </label>

                                    {rules[day].active ? (
                                        <div style={{ display: 'flex', alignItems: 'center', gap: '5px' }}>
                                            <input
                                                type="time"
                                                className="input-clean"
                                                style={{ padding: '2px 5px', width: 'auto' }}
                                                value={rules[day].start}
                                                onChange={e => setRules({ ...rules, [day]: { ...rules[day], start: e.target.value } })}
                                            />
                                            <span style={{ fontSize: '12px', color: '#94a3b8' }}>até</span>
                                            <input
                                                type="time"
                                                className="input-clean"
                                                style={{ padding: '2px 5px', width: 'auto' }}
                                                value={rules[day].end}
                                                onChange={e => setRules({ ...rules, [day]: { ...rules[day], end: e.target.value } })}
                                            />
                                        </div>
                                    ) : (
                                        <span style={{ fontSize: '11px', color: '#ef4444', fontWeight: '500', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                            <XCircle size={12} /> Fechado
                                        </span>
                                    )}
                                </div>
                            ))}
                        </div>

                        <button onClick={handleSave} className="btn-primary" style={{ marginTop: '20px', width: '100%' }}>
                            <Save size={16} /> Salvar Grupo
                        </button>
                    </div>

                    {/* LISTA DE GRUPOS */}
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))', gap: '20px' }}>
                        {loading ? (
                            <p style={{ color: '#94a3b8' }}>Carregando...</p>
                        ) : schedules.length === 0 ? (
                            <div style={{ gridColumn: '1/-1', padding: '40px', border: '2px dashed #e2e8f0', borderRadius: '8px', textAlign: 'center', color: '#94a3b8' }}>
                                Nenhum grupo de horário configurado.
                            </div>
                        ) : (
                            schedules.map(s => (
                                <div key={s.id} className="card" style={{ padding: '20px' }}>
                                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '15px' }}>
                                        <h4 style={{ margin: 0, fontSize: '16px', color: 'var(--text-main)', display: 'flex', alignItems: 'center', gap: '8px' }}>
                                            <Clock size={18} className="text-blue-500" />
                                            {s.name}
                                        </h4>
                                        <button onClick={() => handleDelete(s.id)} className="btn-danger" style={{ padding: '4px 8px' }}>
                                            <Trash2 size={14} />
                                        </button>
                                    </div>

                                    <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                                        {days.map(d => (
                                            <div key={d} style={{ display: 'flex', justifyContent: 'space-between', fontSize: '11px', borderBottom: '1px solid #f8fafc', paddingBottom: '2px' }}>
                                                <span style={{ color: '#64748b' }}>{d.substring(0, 3)}</span>
                                                {s.rules[d]?.active ? (
                                                    <span style={{ fontWeight: '600', color: '#10b981' }}>
                                                        {s.rules[d].start} - {s.rules[d].end}
                                                    </span>
                                                ) : (
                                                    <span style={{ color: '#cbd5e1' }}>Fechado</span>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                </div>
                            ))
                        )}
                    </div>
                </div>
            </div>
        </main>
    );
};

export default ScheduleManager;