import { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate } from 'react-router-dom';
import { apiRequest } from '../services/api';
import { Lock, User, LogIn, Loader2 } from 'lucide-react';

const Login = () => {
    const [form, setForm] = useState({ username: '', password: '' });
    const [loading, setLoading] = useState(false);
    const { login } = useAuth();
    const navigate = useNavigate();

    const handleSubmit = async (e) => {
        e.preventDefault();
        if (!form.username || !form.password) return;

        setLoading(true);

        try {
            // Nota: apiRequest trata automaticamente o JSON headers
            const res = await apiRequest('/auth/login', {
                method: 'POST',
                body: JSON.stringify(form)
            });

            if (res && res.ok) {
                const data = await res.json();
                login(data.user, data.token);

                // Redirecionamento inteligente baseado no cargo
                if (data.user.role === 'AGENT') navigate('/agent');
                else navigate('/monitor');
            } else {
                alert("Usuário ou senha incorretos.");
            }
        } catch (error) {
            console.error(error);
            alert("Erro de conexão com o servidor.");
        } finally {
            setLoading(false);
        }
    };

    return (
        <main className="content">

            <div className="page" style={{
                height: '100vh',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                background: 'linear-gradient(135deg, #f1f5f9 0%, #e2e8f0 100%)'
            }}>
                <div className="card" style={{ width: '400px', padding: '40px', boxShadow: '0 20px 25px -5px rgba(0, 0, 0, 0.1), 0 8px 10px -6px rgba(0, 0, 0, 0.1)' }}>

                    <div style={{ textAlign: 'center', marginBottom: '30px' }}>
                        <div style={{
                            width: '60px', height: '60px', background: 'var(--primary)',
                            borderRadius: '12px', display: 'flex', alignItems: 'center',
                            justifyContent: 'center', margin: '0 auto 15px auto',
                            boxShadow: '0 4px 6px -1px rgba(79, 70, 229, 0.3)'
                        }}>
                            <Lock color="white" size={30} />
                        </div>
                        <h2 style={{ margin: 0, fontSize: '24px', fontWeight: '700', color: 'var(--text-main)' }}>FiberAdmin</h2>
                        <p style={{ margin: '5px 0 0', color: 'var(--text-muted)', fontSize: '14px' }}>Acesso restrito à equipe</p>
                    </div>

                    <form onSubmit={handleSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '15px' }}>

                        <div style={{ position: 'relative' }}>
                            <User size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                            <input
                                className='input-clean'
                                placeholder="Usuário"
                                value={form.username}
                                onChange={e => setForm({ ...form, username: e.target.value })}
                                style={{ paddingLeft: '40px' }}
                                autoFocus
                            />
                        </div>

                        <div style={{ position: 'relative' }}>
                            <Lock size={18} style={{ position: 'absolute', top: '12px', left: '12px', color: '#94a3b8' }} />
                            <input
                                className='input-clean'
                                type="password"
                                placeholder="Senha"
                                value={form.password}
                                onChange={e => setForm({ ...form, password: e.target.value })}
                                style={{ paddingLeft: '40px' }}
                            />
                        </div>

                        <button
                            className="btn-primary"
                            type="submit"
                            disabled={loading}
                            style={{ marginTop: '10px', justifyContent: 'center', height: '45px' }}
                        >
                            {loading ? <Loader2 className="animate-spin" /> : <><LogIn size={18} /> Acessar Painel</>}
                        </button>

                    </form>

                    <div style={{ marginTop: '25px', textAlign: 'center', fontSize: '12px', color: '#94a3b8' }}>
                        Esqueceu sua senha? Contate o administrador.
                    </div>
                </div>
            </div>
        </main>
    );
};

export default Login;