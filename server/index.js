import express from 'express';
import cors from 'cors';
import fs from 'fs';
import dotenv from 'dotenv';

// Carrega variáveis de ambiente
dotenv.config();

const app = express();
const PORT = process.env.PORT || 3001;
const DB_FILE = process.env.DB_FILE || './db.json';
const SESSION_TIMEOUT = parseInt(process.env.SESSION_TIMEOUT) || 15000;
const CORS_ORIGIN = process.env.CORS_ORIGIN || 'http://localhost:5173';

app.use(cors({
  origin: CORS_ORIGIN,
  credentials: true
}));
app.use(express.json());

// --- 1. BANCO DE CLIENTES (ERP) ---
const customers = [
    { "id": "101", "cpf": "38192457011", "razao_social": "João Silva Oliveira", "ativo": "true", "online": "true", "faturas_atraso": "false", "qtd_faturas_atraso": "0", "plano": "500 Mega" },
    { "id": "102", "cpf": "74218390544", "razao_social": "Maria Fernanda Costa", "ativo": "true", "online": "false", "faturas_atraso": "true", "qtd_faturas_atraso": "1", "plano": "300 Mega" },
    { "id": "103", "cpf": "12956748308", "razao_social": "Carlos Eduardo Martins", "ativo": "true", "online": "true", "faturas_atraso": "false", "qtd_faturas_atraso": "0", "plano": "200 Mega" },
    { "id": "104", "cpf": "50479123657", "razao_social": "Ana Paula Nogueira", "ativo": "false", "online": "false", "faturas_atraso": "true", "qtd_faturas_atraso": "2", "plano": "500 Mega" },
    { "id": "105", "cpf": "83621975460", "razao_social": "Rafael Moreira Souza", "ativo": "true", "online": "true", "faturas_atraso": "false", "qtd_faturas_atraso": "0", "plano": "1 Giga" },
    { "id": "111", "cpf": "36578102473", "razao_social": "Pedro Henrique Barros", "ativo": "true", "online": "true", "faturas_atraso": "true", "qtd_faturas_atraso": "1", "plano": "200 Mega" },
    { "id": "888", "cpf": "88888888888", "razao_social": "Roberto Carlos Siqueira", "ativo": "true", "online": "true", "faturas_atraso": "true", "qtd_faturas_atraso": "3", "plano": "500 Mega" }
];

// --- 2. PERSISTÊNCIA ---
const loadData = () => {
    const defaultDB = { flows: [], variables: [], messageTemplates: [], schedules: [], systemLogs: [], users: [], activeChats: [] };
    if (fs.existsSync(DB_FILE)) {
        try {
            const data = JSON.parse(fs.readFileSync(DB_FILE, 'utf-8'));
            return { ...defaultDB, ...data };
        } catch (e) { return defaultDB; }
    }
    return defaultDB;
};

let db = loadData();

if (db.users.length === 0) {
    db.users.push({
        id: "u_admin",
        name: process.env.ADMIN_DEFAULT_NAME || "Admin Full",
        username: process.env.ADMIN_DEFAULT_USERNAME || "admin",
        password: process.env.ADMIN_DEFAULT_PASSWORD || "123",
        role: "ADMIN",
        queues: []
    });
    fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));
}

const saveData = () => fs.writeFileSync(DB_FILE, JSON.stringify(db, null, 2));

const createLog = (type, message) => {
    db.systemLogs.unshift({ id: `log_${Date.now()}`, timestamp: new Date().toISOString(), type, message });
    if (db.systemLogs.length > 500) db.systemLogs.pop();
    saveData();
};

const onlineUsers = {};

// --- 3. MIDDLEWARES ---
const authenticate = (req, res, next) => {
    const token = req.headers['authorization'];
    if (!token) return res.status(401).json({ error: "Token ausente" });
    try {
        const userId = token.split('.')[1]; 
        const user = db.users.find(u => u.id === userId);
        if (!user) return res.status(401).json({ error: "Sessão inválida" });
        req.user = user;
        onlineUsers[user.id] = Date.now();
        next();
    } catch (e) { res.status(401).json({ error: "Token inválido" }); }
};

const authorize = (roles) => (req, res, next) => {
    if (!roles.includes(req.user.role)) return res.status(403).json({ error: "Proibido" });
    next();
};

// --- 4. ROTAS PÚBLICAS ---

