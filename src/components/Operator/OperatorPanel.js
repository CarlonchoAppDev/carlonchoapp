import React, { useEffect, useState } from 'react';
import { supabase } from '../../supabaseClient';
import { FaWhatsapp, FaCheckCircle, FaTimesCircle, FaDownload, FaUserEdit, FaFileAlt } from 'react-icons/fa';

// Componente auxiliar para mostrar email del usuario
const SolicitudEmailDisplay = ({ userId, getUserEmail }) => {
  const [email, setEmail] = useState('Cargando...');

  React.useEffect(() => {
    const fetchEmail = async () => {
      const userEmail = await getUserEmail(userId);
      setEmail(userEmail);
    };
    fetchEmail();
  }, [userId, getUserEmail]);

  return <div className="mb-2"><b>Usuario que envió:</b> {email}</div>;
};

function OperatorPanel() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
  const [userEmails, setUserEmails] = useState({}); // Cache de emails de usuarios
  const [respuesta, setRespuesta] = useState('');
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');
  const [archivoPopup, setArchivoPopup] = useState({ visible: false, url: '', tipo: '' });

  // Función para obtener el email del usuario por ID
  const getUserEmail = async (userId) => {
    // Si ya tenemos el email en cache, lo usamos
    if (userEmails[userId]) {
      return userEmails[userId];
    }

    try {
      // Intentamos obtener el email desde la tabla users primero
      const { data: userData, error: userError } = await supabase
        .from('users')
        .select('email')
        .eq('id', userId)
        .single();

      if (!userError && userData?.email) {
        setUserEmails(prev => ({ ...prev, [userId]: userData.email }));
        return userData.email;
      }

      // Si no está en users, fallback a mostrar parte del ID
      const shortId = userId ? userId.substring(0, 8) + '...' : 'Usuario desconocido';
      setUserEmails(prev => ({ ...prev, [userId]: shortId }));
      return shortId;
    } catch (error) {
      console.error('Error al obtener email del usuario:', error);
      const shortId = userId ? userId.substring(0, 8) + '...' : 'Usuario desconocido';
      setUserEmails(prev => ({ ...prev, [userId]: shortId }));
      return shortId;
    }
  };

  // Función para generar URL firmada dinámicamente
  const getSignedUrl = async (filePath) => {
    const { data, error } = await supabase.storage
      .from('solicitudes')
      .createSignedUrl(filePath, 60 * 60); // 1 hora
    
    if (error) {
      console.error('Error al generar URL firmada:', error);
      return null;
    }
    
    return data.signedUrl;
  };

  // Función para abrir archivo con URL firmada dinámica
  const openFile = async (filePath) => {
    const signedUrl = await getSignedUrl(filePath);
    if (signedUrl) {
      const isPdf = filePath.toLowerCase().includes('.pdf');
      setArchivoPopup({
        visible: true,
        url: signedUrl,
        tipo: isPdf ? 'pdf' : 'img'
      });
    } else {
      console.error('Error al abrir el archivo.');
    }
  };

  // Polling solo para la lista de solicitudes
  useEffect(() => {
    let intervalId;
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    getUser();
    
    const fetchSolicitudes = async () => {
      const { data } = await supabase
        .from('solicitudes')
        .select('*');
      setSolicitudes(data || []);
    };
    fetchSolicitudes(); // carga inicial

    intervalId = setInterval(fetchSolicitudes, 5000); // actualiza cada 5 segundos

    return () => clearInterval(intervalId); // limpia el intervalo al desmontar
  }, []);

  // Filtrado por búsqueda y estado
  const solicitudesFiltradas = solicitudes
    .filter(s =>
      s.nombre.toLowerCase().includes(search.toLowerCase()) ||
      s.cedula.toLowerCase().includes(search.toLowerCase()) ||
      s.carrera.toLowerCase().includes(search.toLowerCase()) ||
      s.estado.toLowerCase().includes(search.toLowerCase())
    )
    .filter(s => {
      if (estadoFiltro === 'todos') return true;
      return s.estado === estadoFiltro;
    });

  // Ordena: pendientes, rechazadas, aceptadas; y dentro de cada grupo, las más antiguas primero
  const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    const estadoOrden = { 'activa': 0, 'rechazada': 1, 'aceptada': 2 };
    const estadoA = estadoOrden[a.estado] ?? 99;
    const estadoB = estadoOrden[b.estado] ?? 99;
    if (estadoA !== estadoB) return estadoA - estadoB;
    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

  const handleAceptar = async (solicitud) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({
        estado: 'aceptada',
        respuesta,
        fecha_modificacion: new Date().toISOString()
      })
      .eq('id', solicitud.id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
      return;
    }

    const whatsappMsg = encodeURIComponent(respuesta);
    window.open(`https://wa.me/${solicitud.telefono}?text=${whatsappMsg}`, '_blank');
    setRespuesta('');
    setSelectedSolicitud(null);
    setTimeout(() => {
      // Actualiza la lista después de responder
      const fetchSolicitudes = async () => {
        const { data } = await supabase
          .from('solicitudes')
          .select('*');
        setSolicitudes(data || []);
      };
      fetchSolicitudes();
    }, 300);
  };

  const handleRechazar = async (solicitud) => {
    const { error } = await supabase
      .from('solicitudes')
      .update({
        estado: 'rechazada',
        respuesta,
        fecha_modificacion: new Date().toISOString()
      })
      .eq('id', solicitud.id);

    if (error) {
      alert('Error al actualizar: ' + error.message);
      return;
    }

    setRespuesta('');
    setSelectedSolicitud(null);
    setTimeout(() => {
      const fetchSolicitudes = async () => {
        const { data } = await supabase
          .from('solicitudes')
          .select('*');
        setSolicitudes(data || []);
      };
      fetchSolicitudes();
    }, 300);
  };

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.href = '/'; // Redirige al inicio o login
  };

  // Calcula los totales
  const pendientesCount = solicitudes.filter(s => s.estado === 'activa').length;
  const rechazadasCount = solicitudes.filter(s => s.estado === 'rechazada').length;

  return (
    <div className="container py-4">
      {/* Información del usuario en la parte superior */}
      <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
        <div>
          <small className="text-muted">Sesión activa:</small>
          <span className="ms-2 fw-bold">{currentUser?.email || 'Cargando...'}</span>
        </div>
        <div>
          <span className="badge bg-success">Operador</span>
        </div>
      </div>

      <h2 className="mb-4 text-primary">
        <FaUserEdit style={{ marginRight: 8 }} />
        Gestión de Solicitudes
      </h2>
      {/* Barra de búsqueda */}
      <div className="mb-3">
        <input
          type="text"
          className="form-control"
          placeholder="Buscar por nombre, cédula, carrera o estado..."
          value={search}
          onChange={e => setSearch(e.target.value)}
        />
      </div>
      {/* Botones de filtrado por estado */}
      <div className="mb-3 d-flex gap-2">
        <button
          className={`btn ${estadoFiltro === 'todos' ? 'btn-secondary' : 'btn-outline-secondary'}`}
          onClick={() => setEstadoFiltro('todos')}
        >
          Todos
        </button>
        <button
          className={`btn ${estadoFiltro === 'activa' ? 'btn-warning' : 'btn-outline-warning'}`}
          onClick={() => setEstadoFiltro('activa')}
        >
          Pendientes
          {pendientesCount > 0 && (
            <span className="badge bg-danger ms-2">{pendientesCount}</span>
          )}
        </button>
        <button
          className={`btn ${estadoFiltro === 'aceptada' ? 'btn-success' : 'btn-outline-success'}`}
          onClick={() => setEstadoFiltro('aceptada')}
        >
          Aceptadas
        </button>
        <button
          className={`btn ${estadoFiltro === 'rechazada' ? 'btn-danger' : 'btn-outline-danger'}`}
          onClick={() => setEstadoFiltro('rechazada')}
        >
          Rechazadas
          {rechazadasCount > 0 && (
            <span className="badge bg-danger ms-2">{rechazadasCount}</span>
          )}
        </button>
      </div>
      <ul className="list-group mb-4">
        {solicitudesOrdenadas.map((s) => (
          <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <FaFileAlt className="text-info" style={{ marginRight: 8, fontSize: 22 }} />
              <b>{s.nombre}</b> <span className="text-muted">({s.cedula})</span>
              <div style={{ fontSize: 13 }}>
                <b>Tel:</b> {s.telefono} | <b>Estado:</b>
                {s.estado === 'aceptada' && <span className="text-success ms-1"><FaCheckCircle /> Aceptada</span>}
                {s.estado === 'rechazada' && <span className="text-danger ms-1"><FaTimesCircle /> Rechazada</span>}
                {s.estado !== 'aceptada' && s.estado !== 'rechazada' && <span className="text-warning ms-1">Pendiente</span>}
              </div>
            </div>
            <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedSolicitud(s)}>
              Revisar
            </button>
          </li>
        ))}
      </ul>

      {selectedSolicitud && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)',
            zIndex: 9999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setSelectedSolicitud(null)}
        >
          <div
            style={{
              background: '#fff',
              padding: 32,
              borderRadius: 12,
              maxWidth: 500,
              width: '90vw',
              maxHeight: '85vh',
              overflow: 'auto',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            <span
              style={{
                position: 'absolute',
                top: 12,
                right: 16,
                fontSize: 28,
                color: '#d00',
                cursor: 'pointer',
                fontWeight: 'bold',
                zIndex: 10
              }}
              onClick={() => setSelectedSolicitud(null)}
              title="Cerrar"
            >
              ×
            </span>
            <h4 className="mb-2" style={{ color: '#003770' }}>
              <FaFileAlt style={{ marginRight: 6 }} />
              Solicitud de {selectedSolicitud.nombre}
            </h4>
            <SolicitudEmailDisplay userId={selectedSolicitud.usuario_id} getUserEmail={getUserEmail} />
            <div className="mb-2"><b>Cédula:</b> {selectedSolicitud.cedula}</div>
            <div className="mb-2"><b>Carrera:</b> {selectedSolicitud.carrera}</div>
            <div className="mb-2"><b>Tipo de Admisión:</b> {selectedSolicitud.tipo_admision}</div>
            <div className="mb-2"><b>Teléfono:</b> {selectedSolicitud.telefono}</div>
            <div className="mb-2"><b>Estado:</b> {selectedSolicitud.estado}</div>
            <div className="mb-2">
              <b>Descripción:</b>
              <div style={{
                marginTop: 4,
                padding: 8,
                backgroundColor: '#f8f9fa',
                borderRadius: 4,
                border: '1px solid #e9ecef',
                maxHeight: '120px',
                overflowY: 'auto',
                wordWrap: 'break-word',
                whiteSpace: 'pre-wrap'
              }}>
                {selectedSolicitud.descripcion}
              </div>
            </div>
            {/* Mostrar respuesta si existe */}
            {selectedSolicitud.respuesta && (
              <div className="mb-2">
                <b style={{ color: '#007bff', fontSize: '1.1rem', display: 'block', marginBottom: 6 }}>
                  <FaCheckCircle style={{ marginRight: 6, color: '#28a745' }} />
                  Respuesta enviada:
                </b>
                <div style={{
                  background: 'linear-gradient(90deg, #e3fcec 0%, #c8e6c9 100%)',
                  padding: 12,
                  borderRadius: 8,
                  marginTop: 4,
                  fontWeight: 'bold',
                  color: '#222',
                  fontSize: '1.05rem',
                  boxShadow: '0 2px 8px rgba(40,167,69,0.08)',
                  maxHeight: '120px',
                  overflowY: 'auto',
                  wordWrap: 'break-word',
                  whiteSpace: 'pre-wrap'
                }}>
                  {selectedSolicitud.respuesta}
                </div>
              </div>
            )}
            <div className="mb-2">
              <b>Archivos:</b>
              <ul>
                {selectedSolicitud.archivos.map((filePath, idx) => (
                  <li key={idx}>
                    <button
                      className="btn btn-outline-success btn-sm"
                      onClick={() => openFile(filePath)}
                    >
                      <FaDownload style={{ marginRight: 4 }} />
                      Ver archivo {idx + 1}
                    </button>
                  </li>
                ))}
              </ul>
            </div>
            <textarea
              placeholder="Respuesta para el usuario"
              value={respuesta}
              onChange={e => setRespuesta(e.target.value)}
              className="form-control mb-3"
              rows={3}
            />
            <div className="d-flex justify-content-between">
              <button className="btn btn-success" onClick={() => handleAceptar(selectedSolicitud)}>
                <FaWhatsapp style={{ marginRight: 4 }} />
                Aceptar y enviar WhatsApp
              </button>
              <button className="btn btn-danger" onClick={() => handleRechazar(selectedSolicitud)}>
                <FaTimesCircle style={{ marginRight: 4 }} />
                Rechazar solicitud
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal para visualizar archivos */}
      {archivoPopup.visible && (
        <div
          style={{
            position: 'fixed',
            top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.8)',
            zIndex: 99999,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
          onClick={() => setArchivoPopup({ visible: false, url: '', tipo: '' })}
        >
          <div
            style={{
              background: '#fff',
              padding: 24,
              borderRadius: 8,
              maxWidth: '90vw',
              maxHeight: '90vh',
              boxShadow: '0 2px 16px rgba(0,0,0,0.2)',
              position: 'relative'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Icono X para cerrar */}
            <span
              style={{
                position: 'absolute',
                top: 8,
                right: 8,
                fontSize: 28,
                color: '#d00',
                cursor: 'pointer',
                fontWeight: 'bold',
                zIndex: 100000
              }}
              onClick={() => setArchivoPopup({ visible: false, url: '', tipo: '' })}
              title="Cerrar"
            >
              ×
            </span>
            {archivoPopup.tipo === 'pdf' ? (
              <iframe
                src={archivoPopup.url}
                title="Archivo PDF"
                style={{ width: '70vw', height: '70vh', border: 'none' }}
              />
            ) : (
              <img
                src={archivoPopup.url}
                alt="Archivo"
                style={{ maxWidth: '70vw', maxHeight: '70vh', borderRadius: 8 }}
              />
            )}
          </div>
        </div>
      )}

      {/* Botón cerrar sesión */}
      <div className="d-flex justify-content-end mt-4">
        <button
          className="btn btn-danger"
          onClick={handleLogout}
        >
          Cerrar sesión
        </button>
      </div>

      {/* Footer de derechos reservados */}
      <footer className="mt-5 pt-4 border-top text-center">
        <p className="text-muted mb-0 d-flex align-items-center justify-content-center gap-2">
          © 2025 CarlonchoDevApp - Todos los derechos reservados
          <img 
            src={`${process.env.PUBLIC_URL}/carlonchito.png`}
            alt="Carlonchito Logo" 
            className="footer-logo-inline"
          />
        </p>
      </footer>
    </div>
  );
}

export default OperatorPanel;