import { Routes, Route, NavLink, Navigate, Link } from 'react-router-dom';
import { useAuth } from './context/AuthContext';
import Login from './pages/Login';

// Páginas
import FlowList from './pages/FlowList';
import FlowEditor from './pages/FlowEditor';
import VariableManager from './pages/VariableManager';
import TemplateManager from './pages/TemplateManager';
import ChatSimulator from './pages/ChatSimulator';
import AgentManager from './pages/AgentManager'; // Gestão de Equipe
import AgentWorkspace from './pages/AgentWorkspace';
import ScheduleManager from './pages/ScheduleManager';
import MonitoringDashboard from './pages/MonitoringDashboard';
import SystemLogs from './pages/SystemLogs';

import './App.css';

// Ícones Profissionais
import {
  LayoutDashboard,
  Workflow,
  Users,
  FileText,
  Database,
  CalendarClock,
  MessageSquare,
  Headset,
  LogOut,
  Bot,
  Activity,
  ScrollText
} from 'lucide-react';

const App = () => {
  const { user, logout } = useAuth();

  // Se não estiver logado, renderiza apenas as rotas de autenticação
  if (!user) {
    return (
      <Routes>
        <Route path="/login" element={<Login />} />
        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    );
  }

  // Helper para links da sidebar
  const NavItem = ({ to, icon: Icon, label }) => (
    <NavLink
      to={to}
      className={({ isActive }) => isActive ? 'active-link' : ''}
    >
      <Icon size={18} strokeWidth={2} />
      <span>{label}</span>
    </NavLink>
  );

  return (
    <div className="admin-container">
      {/* SIDEBAR */}
      <aside className="sidebar">
        <div className="sidebar-logo">
          <Bot size={32} className="text-blue-500" style={{ color: 'var(--primary)' }} />
          <div style={{ lineHeight: '1.1' }}>
            <div style={{ fontSize: '16px' }}>FiberAdmin</div>
            <div style={{ fontSize: '10px', opacity: 0.6, fontWeight: '400' }}>SaaS Platform</div>
          </div>
        </div>

        <div style={{ padding: '0 20px', marginBottom: '10px' }}>
          <div style={{ background: 'rgba(255,255,255,0.05)', borderRadius: '6px', padding: '10px', display: 'flex', alignItems: 'center', gap: '10px', marginTop: "5px" }}>
            <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: 'var(--primary)', color: 'white', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 'bold', fontSize: '14px' }}>
              {user.name.charAt(0).toUpperCase()}
            </div>
            <div style={{ overflow: 'hidden' }}>
              <div style={{ fontSize: '13px', fontWeight: '600', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>{user.name}</div>
              <div style={{ fontSize: '10px', opacity: 0.7 }}>{user.role}</div>
            </div>
          </div>
        </div>

        <nav>
          {/* PERFIL: AGENTE */}
          {user.role === 'AGENT' && (
            <NavItem to="/agent" icon={Headset} label="Meu Atendimento" />
          )}

          {/* PERFIL: GESTÃO (Admin & Manager) */}
          {(user.role === 'ADMIN' || user.role === 'MANAGER') && (
            <>
              <div style={{ padding: '10px 12px 5px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Operação</div>
              <NavItem to="/monitor" icon={Activity} label="Monitoramento" />
              <NavItem to="/system-logs" icon={ScrollText} label="Logs de Auditoria" />

              <div style={{ padding: '15px 12px 5px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Fluxo & Inteligência</div>
              <NavItem to="/flows" icon={Workflow} label="Fluxos de Conversa" />
              <NavItem to="/templates" icon={FileText} label="Templates (HSM)" />
              <NavItem to="/variables" icon={Database} label="Variáveis" />
            </>
          )}

          {/* PERFIL: ADMIN (Configurações Sensíveis) */}
          {user.role === 'ADMIN' && (
            <>
              <div style={{ padding: '15px 12px 5px', fontSize: '10px', color: '#64748b', textTransform: 'uppercase', fontWeight: 'bold', letterSpacing: '0.5px' }}>Administração</div>
              <NavItem to="/users" icon={Users} label="Gestão de Equipe" />
              <NavItem to="/schedules" icon={CalendarClock} label="Expediente" />
              <NavItem to="/simulator" icon={MessageSquare} label="Simulador Bot" />
            </>
          )}
        </nav>

        <div style={{ padding: '15px' }}>
          <button onClick={logout} className="btn-secondary" style={{ width: '100%', justifyContent: 'center', background: 'rgba(255,255,255,0.05)', color: '#ef4444', border: '1px solid rgba(239,68,68,0.3)' }}>
            <LogOut size={16} /> Sair
          </button>
        </div>
      </aside>

      {/* ÁREA DE CONTEÚDO */}
      <Routes>
        <Route path="/" element={user.role === 'AGENT' ? <Navigate to="/agent" /> : <Navigate to="/monitor" />} />

        <Route path="/monitor" element={<MonitoringDashboard />} />
        <Route path="/system-logs" element={<SystemLogs />} />
        <Route path="/flows" element={<FlowList />} />
        <Route path="/editor/:id" element={<FlowEditor />} />

        <Route path="/agent" element={<AgentWorkspace />} />
        <Route path="/users" element={<AgentManager />} />
        <Route path="/templates" element={<TemplateManager />} />
        <Route path="/variables" element={<VariableManager />} />
        <Route path="/schedules" element={<ScheduleManager />} />
        <Route path="/simulator" element={<ChatSimulator />} />

        <Route path="*" element={<Navigate to="/" />} />
      </Routes>

    </div>
  );
};

export default App;