app.post('/api/auth/login', (req, res) => {
    const { username, password } = req.body;
    const user = db.users.find(u => u.username === username && u.password === password);
    if (user) {
        const token = `tk.${user.id}.${Date.now()}`;
        const { password: _, ...safeUser } = user;
        createLog('LOGIN', `${user.name} logou.`);
        res.json({ user: safeUser, token });
    } else res.status(401).json({ error: "Dados incorretos" });
});

// Chat Engine
app.post('/api/chats/init', (req, res) => {
    const { customerCpf } = req.body;
    let chat = db.activeChats.find(c => c && c.customerCpf === customerCpf && c.status !== 'closed');
    if (!chat) {
        chat = { id: `chat_${Date.now()}`, customerCpf, status: 'bot', messages: [], variables: {}, agentId: null };
        db.activeChats.push(chat); saveData();
    }
    res.json(chat);
});

app.post('/api/chats/:id/messages', (req, res) => {
    const idx = db.activeChats.findIndex(c => c.id === req.params.id);
    if (idx !== -1) {
        db.activeChats[idx].messages.push({ ...req.body, timestamp: new Date() });
        saveData(); res.json(db.activeChats[idx].messages.at(-1));
    } else res.status(404).send();
});

app.put('/api/chats/:id/vars', (req, res) => {
    const idx = db.activeChats.findIndex(c => c.id === req.params.id);
    if (idx !== -1) {
        db.activeChats[idx].variables = { ...db.activeChats[idx].variables, ...req.body };
        saveData(); res.json(db.activeChats[idx].variables);
    } else res.status(404).send();
});

app.post('/api/chats/transfer', (req, res) => {
    const idx = db.activeChats.findIndex(c => c.id === req.body.chatId);
    if (idx !== -1) {
        db.activeChats[idx].agentId = req.body.agentId;
        db.activeChats[idx].queue = req.body.queue;
        db.activeChats[idx].status = 'waiting'; 
        saveData(); res.json(db.activeChats[idx]);
    } else res.status(404).send();
});

app.get('/api/queue/assign/:q', (req, res) => {
    const exists = db.users.some(u => u.role === 'AGENT' && u.queues.some(q => q.toUpperCase() === req.params.q.toUpperCase()));
    if (exists) res.json({ available: true });
    else res.status(404).json({ error: "Fila vazia" });
});

app.get('/api/customers/search/:cpf', (req, res) => {
    const cpf = req.params.cpf.replace(/\D/g, '');
    const c = customers.find(item => item.cpf === cpf);
    c ? res.json(c) : res.status(404).json({ error: "Não encontrado" });
});

// --- 5. ROTAS PROTEGIDAS ---
app.use(authenticate);

app.post('/api/auth/heartbeat', (req, res) => {
    onlineUsers[req.user.id] = Date.now();
    res.json({ ok: true });
});

app.get('/api/monitoring/overview', authorize(['ADMIN', 'MANAGER']), (req, res) => {
    const now = Date.now();
    const agents = db.users.filter(u => u.role === 'AGENT').map(({password, ...u}) => ({
        ...u, isOnline: (now - (onlineUsers[u.id] || 0)) < SESSION_TIMEOUT
    }));
    res.json({ chats: db.activeChats.filter(c => c.status !== 'closed'), agents });
});

// Logs
app.get('/api/logs', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.systemLogs));

// Users
app.get('/api/users', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.users.map(({password, ...u}) => u)));
app.post('/api/users', authorize(['ADMIN']), (req, res) => {
    if (db.users.find(u => u.username === req.body.username)) return res.status(400).json({error: "User existe"});
    db.users.push({ id: `u_${Date.now()}`, ...req.body }); saveData(); res.json({ success: true });
});
app.delete('/api/users/:id', authorize(['ADMIN']), (req, res) => {
    db.users = db.users.filter(u => u.id !== req.params.id); saveData(); res.json({ success: true });
});

