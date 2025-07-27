import React, { useState } from 'react';
import { supabase } from '../../supabaseClient';

function Register() {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [message, setMessage] = useState('');

  const handleRegister = async (e) => {
    e.preventDefault();
    const { error } = await supabase.auth.signUp({ email, password });
    if (error) {
      setMessage(error.message);
    } else {
      setMessage('Registro exitoso. Revisa tu correo para confirmar.');
    }
  };

  return (
    <div className="container d-flex flex-column min-vh-100">
      <div className="flex-grow-1 d-flex align-items-center justify-content-center">
        <form onSubmit={handleRegister} className="p-3">
          <h2>Registro</h2>
          <input
            type="email"
            placeholder="Correo electrónico"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="form-control mb-2"
            required
          />
          <input
            type="password"
            placeholder="Contraseña"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="form-control mb-2"
            required
          />
          <button type="submit" className="btn btn-primary">Registrarse</button>
          {message && <div className="mt-2">{message}</div>}
        </form>
      </div>
      
      {/* Footer de derechos reservados */}
      <footer className="mt-5 pt-4 border-top text-center">
        <p className="text-muted mb-0">
          © 2025 CarlonchoDevApp - Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

export default Register;