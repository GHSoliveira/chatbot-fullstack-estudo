import React, { useState, useCallback, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import ReactFlow, {
    addEdge,
    Background,
    Controls,
    applyEdgeChanges,
    applyNodeChanges,
    ReactFlowProvider
} from 'reactflow';
import 'reactflow/dist/style.css';

// Ícones
import {
    MessageSquare, TextCursorInput, Split, FileText,
    Clock, Users, Code, Globe, Hourglass,
    Database, Anchor, Send, Save, Rocket,
    Flag, Play
} from 'lucide-react';

import { apiRequest } from '../services/api';

// Nós Customizados
import {
    StartNode, EndNode, MessageNode, InputNode,
    SetValueNode, ConditionNode, AnchorNode, GotoNode,
    ScriptNode, FinalNode, HttpRequestNode, TemplateNode,
    DelayNode, QueueNode, ScheduleNode
} from '../nodes/CustomNodes';

const nodeTypes = {
    startNode: StartNode, endNode: EndNode, messageNode: MessageNode,
    inputNode: InputNode, setValueNode: SetValueNode, conditionNode: ConditionNode,
    anchorNode: AnchorNode, gotoNode: GotoNode, scriptNode: ScriptNode,
    finalNode: FinalNode, httpRequestNode: HttpRequestNode, templateNode: TemplateNode,
    delayNode: DelayNode, queueNode: QueueNode, scheduleNode: ScheduleNode
};

const FlowEditor = () => {
    const { id } = useParams();
    const [nodes, setNodes] = useState([]);
    const [edges, setEdges] = useState([]);

    // Dados Auxiliares
    const [vars, setVars] = useState([]);
    const [templates, setTemplates] = useState([]);
    const [schedules, setSchedules] = useState([]);
    const [flowName, setFlowName] = useState('');
    const [notification, setNotification] = useState(null);

    // --- 1. FUNÇÕES DE SUPORTE ---

    const showNotification = (message, type = 'success') => {
        setNotification({ message, type });
        setTimeout(() => setNotification(null), 3000);
    };

    const updateNodeData = useCallback((nodeId, newData) => {
        setNodes((nds) => nds.map((node) => {
            if (node.id === nodeId) {
                return { ...node, data: { ...node.data, ...newData } };
            }
            return node;
        }));
    }, []);

    const deleteNode = useCallback((nodeId) => {
        if (nodeId === 'start') return alert("O nó de início é protegido.");
        setNodes((nds) => nds.filter((n) => n.id !== nodeId));
        setEdges((eds) => eds.filter((e) => e.source !== nodeId && e.target !== nodeId));
    }, []);

    const addCondition = useCallback((nodeId) => {
        const variable = prompt("Nome da Variável:");
        const operator = prompt("Operador (==, !=, >, <):", "==");
        const value = prompt("Valor de comparação:");
        if (!variable) return;
        setNodes((nds) => nds.map(node => node.id === nodeId ? {
            ...node, data: { ...node.data, conditions: [...(node.data.conditions || []), { id: `c_${Date.now()}`, variable, operator, value }] }
        } : node));
    }, []);

    // --- 2. HIDRATAÇÃO (O Segredo para os nós funcionarem) ---
    // Injeta funções e dados externos (vars, templates) nos nós estáticos do JSON
    const hydrateNode = useCallback((node, vData, tData, sData) => ({
        ...node,
        data: {
            ...node.data,
            availableVars: vData,
            availableTemplates: tData,
            availableSchedules: sData,
            onDelete: deleteNode,
            onAddCondition: addCondition,
            // Mapeamento de updates
            onChange: (v) => updateNodeData(node.id, { text: v }),
            onTextChange: (v) => updateNodeData(node.id, { text: v }),
            onVarChange: (v) => updateNodeData(node.id, { variableName: v }),
            onValueChange: (v) => updateNodeData(node.id, { value: v }),
            onAnchorNameChange: (v) => updateNodeData(node.id, { anchorName: v }),
            onTargetChange: (v) => updateNodeData(node.id, { targetAnchorId: v }),
            onScriptChange: (v) => updateNodeData(node.id, { script: v }),
            onUrlChange: (v) => updateNodeData(node.id, { url: v }),
            onTemplateChange: (v) => updateNodeData(node.id, { templateId: v }),
            onDelayChange: (v) => updateNodeData(node.id, { delay: v }),
            onQueueChange: (v) => updateNodeData(node.id, { queueName: v }),
            onScheduleChange: (v) => updateNodeData(node.id, { scheduleId: v }),
            onAddMapping: () => {
                setNodes(nds => nds.map(n => n.id === node.id ? {
                    ...n, data: { ...n.data, mappings: [...(n.data.mappings || []), { jsonPath: '', varName: '' }] }
                } : n));
            },
            onMappingChange: (idx, field, val) => {
                setNodes(nds => nds.map(n => n.id === node.id ? {
                    ...n, data: { ...n.data, mappings: n.data.mappings.map((m, i) => i === idx ? { ...m, [field]: val } : m) }
                } : n));
            }
        }
    }), [deleteNode, addCondition, updateNodeData]);

    // --- 3. CARREGAMENTO ---

    const load = useCallback(async () => {
        try {
            const [vR, tR, sR, fR] = await Promise.all([
                apiRequest('/variables'),
                apiRequest('/templates'),
                apiRequest('/schedules'),
                apiRequest(`/flows/${id}`)
            ]);

            const vD = await vR.json();
            const tD = await tR.json();
            const sD = await sR.json();
            const fD = await fR.json();

            setVars(vD);
            setTemplates(tD);
            setSchedules(sD);
            setFlowName(fD.name);

            // Carrega do Rascunho (Draft) se existir, senão pega do Published, senão cria vazio
            const source = fD.draft || fD.published || { nodes: [{ id: 'start', type: 'startNode', position: { x: 100, y: 100 }, data: {} }], edges: [] };

            setNodes(source.nodes.map(n => hydrateNode(n, vD, tD, sD)));
            setEdges(source.edges || []);
        } catch (e) {
            console.error(e);
            showNotification("Erro ao carregar dados", "error");
        }
    }, [id, hydrateNode]);

    useEffect(() => { load(); }, [load]);

    // --- 4. REACT FLOW HANDLERS ---

    const onNodesChange = useCallback((chgs) => setNodes((nds) => applyNodeChanges(chgs, nds)), []);
    const onEdgesChange = useCallback((chgs) => setEdges((eds) => applyEdgeChanges(chgs, eds)), []);

    const onConnect = useCallback((params) => {
        const sourceNode = nodes.find(n => n.id === params.source);

        // Regras de Conexão
        if (sourceNode?.type === 'gotoNode') return; // GOTO não sai

        // Validação de Saída Única (exceto Condição, Template e Horário)
        if (!['conditionNode', 'templateNode', 'scheduleNode'].includes(sourceNode?.type)) {
            const hasEdge = edges.some(e => e.source === params.source);
            if (hasEdge) return alert("Este nó permite apenas uma saída.");
        } else {
            // Validação de Handle Ocupado
            const handleBusy = edges.some(e => e.source === params.source && e.sourceHandle === params.sourceHandle);
            if (handleBusy) return alert("Este caminho já está conectado.");
        }

        setEdges((eds) => addEdge(params, eds));
    }, [nodes, edges]);

    // --- 5. CRIAÇÃO E SALVAMENTO ---

    const createNode = (type) => {
        const newNodeId = `${type}_${Date.now()}`;
        const rawNode = {
            id: newNodeId, type, position: { x: 250, y: 150 },
            data: {
                text: '', variableName: '', value: '', anchorName: 'Flag', targetAnchorId: '',
                script: '', url: '', templateId: '', delay: 2, queueName: '', scheduleId: '',
                conditions: [], mappings: []
            }
        };
        // Hidrata imediatamente para ser editável
        setNodes((nds) => [...nds, hydrateNode(rawNode, vars, templates, schedules)]);
    };

    const handleSave = async (publish = false) => {
        if (publish && !window.confirm(`ATENÇÃO: Você está prestes a PUBLICAR o fluxo "${flowName}".\n\nIsso afetará o bot em produção imediatamente.\nDeseja continuar?`)) {
            return;
        }

        // Limpeza dos nós antes de salvar (remove funções)
        const cleanNodes = nodes.map(n => {
            const { availableVars, availableTemplates, availableSchedules, onDelete, onAddCondition, onAddMapping, onChange, onTextChange, onVarChange, onValueChange, onAnchorNameChange, onTargetChange, onScriptChange, onUrlChange, onTemplateChange, onDelayChange, onQueueChange, onScheduleChange, onMappingChange, ...dataToSave } = n.data;
            return {
                id: n.id,
                type: n.type,
                position: n.position,
                data: dataToSave
            };
        });

        try {
            await apiRequest(`/flows/${id}`, {
                method: 'PUT',
                body: JSON.stringify({ nodes: cleanNodes, edges, publish })
            });
            showNotification(publish ? "Fluxo Publicado com Sucesso! 🚀" : "Rascunho Salvo com Sucesso 💾");
        } catch (e) {
            showNotification("Erro ao salvar.", "error");
        }
    };

    return (
        <main className="content">

            <div style={{ height: '100vh', display: 'flex', flexDirection: 'column' }}>
                {notification && (
                    <div style={{
                        position: 'fixed', top: 20, right: 20, zIndex: 1000,
                        background: notification.type === 'error' ? '#ef4444' : '#10b981',
                        color: 'white', padding: '12px 20px', borderRadius: '6px',
                        boxShadow: '0 4px 12px rgba(0,0,0,0.15)', fontWeight: '600'
                    }}>
                        {notification.message}
                    </div>
                )}

                {/* TOOLBAR PROFISSIONAL */}
                <div className="toolbar">
                    <div style={{ display: 'flex', alignItems: 'center', gap: '10px', borderRight: '1px solid #e2e8f0', paddingRight: '15px' }}>
                        <div style={{ width: '32px', height: '32px', background: '#f1f5f9', borderRadius: '6px', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                            <Play size={16} color="#334155" />
                        </div>
                        <div>
                            <div style={{ fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: '700' }}>Editando Fluxo</div>
                            <div style={{ fontSize: '13px', fontWeight: '600', color: '#0f172a' }}>{flowName}</div>
                        </div>
                    </div>

                    <div style={{ display: 'flex', gap: '5px', flexWrap: 'wrap', flex: 1 }}>
                        <button className='btn-tool' title="Mensagem" onClick={() => createNode('messageNode')}><MessageSquare size={16} /> Msg</button>
                        <button className='btn-tool' title="Input" onClick={() => createNode('inputNode')}><TextCursorInput size={16} /> Input</button>
                        <button className='btn-tool' title="Condição" onClick={() => createNode('conditionNode')}><Split size={16} /> If</button>
                        <button className='btn-tool' title="Template" onClick={() => createNode('templateNode')}><FileText size={16} /> Tpl</button>
                        <button className='btn-tool' title="Horário" onClick={() => createNode('scheduleNode')}><Clock size={16} /> Hora</button>
                        <button className='btn-tool' title="Fila" onClick={() => createNode('queueNode')}><Users size={16} /> Fila</button>
                        <button className='btn-tool' title="Script" onClick={() => createNode('scriptNode')}><Code size={16} /> JS</button>
                        <button className='btn-tool' title="API HTTP" onClick={() => createNode('httpRequestNode')}><Globe size={16} /> API</button>
                        <button className='btn-tool' title="Delay" onClick={() => createNode('delayNode')}><Hourglass size={16} /> Delay</button>
                        <button className='btn-tool' title="Variável" onClick={() => createNode('setValueNode')}><Database size={16} /> Set</button>
                        <button className='btn-tool' title="Âncora" onClick={() => createNode('anchorNode')}><Anchor size={16} /> Flag</button>
                        <button className='btn-tool' title="Ir Para" onClick={() => createNode('gotoNode')}><Send size={16} /> Go</button>
                        <button className='btn-tool' title="Finalizar" onClick={() => createNode('finalNode')} style={{ color: '#ef4444' }}><Flag size={16} /> Fim</button>
                    </div>

                    <div style={{ marginLeft: 'auto', display: 'flex', gap: '10px' }}>
                        <button onClick={() => handleSave(false)} className="btn-secondary" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Save size={16} /> Salvar
                        </button>
                        <button onClick={() => handleSave(true)} className="btn-publish" style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
                            <Rocket size={16} /> Publicar
                        </button>
                    </div>
                </div>

                <div style={{ flex: 1, background: '#f8fafc' }}>
                    <ReactFlow
                        nodes={nodes} edges={edges}
                        onNodesChange={(c) => setNodes(nds => applyNodeChanges(c, nds))}
                        onEdgesChange={(c) => setEdges(eds => applyEdgeChanges(c, eds))}
                        onConnect={onConnect} nodeTypes={nodeTypes} fitView
                    >
                        <Background color="#cbd5e1" gap={20} size={1} />
                        <Controls />
                    </ReactFlow>
                </div>
            </div>
        </main>
    );
};

export default () => (
    <ReactFlowProvider>
        <FlowEditor />
    </ReactFlowProvider>
);