// Flows
app.get('/api/flows', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.flows));
app.get('/api/flows/:id', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.flows.find(f => f.id === req.params.id)));
app.post('/api/flows', authorize(['ADMIN']), (req, res) => {
    const f = { id: Date.now().toString(), name: req.body.name, draft: { nodes: [], edges: [] }, published: null };
    db.flows.push(f); saveData(); res.json(f);
});
app.put('/api/flows/:id', authorize(['ADMIN']), (req, res) => {
    const idx = db.flows.findIndex(f => f.id === req.params.id);
    if (idx !== -1) {
        db.flows[idx].draft = req.body.nodes ? { nodes: req.body.nodes, edges: req.body.edges } : db.flows[idx].draft;
        if (req.body.publish) {
            db.flows[idx].published = { nodes: req.body.nodes, edges: req.body.edges };
            createLog('PUBLISH', `Fluxo ${db.flows[idx].name} publicado.`);
        }
        saveData(); res.json({ success: true });
    }
});
app.delete('/api/flows/:id', authorize(['ADMIN']), (req, res) => {
    db.flows = db.flows.filter(f => f.id !== req.params.id); saveData(); res.json({ success: true });
});

// Agent Workspace
app.get('/api/chats/my-queues', authorize(['AGENT', 'ADMIN']), (req, res) => {
    const myActive = db.activeChats.filter(c => c.agentId === req.user.id && c.status === 'open');
    const myWaiting = db.activeChats.filter(c => c.status === 'waiting' && req.user.queues.includes(c.queue) && !c.agentId);
    res.json({ active: myActive, waiting: myWaiting });
});
app.post('/api/chats/pickup', authorize(['AGENT', 'ADMIN']), (req, res) => {
    const idx = db.activeChats.findIndex(c => c.id === req.body.chatId);
    if (idx !== -1 && !db.activeChats[idx].agentId) {
        db.activeChats[idx].agentId = req.user.id;
        db.activeChats[idx].agentName = req.user.name;
        db.activeChats[idx].status = 'open';
        db.activeChats[idx].messages.push({ sender: 'system', text: `Você será atendido por ${req.user.name}.`, timestamp: new Date() });
        saveData(); res.json(db.activeChats[idx]);
    } else res.status(400).json({ error: "Indisponível" });
});
app.put('/api/chats/:id/close', authorize(['AGENT', 'ADMIN']), (req, res) => {
    const idx = db.activeChats.findIndex(c => c.id === req.params.id);
    if (idx !== -1) {
        db.activeChats[idx].status = 'closed';
        db.activeChats[idx].messages.push({ sender: 'system', text: 'Atendimento encerrado.', timestamp: new Date() });
        saveData(); res.json({ success: true });
    }
});
app.get('/api/chats/history/:cpf', authorize(['ADMIN', 'MANAGER']), (req, res) => {
    res.json(db.activeChats.filter(c => c.customerCpf === req.params.cpf && c.status === 'closed'));
});

// Configs
app.get('/api/variables', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.variables));
app.post('/api/variables', authorize(['ADMIN']), (req, res) => { db.variables.push({ id: Date.now().toString(), ...req.body }); saveData(); res.json({ success: true }); });
app.delete('/api/variables/:id', authorize(['ADMIN']), (req, res) => { db.variables = db.variables.filter(v => v.id !== req.params.id); saveData(); res.json({ success: true }); });
app.put('/api/variables/:id', authorize(['ADMIN']), (req, res) => {
    const idx = db.variables.findIndex(v => v.id === req.params.id);
    if(idx !== -1) { db.variables[idx].name = req.body.name; saveData(); res.json(db.variables[idx]); }
});

app.get('/api/templates', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.messageTemplates));
app.post('/api/templates', authorize(['ADMIN']), (req, res) => { db.messageTemplates.push({ id: Date.now().toString(), ...req.body }); saveData(); res.json({ success: true }); });
app.delete('/api/templates/:id', authorize(['ADMIN']), (req, res) => { db.messageTemplates = db.messageTemplates.filter(t => t.id !== req.params.id); saveData(); res.json({ success: true }); });

app.get('/api/schedules', authorize(['ADMIN', 'MANAGER']), (req, res) => res.json(db.schedules));
app.post('/api/schedules', authorize(['ADMIN']), (req, res) => { db.schedules.push({ id: Date.now().toString(), ...req.body }); saveData(); res.json({ success: true }); });
app.delete('/api/schedules/:id', authorize(['ADMIN']), (req, res) => { db.schedules = db.schedules.filter(s => s.id !== req.params.id); saveData(); res.json({ success: true }); });

app.listen(PORT, () => {
    console.log(`🚀 FiberAdmin Server rodando em http://localhost:${PORT}`);
    console.log(`📊 Ambiente: ${process.env.NODE_ENV || 'development'}`);
    console.log(`💾 Database: ${DB_FILE}`);
});