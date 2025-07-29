import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser } from 'react-icons/fa';
import AdminPanel from '../Admin/AdminPanel';
import OperatorPanel from '../Operator/OperatorPanel';
import UserPanel from '../User/UserPanel';

function Login() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');
  const [role, setRole] = useState('');

  // Detectar sesión activa al montar
  useEffect(() => {
    const checkSession = async () => {
      const { data: sessionData } = await supabase.auth.getSession();
      const user = sessionData?.session?.user;
      if (user) {
        // Consulta el rol en la tabla users
        const { data: userData } = await supabase
          .from('users')
          .select('role')
          .eq('id', user.id)
          .single();
        if (userData) setRole(userData.role);
      }
    };
    checkSession();
  }, []);

  const handleLogin = async (e) => {
    e.preventDefault();
    
    const { data, error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) {
      setMessage(error.message);
      setRole('');
    } else {
      setMessage('Acceso autorizado. Redirigiendo...');
      const user = data.user;
      // Consulta el rol en la tabla users
      const { data: userData } = await supabase
        .from('users')
        .select('role')
        .eq('id', user.id)
        .single();
      if (!userData) {
        setMessage('Error de autorización. Contacte al administrador.');
        setRole('');
      } else {
        setRole(userData.role);
      }
    }
  };

  // Mostrar el panel según el rol
  if (role === 'admin') {
    return <AdminPanel />;
  }
  if (role === 'operador') {
    return <OperatorPanel />;
  }
  if (role === 'usuario') {
    return <UserPanel />;
  }

  // Formulario de login minimalista
  return (
    <div className="login-container-minimal">
      <div className="login-card-minimal">
        
        {/* Título minimalista */}
        <div className="login-header-minimal">
          <div className="login-logo-container">
            <img 
              src={`${process.env.PUBLIC_URL}/carlonchito.png`}
              alt="Carlonchito Logo" 
              className="login-logo-image"
              onError={(e) => {
                console.log('Error cargando logo:', e);
                // Intentar ruta alternativa
                if (e.target.src.includes('process.env')) {
                  e.target.src = '/carlonchito.png';
                } else {
                  e.target.style.display = 'none';
                }
              }}
              onLoad={() => console.log('Logo cargado exitosamente')}
            />
          </div>
          <h1 className="login-title-minimal">CarlonchoApp</h1>
          <p className="login-subtitle-minimal">Sistema de Gestión SISS</p>
        </div>

        {/* Formulario minimalista */}
        <form onSubmit={handleLogin} className="login-form-minimal">
          <div className="login-field-minimal">
            <label className="login-label-minimal">
              Correo electrónico
            </label>
            <input
              type="email"
              placeholder="usuario@ejemplo.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="login-input-minimal"
              required
            />
          </div>
          
          <div className="login-field-minimal">
            <label className="login-label-minimal">
              Contraseña
            </label>
            <input
              type="password"
              placeholder="••••••••"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="login-input-minimal"
              required
            />
          </div>
          
          <button type="submit" className="login-button-minimal">
            <FaUser className="login-button-icon" />
            Iniciar Sesión
          </button>
          
          {message && (
            <div className="login-message-minimal">
              {message}
            </div>
          )}
        </form>

        {/* Footer minimalista */}
        <div className="login-footer-minimal">
          <p>© 2025 CarlonchoApp</p>
        </div>
      </div>
    </div>
  );
}

export default Login;