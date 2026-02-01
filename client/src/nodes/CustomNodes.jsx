import React from 'react';
import { Handle, Position, useNodes } from 'reactflow';
import {
    Play, Square, MessageSquare, TextCursorInput,
    Database, Split, Anchor, ArrowRight, Code,
    Globe, Hourglass, Users, Clock, FileText,
    X, Flag, CheckCircle2, XCircle
} from 'lucide-react';

const NodeContainer = ({ title, icon: Icon, color, children, onDelete, nodeId, selected }) => (
    <div style={{
        background: '#fff',
        border: `1px solid ${selected ? color : '#cbd5e1'}`,
        borderRadius: '6px',
        minWidth: '240px',
        boxShadow: selected ? `0 0 0 2px ${color}33` : '0 1px 3px rgba(0,0,0,0.05)',
        overflow: 'hidden',
        transition: 'all 0.2s'
    }}>
        {/* Header do Nó */}
        <div style={{
            background: color,
            padding: '8px 12px',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            color: 'white'
        }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <Icon size={14} strokeWidth={2.5} />
                <span style={{ fontSize: '11px', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '0.5px' }}>{title}</span>
            </div>
            {onDelete && nodeId !== 'start' && (
                <button
                    onClick={(e) => { e.stopPropagation(); onDelete(nodeId); }}
                    style={{ background: 'rgba(0,0,0,0.2)', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '2px', display: 'flex', color: 'white' }}
                >
                    <X size={12} />
                </button>
            )}
        </div>

        {/* Corpo do Nó */}
        <div style={{ padding: '12px', fontSize: '12px', color: '#334155' }}>
            {children}
        </div>
    </div>
);

export const StartNode = ({ id, data, selected }) => (
    <NodeContainer title="Início" icon={Play} color="#10b981" nodeId={id} selected={selected}>
        <div style={{ color: '#64748b' }}>Ponto de partida do fluxo.</div>
        <Handle type="source" position={Position.Right} style={{ background: '#10b981', width: '10px', height: '10px' }} />
    </NodeContainer>
);

export const EndNode = ({ id, data, selected }) => (
    <NodeContainer title="Fim" icon={Square} color="#ef4444" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#ef4444', width: '10px', height: '10px' }} />
        <div style={{ color: '#64748b' }}>Encerra a conversa sem ação.</div>
    </NodeContainer>
);

export const FinalNode = ({ id, data, selected }) => (
    <NodeContainer title="Finalizar Atendimento" icon={Flag} color="#0f172a" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#0f172a' }} />
        <div style={{ color: '#64748b' }}>Gera protocolo e fecha sessão.</div>
    </NodeContainer>
);

export const MessageNode = ({ id, data, selected }) => (
    <NodeContainer title="Enviar Mensagem" icon={MessageSquare} color="#3b82f6" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#3b82f6' }} />
        <textarea
            className="input-clean"
            placeholder="Digite o texto do bot..."
            rows="3"
            value={data.text}
            onChange={(e) => data.onChange(e.target.value)}
            style={{ resize: 'vertical', minHeight: '60px' }}
        />
        <Handle type="source" position={Position.Right} style={{ background: '#3b82f6' }} />
    </NodeContainer>
);

export const InputNode = ({ id, data, selected }) => (
    <NodeContainer title="Solicitar Dados" icon={TextCursorInput} color="#f59e0b" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#f59e0b' }} />

        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '10px', color: '#94a3b8' }}>PERGUNTA:</label>
        <input
            className="input-clean"
            placeholder="Ex: Qual seu CPF?"
            value={data.text}
            onChange={(e) => data.onTextChange(e.target.value)}
            style={{ marginBottom: '10px' }}
        />

        <label style={{ display: 'block', marginBottom: '4px', fontWeight: '600', fontSize: '10px', color: '#94a3b8' }}>SALVAR EM:</label>
        <select
            className="input-clean"
            value={data.variableName}
            onChange={(e) => data.onVarChange(e.target.value)}
        >
            <option value="">Selecione a variável...</option>
            {data.availableVars?.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
            ))}
        </select>
        <Handle type="source" position={Position.Right} style={{ background: '#f59e0b' }} />
    </NodeContainer>
);

export const SetValueNode = ({ id, data, selected }) => (
    <NodeContainer title="Definir Variável" icon={Database} color="#059669" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#059669' }} />

        <select
            className="input-clean"
            value={data.variableName}
            onChange={(e) => data.onVarChange(e.target.value)}
            style={{ marginBottom: '8px' }}
        >
            <option value="">Variável Alvo...</option>
            {data.availableVars?.map(v => (
                <option key={v.id} value={v.name}>{v.name}</option>
            ))}
        </select>

        <input
            className="input-clean"
            placeholder="Valor fixo (ex: VIP)"
            value={data.value}
            onChange={(e) => data.onValueChange(e.target.value)}
        />
        <Handle type="source" position={Position.Right} style={{ background: '#059669' }} />
    </NodeContainer>
);

