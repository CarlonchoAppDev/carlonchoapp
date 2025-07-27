import React, { useState, useEffect } from 'react';
import { supabase } from '../../supabaseClient';
import AdminPanel from '../Admin/AdminPanel';
import OperatorPanel from '../Operator/OperatorPanel';
import UserPanel from '../User/UserPanel';
import { FaUser, FaLock, FaShieldAlt } from 'react-icons/fa';

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

  // Formulario de login
  return (
    <div className="login-page-container">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center">
        <div className="d-flex flex-column align-items-center" style={{ zIndex: 1 }}>
          
          {/* Título ejecutivo */}
          <div className="text-center mb-4">
            <h1 className="executive-title">
              CarlonchoApp
            </h1>
            <p className="executive-subtitle mt-3">
              Sistema de Solicitudes para Gestión SISS<br />
              <span style={{ fontSize: '1rem', opacity: '0.7' }}>
                Plataforma administrativa para solicitudes de modificación y creación de admisiones
              </span>
            </p>
          </div>

          {/* Formulario de acceso */}
          <form onSubmit={handleLogin} className="login-form">
            <h2>Acceso al Sistema</h2>
            
            {/* Icono ejecutivo */}
            <div className="executive-icon">
              <div className="executive-icon-circle">
                <FaShieldAlt style={{ fontSize: '2rem', color: 'white' }} />
              </div>
            </div>
            
            <div className="login-input-group">
              <FaUser className="login-input-icon" />
              <input
                type="email"
                placeholder="Correo corporativo"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>
            
            <div className="login-input-group">
              <FaLock className="login-input-icon" />
              <input
                type="password"
                placeholder="Contraseña segura"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
              />
            </div>
            
            <button type="submit">
              Iniciar Sesión
            </button>
            
            {message && (
              <div className="login-message">
                {message}
              </div>
            )}
          </form>
        </div>
      </div>
      
      {/* Footer corporativo */}
      <footer className="login-footer text-center py-4">
        <p className="mb-0" style={{ fontSize: '0.9rem', fontWeight: '300' }}>
          © 2025 CarlonchoApp Enterprise Solutions | Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

export default Login;