export const ConditionNode = ({ id, data, selected }) => (
    <NodeContainer title="Condicional (IF)" icon={Split} color="#7c3aed" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#7c3aed' }} />

        <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
            {data.conditions?.map((cond) => (
                <div key={cond.id} style={{ background: '#f8fafc', padding: '6px 8px', borderRadius: '4px', border: '1px solid #e2e8f0', position: 'relative', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <div style={{ fontSize: '11px' }}>
                        <span style={{ fontWeight: '600', color: '#475569' }}>{cond.variable}</span> {cond.operator} <span style={{ fontWeight: '600', color: '#2563eb' }}>{cond.value}</span>
                    </div>
                    <Handle type="source" position={Position.Right} id={cond.id} style={{ right: '-20px', background: '#7c3aed' }} />
                </div>
            ))}
        </div>

        <button
            onClick={() => data.onAddCondition(id)}
            style={{ width: '100%', marginTop: '10px', padding: '6px', border: '1px dashed #7c3aed', background: '#f5f3ff', color: '#7c3aed', borderRadius: '4px', fontSize: '10px', fontWeight: '600' }}
        >
            + ADICIONAR REGRA
        </button>

        <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px solid #e2e8f0', display: 'flex', justifyContent: 'space-between', alignItems: 'center', fontSize: '11px', color: '#64748b' }}>
            <span>Caso contrário (Else)</span>
            <Handle type="source" position={Position.Right} id="else" style={{ background: '#94a3b8' }} />
        </div>
    </NodeContainer>
);

export const AnchorNode = ({ id, data, selected }) => (
    <NodeContainer title="Âncora (Flag)" icon={Anchor} color="#db2777" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#db2777' }} />
        <input
            className="input-clean"
            placeholder="Nome da flag..."
            value={data.anchorName}
            onChange={(e) => data.onAnchorNameChange(e.target.value)}
        />
        <Handle type="source" position={Position.Right} style={{ background: '#db2777' }} />
    </NodeContainer>
);

export const GotoNode = ({ id, data, selected }) => {
    const allNodes = useNodes();
    const anchors = allNodes.filter(n => n.type === 'anchorNode');

    return (
        <NodeContainer title="Ir Para (Goto)" icon={ArrowRight} color="#db2777" onDelete={data.onDelete} nodeId={id} selected={selected}>
            <Handle type="target" position={Position.Left} style={{ background: '#db2777' }} />
            <select
                className="input-clean"
                value={data.targetAnchorId}
                onChange={(e) => data.onTargetChange(e.target.value)}
            >
                <option value="">Selecione o destino...</option>
                {anchors.map(a => (
                    <option key={a.id} value={a.id}>{a.data.anchorName || 'Sem nome'}</option>
                ))}
            </select>
        </NodeContainer>
    );
};

export const HttpRequestNode = ({ id, data, selected }) => (
    <NodeContainer title="Requisição HTTP" icon={Globe} color="#0891b2" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#0891b2' }} />

        <input
            className="input-clean"
            placeholder="URL (ex: https://api.com/{cpf})"
            value={data.url}
            onChange={(e) => data.onUrlChange(e.target.value)}
            style={{ marginBottom: '10px' }}
        />

        <div style={{ borderTop: '1px solid #e2e8f0', paddingTop: '8px' }}>
            <label style={{ fontSize: '9px', fontWeight: '700', color: '#64748b', textTransform: 'uppercase' }}>Mapeamento (JSON - Variável)</label>
            {data.mappings?.map((map, index) => (
                <div key={index} style={{ display: 'flex', gap: '4px', marginTop: '4px' }}>
                    <input className="input-clean" placeholder="json.campo" value={map.jsonPath} onChange={(e) => data.onMappingChange(index, 'jsonPath', e.target.value)} style={{ fontSize: '10px', padding: '4px' }} />
                    <select className="input-clean" value={map.varName} onChange={(e) => data.onMappingChange(index, 'varName', e.target.value)} style={{ fontSize: '10px', padding: '4px' }}>
                        <option value="">Var...</option>
                        {data.availableVars?.map(v => <option key={v.id} value={v.name}>{v.name}</option>)}
                    </select>
                </div>
            ))}
            <button onClick={() => data.onAddMapping(id)} style={{ width: '100%', marginTop: '5px', fontSize: '10px', background: '#ecfeff', border: '1px solid #0891b2', color: '#0891b2', borderRadius: '4px', cursor: 'pointer' }}>+ Mapear Campo</button>
        </div>
        <Handle type="source" position={Position.Right} style={{ background: '#0891b2' }} />
    </NodeContainer>
);

export const ScriptNode = ({ id, data, selected }) => (
    <NodeContainer title="Javascript" icon={Code} color="#475569" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#475569' }} />
        <textarea
            className="input-clean"
            value={data.script}
            onChange={(e) => data.onScriptChange(e.target.value)}
            placeholder="// vars.nome = vars.nome.toUpperCase();"
            style={{ fontFamily: 'monospace', fontSize: '11px', background: '#f8fafc', minHeight: '80px', color: '#334155' }}
        />
        <Handle type="source" position={Position.Right} style={{ background: '#475569' }} />
    </NodeContainer>
);

export const DelayNode = ({ id, data, selected }) => (
    <NodeContainer title="Aguardar" icon={Hourglass} color="#d97706" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#d97706' }} />
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
            <input
                type="number"
                className="input-clean"
                value={data.delay}
                onChange={(e) => data.onDelayChange(e.target.value)}
            />
            <span style={{ fontSize: '11px', color: '#64748b', fontWeight: '600' }}>SEGUNDOS</span>
        </div>
        <Handle type="source" position={Position.Right} style={{ background: '#d97706' }} />
    </NodeContainer>
);

const AVAILABLE_QUEUES = ["SUPORTE", "SAC", "COBRANÇA", "ALTERAÇÃO DE PLANO", "ATIVAÇÃO DE PLANO"];
export const QueueNode = ({ id, data, selected }) => (
    <NodeContainer title="Transferir Fila" icon={Users} color="#ea580c" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#ea580c' }} />
        <select
            className="input-clean"
            value={data.queueName}
            onChange={(e) => data.onQueueChange(e.target.value)}
        >
            <option value="">Selecione a Fila...</option>
            {AVAILABLE_QUEUES.map(q => <option key={q} value={q}>{q}</option>)}
        </select>
        <Handle type="source" position={Position.Right} style={{ background: '#ea580c' }} />
    </NodeContainer>
);

export const ScheduleNode = ({ id, data, selected }) => (
    <NodeContainer title="Horário" icon={Clock} color="#16a34a" onDelete={data.onDelete} nodeId={id} selected={selected}>
        <Handle type="target" position={Position.Left} style={{ background: '#16a34a' }} />
        <select
            className="input-clean"
            value={data.scheduleId}
            onChange={(e) => data.onScheduleChange(e.target.value)}
        >
            <option value="">Grupo de Horário...</option>
            {data.availableSchedules?.map(s => <option key={s.id} value={s.id}>{s.name}</option>)}
        </select>

        <div style={{ marginTop: '10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '8px', fontSize: '11px', color: '#166534', fontWeight: '600' }}>
                <span><CheckCircle2 size={12} style={{ verticalAlign: 'middle' }} /> Aberto</span>
                <Handle type="source" position={Position.Right} id="inside" style={{ background: '#16a34a' }} />
            </div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', fontSize: '11px', color: '#991b1b', fontWeight: '600' }}>
                <span><XCircle size={12} style={{ verticalAlign: 'middle' }} /> Fechado</span>
                <Handle type="source" position={Position.Right} id="outside" style={{ background: '#ef4444' }} />
            </div>
        </div>
    </NodeContainer>
);

export const TemplateNode = ({ id, data, selected }) => {
    const selectedTemplate = data.availableTemplates?.find(t => t.id === data.templateId);
    return (
        <NodeContainer title="Modelo (HSM)" icon={FileText} color="#be185d" onDelete={data.onDelete} nodeId={id} selected={selected}>
            <Handle type="target" position={Position.Left} style={{ background: '#be185d' }} />
            <select
                className="input-clean"
                value={data.templateId}
                onChange={(e) => data.onTemplateChange(e.target.value)}
            >
                <option value="">Selecione o Modelo...</option>
                {data.availableTemplates?.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
            </select>
            {selectedTemplate && (
                <div style={{ marginTop: '10px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
                    {selectedTemplate.buttons.map(btn => (
                        <div key={btn.id} style={{ background: '#fdf2f8', border: '1px solid #fbcfe8', padding: '6px', borderRadius: '4px', fontSize: '10px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                            <span style={{ color: '#be185d', fontWeight: '600' }}>{btn.label}</span>
                            <Handle type="source" position={Position.Right} id={btn.id} style={{ background: '#be185d' }} />
                        </div>
                    ))}
                </div>
            )}
        </NodeContainer>
    );
};