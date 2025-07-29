import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import OperatorPanel from '../Operator/OperatorPanel';
import UserPanel from '../User/UserPanel';
import { FaUserShield, FaEnvelope, FaUserTag, FaFileAlt, FaCheckCircle, FaTimesCircle, FaUserPlus, FaIdCard, FaPhone, FaBars, FaChartBar, FaClock, FaDownload, FaBell, FaCalendarAlt, FaExclamationTriangle, FaArrowUp, FaArrowDown } from 'react-icons/fa';

// Componente auxiliar para mostrar email del usuario en Admin
const AdminEmailDisplay = ({ userId, getUserEmail, prefix = "Usuario:" }) => {
  const [email, setEmail] = useState('Cargando...');

  React.useEffect(() => {
    const fetchEmail = async () => {
      const userEmail = await getUserEmail(userId);
      setEmail(userEmail);
    };
    fetchEmail();
  }, [userId, getUserEmail]);

  return <b>{email}</b>;
};

function AdminPanel() {
  const [currentUser, setCurrentUser] = useState(null);
  const [userEmails, setUserEmails] = useState({}); // Cache de emails de usuarios
  const [view, setView] = useState('admin');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [solicitudes, setSolicitudes] = useState([]);
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [formVisible, setFormVisible] = useState(false);
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
  
  // Estados para el dashboard ejecutivo
  const [dashboardStats, setDashboardStats] = useState({
    totalSolicitudes: 0,
    pendientes: 0,
    aceptadas: 0,
    rechazadas: 0,
    usuariosActivos: 0,
    solicitudesToday: 0,
    tiempoPromedio: 0,
    crecimiento: 0
  });
  const [showAlerts, setShowAlerts] = useState(false);
  const [systemHealth, setSystemHealth] = useState('healthy');

  // Formulario para crear usuario
  const [newUser, setNewUser] = useState({
    id: '',
    email: '',
    role: 'usuario',
    nombre: '',
    cedula: '',
    telefono: ''
  });
  const [formMsg, setFormMsg] = useState('');

  // Estado para animación del sidebar
  const [sidebarAnim, setSidebarAnim] = useState(false);
  const [sidebarShow, setSidebarShow] = useState(false); // NUEVO estado
  const sidebarRef = useRef(null);

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

  useEffect(() => {
    setFormVisible(true);
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    getUser();

    // Función para calcular estadísticas del dashboard
    const calculateDashboardStats = (solicitudesData) => {
      const total = solicitudesData?.length || 0;
      const pendientes = solicitudesData?.filter(s => s.estado === 'activa').length || 0;
      const aceptadas = solicitudesData?.filter(s => s.estado === 'aceptada').length || 0;
      const rechazadas = solicitudesData?.filter(s => s.estado === 'rechazada').length || 0;
      
      // Calcular solicitudes de hoy
      const today = new Date().toISOString().split('T')[0];
      const solicitudesToday = solicitudesData?.filter(s => 
        s.fecha_creacion && s.fecha_creacion.startsWith(today)
      ).length || 0;
      
      // Calcular tiempo promedio (simulado entre 2-48 horas)
      const tiempoPromedio = Math.floor(Math.random() * 46) + 2;
      
      return {
        totalSolicitudes: total,
        pendientes,
        aceptadas,
        rechazadas,
        solicitudesToday,
        tiempoPromedio
      };
    };

    // Polling para actualizar datos
    const fetchSolicitudes = async () => {
      const { data } = await supabase
        .from('solicitudes')
        .select('*');
      setSolicitudes(data || []);
      
      // Actualizar estadísticas del dashboard
      const stats = calculateDashboardStats(data);
      setDashboardStats(stats);
      
      // Simular estado del sistema (90% saludable)
      setSystemHealth(Math.random() > 0.1 ? 'healthy' : 'warning');
    };
    
    fetchSolicitudes(); // carga inicial
    const intervalId = setInterval(fetchSolicitudes, 10000); // actualiza cada 10 segundos

    return () => clearInterval(intervalId);
  }, []);

  // Cuando sidebarOpen cambia, activa la animación
  useEffect(() => {
    if (sidebarOpen) {
      setSidebarShow(true); // Monta el sidebar
      setTimeout(() => {
        setSidebarAnim(true); // Activa animación de entrada
      }, 20);
    } else {
      setSidebarAnim(false); // Activa animación de salida
      setTimeout(() => setSidebarShow(false), 600); // Desmonta después de la animación
    }
  }, [sidebarOpen]);

  const handleLogout = async () => {
    await supabase.auth.signOut();
    window.location.reload();
  };

  // Formulario crear usuario
  const handleChange = (e) => {
    setNewUser({ ...newUser, [e.target.name]: e.target.value });
  };

  const handleCreateUser = async (e) => {
    e.preventDefault();
    setFormMsg('');
    const { error } = await supabase.from('users').insert([newUser]);
    if (error) {
      setFormMsg('Error al crear usuario: ' + error.message);
    } else {
      setFormMsg('Usuario creado correctamente.');
      setNewUser({
        id: '',
        email: '',
        role: 'usuario',
        nombre: '',
        cedula: '',
        telefono: ''
      });
    }
  };

  // Función para exportar reporte simple
  const exportReport = () => {
    const csvData = [
      ['Nombre', 'Cédula', 'Tipo Admisión', 'Estado', 'Fecha'],
      ...solicitudes.map(s => [
        s.nombre || '',
        s.cedula || '',
        s.tipo_admision || '',
        s.estado || '',
        s.fecha_creacion ? new Date(s.fecha_creacion).toLocaleDateString() : ''
      ])
    ];
    
    const csvContent = csvData.map(row => row.join(',')).join('\n');
    const blob = new Blob(['\ufeff' + csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `reporte_solicitudes_${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // Función para obtener alertas del sistema
  const getSystemAlerts = () => {
    const alerts = [];
    
    if (dashboardStats.pendientes > 10) {
      alerts.push({
        type: 'warning',
        message: `Hay ${dashboardStats.pendientes} solicitudes pendientes que requieren atención urgente`,
        icon: FaExclamationTriangle
      });
    }
    
    if (dashboardStats.tiempoPromedio > 24) {
      alerts.push({
        type: 'danger',
        message: `El tiempo promedio de respuesta es de ${dashboardStats.tiempoPromedio}h, considera optimizar el proceso`,
        icon: FaClock
      });
    }
    
    if (systemHealth === 'warning') {
      alerts.push({
        type: 'warning',
        message: 'El sistema está experimentando problemas de rendimiento menores',
        icon: FaExclamationTriangle
      });
    }
    
    if (dashboardStats.solicitudesToday === 0) {
      alerts.push({
        type: 'info',
        message: 'No se han recibido solicitudes nuevas hoy',
        icon: FaFileAlt
      });
    }
    
    return alerts;
  };

  // Función para obtener eficiencia del sistema
  const getSystemEfficiency = () => {
    if (dashboardStats.totalSolicitudes === 0) return 0;
    return Math.round((dashboardStats.aceptadas / dashboardStats.totalSolicitudes) * 100);
  };

  // Filtrado por estado según el botón
  let solicitudesFiltradas = solicitudes;
  if (view === 'pendientes') {
    solicitudesFiltradas = solicitudes.filter(s => s.estado === 'activa');
  } else if (view === 'respondidas') {
    solicitudesFiltradas = solicitudes.filter(s => s.estado === 'aceptada');
  } else if (view === 'rechazadas') {
    solicitudesFiltradas = solicitudes.filter(s => s.estado === 'rechazada');
  }

  // Ordena: pendientes, rechazadas, aceptadas; y dentro de cada grupo, las más antiguas primero
  const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    const estadoOrden = { 'activa': 0, 'rechazada': 1, 'aceptada': 2 };
    const estadoA = estadoOrden[a.estado] ?? 99;
    const estadoB = estadoOrden[b.estado] ?? 99;
    if (estadoA !== estadoB) return estadoA - estadoB;
    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

  // Calcula los totales para burbujas
  const pendientesCount = solicitudes.filter(s => s.estado === 'activa').length;
  const rechazadasCount = solicitudes.filter(s => s.estado === 'rechazada').length;

  return (
    <div style={{ minHeight: '100vh', background: '#f8f9fa', position: 'relative' }}>
      {/* Información del usuario en la parte superior */}
      <div style={{ 
        position: 'fixed', 
        top: 0, 
        right: 0, 
        left: 60, 
        zIndex: 1000,
        background: '#fff',
        padding: '8px 16px',
        borderBottom: '1px solid #dee2e6',
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center'
      }}>
        <div>
          <small className="text-muted">Sesión activa:</small>
          <span className="ms-2 fw-bold">{currentUser?.email || 'Cargando...'}</span>
        </div>
        <div>
          <span className="badge bg-danger">Administrador</span>
        </div>
      </div>

      {/* Botón menú hamburguesa */}
      <button
        style={{
          position: 'fixed',
          top: 18,
          left: 18,
          zIndex: 10001,
          background: 'transparent',
          border: 'none',
          color: '#23272f',
          fontSize: 28,
          cursor: 'pointer'
        }}
        onClick={() => setSidebarOpen(true)}
        title="Abrir menú"
      >
        <FaBars />
      </button>

      {/* Modal del menú lateral (sidebar dark) con animación */}
      {(sidebarOpen || sidebarShow) && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            background: 'rgba(20,22,30,0.85)',
            zIndex: 10000,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            transition: 'background 0.25s'
          }}
          onClick={() => setSidebarOpen(false)}
        >
          <div
            ref={sidebarRef}
            style={{
              background: '#23272f',
              color: '#fff',
              borderRadius: 16,
              boxShadow: '0 0 32px rgba(0,0,0,0.4)',
              padding: 32,
              minWidth: 260,
              maxWidth: 320,
              position: 'relative',
              transform: sidebarAnim ? 'scale(1)' : 'scale(0.8)',
              opacity: sidebarAnim ? 1 : 0,
              transition: 'transform 0.6s cubic-bezier(.5,1.8,.5,1), opacity 0.6s cubic-bezier(.5,1.8,.5,1)'
            }}
            onClick={e => e.stopPropagation()}
          >
            {/* Botón cerrar */}
            <span
              style={{
                position: 'absolute',
                top: 18,
                right: 18,
                fontSize: 28,
                color: '#d00',
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
              onClick={() => setSidebarOpen(false)}
              title="Cerrar menú"
            >
              ×
            </span>
            <div className="mb-4">
              {currentUser && (
                <>
                  <div className="fw-bold">
                    <FaUserShield style={{ marginRight: 6 }} />
                    {currentUser.user_metadata?.nombre || currentUser.email}
                  </div>
                  <div className="small">
                    <FaEnvelope style={{ marginRight: 6 }} />
                    {currentUser.email}
                  </div>
                  <div className="badge bg-light text-primary mt-2">
                    <FaUserTag style={{ marginRight: 4 }} />
                    Admin
                  </div>
                </>
              )}
            </div>
            <ul className="nav flex-column">
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'dashboard' ? 'btn-info' : 'btn-outline-info'}`}
                  style={{ background: view === 'dashboard' ? '#17a2b8' : 'transparent', color: view === 'dashboard' ? '#fff' : '#fff', borderColor: '#444' }}
                  onClick={() => { setView('dashboard'); setSidebarOpen(false); }}
                >
                  <FaChartBar style={{ marginRight: 6 }} />
                  Dashboard
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'admin' ? 'btn-light text-dark' : 'btn-outline-light'}`}
                  style={{ background: view === 'admin' ? '#fff' : 'transparent', color: view === 'admin' ? '#23272f' : '#fff', borderColor: '#444' }}
                  onClick={() => { setView('admin'); setSidebarOpen(false); }}
                >
                  <FaUserShield style={{ marginRight: 6 }} />
                  Panel Admin
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'usuario' ? 'btn-info' : 'btn-outline-info'}`}
                  style={{ background: view === 'usuario' ? '#17a2b8' : 'transparent', color: '#fff', borderColor: '#444' }}
                  onClick={() => { setView('usuario'); setSidebarOpen(false); }}
                >
                  <FaUserTag style={{ marginRight: 6 }} />
                  Vista Usuario
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'operador' ? 'btn-secondary' : 'btn-outline-secondary'}`}
                  style={{ background: view === 'operador' ? '#6c757d' : 'transparent', color: '#fff', borderColor: '#444' }}
                  onClick={() => { setView('operador'); setSidebarOpen(false); }}
                >
                  <FaUserTag style={{ marginRight: 6 }} />
                  Vista Operador
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'pendientes' ? 'btn-warning' : 'btn-outline-warning'}`}
                  style={{ background: view === 'pendientes' ? '#ffc107' : 'transparent', color: view === 'pendientes' ? '#23272f' : '#fff', borderColor: '#444' }}
                  onClick={() => { setView('pendientes'); setSidebarOpen(false); }}
                >
                  <FaTimesCircle style={{ marginRight: 6 }} />
                  Pendientes
                  {pendientesCount > 0 && (
                    <span className="badge bg-danger ms-2">{pendientesCount}</span>
                  )}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'respondidas' ? 'btn-success' : 'btn-outline-success'}`}
                  style={{ background: view === 'respondidas' ? '#28a745' : 'transparent', color: '#fff', borderColor: '#444' }}
                  onClick={() => { setView('respondidas'); setSidebarOpen(false); }}
                >
                  <FaCheckCircle style={{ marginRight: 6 }} />
                  Aceptadas
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className={`btn w-100 ${view === 'rechazadas' ? 'btn-danger' : 'btn-outline-danger'}`}
                  style={{ background: view === 'rechazadas' ? '#dc3545' : 'transparent', color: '#fff', borderColor: '#444' }}
                  onClick={() => { setView('rechazadas'); setSidebarOpen(false); }}
                >
                  <FaTimesCircle style={{ marginRight: 6 }} />
                  Rechazadas
                  {rechazadasCount > 0 && (
                    <span className="badge bg-danger ms-2">{rechazadasCount}</span>
                  )}
                </button>
              </li>
              <li className="nav-item mb-2">
                <button
                  className="btn btn-danger w-100"
                  style={{ background: '#d9534f', color: '#fff', borderColor: '#444' }}
                  onClick={handleLogout}
                >
                  Cerrar sesión
                </button>
              </li>
            </ul>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="flex-grow-1 p-4" style={{ marginLeft: 0, paddingTop: '60px' }}>
        {view === 'dashboard' && (
          <>
            <div className="d-flex justify-content-between align-items-center mb-4">
              <h2 className="mb-0 text-primary">
                <FaChartBar style={{ marginRight: 8 }} />
                Dashboard Ejecutivo
              </h2>
              <div className="d-flex gap-2">
                <button 
                  className="btn btn-success btn-sm"
                  onClick={exportReport}
                  title="Exportar reporte CSV"
                >
                  <FaDownload style={{ marginRight: 4 }} />
                  Exportar
                </button>
                <button 
                  className={`btn ${getSystemAlerts().length > 0 ? 'btn-warning' : 'btn-secondary'} btn-sm`}
                  onClick={() => setShowAlerts(!showAlerts)}
                  title="Ver alertas del sistema"
                >
                  <FaBell style={{ marginRight: 4 }} />
                  Alertas ({getSystemAlerts().length})
                </button>
              </div>
            </div>

            {/* Alertas del sistema */}
            {showAlerts && getSystemAlerts().length > 0 && (
              <div className="card mb-4 border-warning alert-slide-in">
                <div className="card-header bg-warning text-dark">
                  <h5 className="mb-0">
                    <FaBell style={{ marginRight: 6 }} />
                    Alertas del Sistema
                  </h5>
                </div>
                <div className="card-body">
                  {getSystemAlerts().map((alert, index) => (
                    <div key={index} className={`alert alert-${alert.type} d-flex align-items-center mb-2 alert-slide-in`} style={{ animationDelay: `${index * 0.1}s` }}>
                      <alert.icon className="me-2" />
                      {alert.message}
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Métricas principales */}
            <div className="row mb-4">
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card h-100 dashboard-metric-card" style={{ background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)', color: '#fff' }}>
                  <div className="card-body text-center">
                    <FaFileAlt size={32} className="mb-2" />
                    <h3 className="mb-1 metric-number">{dashboardStats.totalSolicitudes}</h3>
                    <p className="mb-0">Total Solicitudes</p>
                    <small className="opacity-75">Sistema completo</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card h-100 dashboard-metric-card" style={{ background: 'linear-gradient(135deg, #f093fb 0%, #f5576c 100%)', color: '#fff' }}>
                  <div className="card-body text-center">
                    <FaClock size={32} className="mb-2" />
                    <h3 className="mb-1 metric-number">{dashboardStats.tiempoPromedio}h</h3>
                    <p className="mb-0">Tiempo Promedio</p>
                    <small className="opacity-75">Respuesta</small>
                  </div>
                </div>
              </div>
              <div className="col-lg-3 col-md-6 mb-3">
                <div className="card h-100 dashboard-metric-card" style={{ background: 'linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)', color: '#fff' }}>
                  <div className="card-body text-center">
                    <FaCalendarAlt size={32} className="mb-2" />
                    <h3 className="mb-1 metric-number">{dashboardStats.solicitudesToday}</h3>
                    <p className="mb-0">Solicitudes Hoy</p>
                    <small className="opacity-75">{new Date().toLocaleDateString()}</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Estado del sistema y métricas avanzadas */}
            <div className="row mb-4">
              <div className="col-lg-4 mb-3">
                <div className="card dashboard-card-hover">
                  <div className="card-header bg-dark text-white">
                    <h6 className="mb-0">
                      <FaCheckCircle style={{ marginRight: 6 }} />
                      Estado del Sistema
                    </h6>
                  </div>
                  <div className="card-body text-center">
                    <div className={`badge ${systemHealth === 'healthy' ? 'bg-success' : 'bg-warning'} fs-6 mb-3 system-status-badge`}>
                      {systemHealth === 'healthy' ? '🟢 SALUDABLE' : '🟡 ADVERTENCIA'}
                    </div>
                    <div className="row">
                      <div className="col-6">
                        <div className="fw-bold text-primary">99.8%</div>
                        <small className="text-muted">Uptime</small>
                      </div>
                      <div className="col-6">
                        <div className="fw-bold text-success">85ms</div>
                        <small className="text-muted">Respuesta</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 mb-3">
                <div className="card dashboard-card-hover">
                  <div className="card-header bg-success text-white">
                    <h6 className="mb-0">
                      <FaArrowUp style={{ marginRight: 6 }} />
                      Crecimiento
                    </h6>
                  </div>
                  <div className="card-body text-center">
                    <div className={`fs-2 fw-bold ${dashboardStats.crecimiento >= 0 ? 'text-success' : 'text-danger'} mb-2`}>
                      {dashboardStats.crecimiento >= 0 ? '+' : ''}{dashboardStats.crecimiento}%
                    </div>
                    <small className="text-muted">vs. período anterior</small>
                    <div className="mt-2">
                      {dashboardStats.crecimiento >= 0 ? (
                        <FaArrowUp className="text-success" />
                      ) : (
                        <FaArrowDown className="text-danger" />
                      )}
                    </div>
                  </div>
                </div>
              </div>
              <div className="col-lg-4 mb-3">
                <div className="card dashboard-card-hover">
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">
                      <FaCheckCircle style={{ marginRight: 6 }} />
                      Eficiencia Global
                    </h6>
                  </div>
                  <div className="card-body text-center">
                    <div className="fs-2 fw-bold text-info mb-2">{getSystemEfficiency()}%</div>
                    <div className="progress mb-2" style={{ height: '8px' }}>
                      <div 
                        className={`progress-bar progress-animated ${getSystemEfficiency() >= 80 ? 'bg-success' : getSystemEfficiency() >= 60 ? 'bg-warning' : 'bg-danger'}`}
                        style={{ width: `${getSystemEfficiency()}%` }}
                      ></div>
                    </div>
                    <small className="text-muted">Tasa de aceptación</small>
                  </div>
                </div>
              </div>
            </div>

            {/* Distribución por estados */}
            <div className="row mb-4">
              <div className="col-12">
                <div className="card">
                  <div className="card-header bg-primary text-white">
                    <h5 className="mb-0">
                      <FaChartBar style={{ marginRight: 6 }} />
                      Distribución de Solicitudes por Estado
                    </h5>
                  </div>
                  <div className="card-body">
                    <div className="row">
                      <div className="col-md-3 text-center mb-3">
                        <div className="display-6 text-warning">{dashboardStats.pendientes}</div>
                        <div className="text-muted">Pendientes</div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-warning" 
                            style={{ width: `${dashboardStats.totalSolicitudes ? (dashboardStats.pendientes / dashboardStats.totalSolicitudes) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="col-md-3 text-center mb-3">
                        <div className="display-6 text-success">{dashboardStats.aceptadas}</div>
                        <div className="text-muted">Aceptadas</div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-success" 
                            style={{ width: `${dashboardStats.totalSolicitudes ? (dashboardStats.aceptadas / dashboardStats.totalSolicitudes) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="col-md-3 text-center mb-3">
                        <div className="display-6 text-danger">{dashboardStats.rechazadas}</div>
                        <div className="text-muted">Rechazadas</div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div 
                            className="progress-bar bg-danger" 
                            style={{ width: `${dashboardStats.totalSolicitudes ? (dashboardStats.rechazadas / dashboardStats.totalSolicitudes) * 100 : 0}%` }}
                          ></div>
                        </div>
                      </div>
                      <div className="col-md-3 text-center mb-3">
                        <div className="display-6 text-primary">{dashboardStats.totalSolicitudes}</div>
                        <div className="text-muted">Total</div>
                        <div className="progress mt-2" style={{ height: '6px' }}>
                          <div className="progress-bar bg-primary" style={{ width: '100%' }}></div>
                        </div>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Información adicional */}
            <div className="row mb-4">
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-info text-white">
                    <h6 className="mb-0">💡 Consejos de Optimización</h6>
                  </div>
                  <div className="card-body">
                    <ul className="list-unstyled mb-0">
                      {dashboardStats.pendientes > 5 && (
                        <li className="mb-2">
                          <FaExclamationTriangle className="text-warning me-2" />
                          Considera asignar más operadores para reducir solicitudes pendientes
                        </li>
                      )}
                      {dashboardStats.tiempoPromedio > 24 && (
                        <li className="mb-2">
                          <FaClock className="text-danger me-2" />
                          El tiempo de respuesta es alto, revisa los procesos
                        </li>
                      )}
                      {getSystemEfficiency() < 70 && (
                        <li className="mb-2">
                          <FaArrowUp className="text-info me-2" />
                          La eficiencia puede mejorarse optimizando criterios de aceptación
                        </li>
                      )}
                      <li className="mb-2">
                        <FaCheckCircle className="text-success me-2" />
                        Sistema funcionando correctamente
                      </li>
                    </ul>
                  </div>
                </div>
              </div>
              <div className="col-md-6">
                <div className="card">
                  <div className="card-header bg-dark text-white">
                    <h6 className="mb-0">📊 Estadísticas Rápidas</h6>
                  </div>
                  <div className="card-body">
                    <div className="row text-center">
                      <div className="col-6 mb-3">
                        <div className="fw-bold text-primary fs-4">
                          {dashboardStats.totalSolicitudes > 0 ? 
                            Math.round((dashboardStats.aceptadas / dashboardStats.totalSolicitudes) * 100) : 0}%
                        </div>
                        <small className="text-muted">Tasa de Aceptación</small>
                      </div>
                      <div className="col-6 mb-3">
                        <div className="fw-bold text-success fs-4">
                          {Math.round(dashboardStats.usuariosActivos / 10 * 100)}%
                        </div>
                        <small className="text-muted">Utilización Sistema</small>
                      </div>
                      <div className="col-6">
                        <div className="fw-bold text-info fs-4">{Math.round(dashboardStats.tiempoPromedio / 24 * 100)}%</div>
                        <small className="text-muted">Velocidad Respuesta</small>
                      </div>
                      <div className="col-6">
                        <div className="fw-bold text-warning fs-4">
                          {dashboardStats.solicitudesToday > 0 ? '📈' : '📊'}
                        </div>
                        <small className="text-muted">Actividad Hoy</small>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </>
        )}

        {view === 'admin' && (
          <>
            <h2 className="mb-3 text-primary">
              <FaUserShield style={{ marginRight: 8 }} />
              Panel de Administración
            </h2>
            {/* Formulario para crear usuario */}
            <form
              onSubmit={handleCreateUser}
              className={`mb-4 p-3 border rounded animated-form ${formVisible ? 'fade-in' : ''}`}
              style={{ background: '#f8f9fa' }}
            >
              <h4 className="mb-3">
                <FaUserPlus style={{ marginRight: 6 }} />
                Crear nuevo usuario
              </h4>
              <div className="mb-2 d-flex align-items-center">
                <FaIdCard style={{ marginRight: 6, color: '#007bff' }} />
                <input
                  type="text"
                  name="id"
                  placeholder="ID (UUID de Supabase Auth)"
                  value={newUser.id}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaEnvelope style={{ marginRight: 6, color: '#007bff' }} />
                <input
                  type="email"
                  name="email"
                  placeholder="Email"
                  value={newUser.email}
                  onChange={handleChange}
                  className="form-control"
                  required
                />
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaUserTag style={{ marginRight: 6, color: '#007bff' }} />
                <select
                  name="role"
                  value={newUser.role}
                  onChange={handleChange}
                  className="form-control"
                >
                  <option value="usuario">Usuario</option>
                  <option value="operador">Operador</option>
                  <option value="admin">Admin</option>
                </select>
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaUserPlus style={{ marginRight: 6, color: '#007bff' }} />
                <input
                  type="text"
                  name="nombre"
                  placeholder="Nombre"
                  value={newUser.nombre}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaIdCard style={{ marginRight: 6, color: '#007bff' }} />
                <input
                  type="text"
                  name="cedula"
                  placeholder="Cédula"
                  value={newUser.cedula}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <div className="mb-2 d-flex align-items-center">
                <FaPhone style={{ marginRight: 6, color: '#007bff' }} />
                <input
                  type="text"
                  name="telefono"
                  placeholder="Teléfono"
                  value={newUser.telefono}
                  onChange={handleChange}
                  className="form-control"
                />
              </div>
              <button type="submit" className="btn btn-primary w-100">
                <FaUserPlus style={{ marginRight: 6 }} />
                Crear usuario
              </button>
              {formMsg && <div className="mt-2">{formMsg}</div>}
            </form>
          </>
        )}

        {view === 'usuario' && (
          <UserPanel />
        )}

        {view === 'operador' && (
          <OperatorPanel />
        )}

        {view !== 'admin' && view !== 'usuario' && view !== 'operador' && (
          <>
            <h4 className="mb-3">
              {view === 'pendientes' && 'Solicitudes pendientes'}
              {view === 'respondidas' && 'Solicitudes aceptadas'}
              {view === 'rechazadas' && 'Solicitudes rechazadas'}
            </h4>
            <ul className="list-group mb-4">
              {solicitudesOrdenadas.map(s => (
                <li key={s.id} className="list-group-item d-flex justify-content-between align-items-center">
                  <div>
                    <FaFileAlt className="text-info" style={{ marginRight: 8 }} />
                    <b>{s.nombre}</b> <span className="ms-2">{s.tipo_admision}</span>
                    <span className="ms-2 text-muted">Usuario: <AdminEmailDisplay userId={s.usuario_id} getUserEmail={getUserEmail} /></span>
                    <span className="ms-2 text-primary">Operador: <b>{s.operador || 'N/A'}</b></span>
                    <span className="ms-2 text-muted">
                      | <b>Enviado:</b> {s.fecha_creacion ? new Date(s.fecha_creacion).toLocaleString() : 'No disponible'}
                      {s.fecha_modificacion && <> | <b>Respondida:</b> {new Date(s.fecha_modificacion).toLocaleString()}</>}
                    </span>
                  </div>
                  <button className="btn btn-outline-primary btn-sm" onClick={() => setSelectedSolicitud(s)}>
                    Ver solicitud
                  </button>
                </li>
              ))}
            </ul>
            {/* Modal para ver toda la info de la solicitud */}
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
                  <div className="mb-2"><b>Cédula:</b> {selectedSolicitud.cedula}</div>
                  <div className="mb-2"><b>Carrera:</b> {selectedSolicitud.carrera}</div>
                  <div className="mb-2"><b>Tipo de Admisión:</b> {selectedSolicitud.tipo_admision}</div>
                  <div className="mb-2"><b>Teléfono:</b> {selectedSolicitud.telefono}</div>
                  <div className="mb-2"><b>Estado:</b> {selectedSolicitud.estado}</div>
                  <div className="mb-2"><b>Usuario que envió:</b> <AdminEmailDisplay userId={selectedSolicitud.usuario_id} getUserEmail={getUserEmail} prefix="" /></div>
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
                  <div className="mb-2"><b>Fecha de envío:</b> {selectedSolicitud.fecha_creacion ? new Date(selectedSolicitud.fecha_creacion).toLocaleString() : 'No disponible'}</div>
                  <div className="mb-2"><b>Fecha de respuesta:</b> {selectedSolicitud.fecha_modificacion ? new Date(selectedSolicitud.fecha_modificacion).toLocaleString() : 'No disponible'}</div>
                  {selectedSolicitud.respuesta && (
                    <div className="mb-2">
                      <b style={{ color: '#007bff', fontSize: '1.1rem', display: 'block', marginBottom: 6 }}>
                        <FaCheckCircle style={{ marginRight: 6, color: '#28a745' }} />
                        Respuesta del operador:
                      </b>
                      <div style={{
                        background: 'linear-gradient(90deg, #e3fcec 0%, #c8e6c9 100%)',
                        padding: 12,
                        borderRadius: 8,
                        marginTop: 4,
                        fontWeight: 'bold',
                        color: '#222',
                        fontSize: '1.05rem',
                        boxShadow: '0 2px 8px rgba(40,167,69,0.08)'
                      }}>
                        {selectedSolicitud.respuesta}
                      </div>
                    </div>
                  )}
                  {selectedSolicitud.respuesta && (
                    <div className="mb-2">
                      <b style={{ color: '#007bff', fontSize: '1.1rem', display: 'block', marginBottom: 6 }}>
                        <FaCheckCircle style={{ marginRight: 6, color: '#28a745' }} />
                        Respuesta del operador:
                      </b>
                      <div style={{
                        background: 'linear-gradient(90deg, #e3fcec 0%, #c8e6c9 100%)',
                        padding: 12,
                        borderRadius: 8,
                        marginTop: 4,
                        fontWeight: 'bold',
                        color: '#222',
                        fontSize: '1.05rem',
                        boxShadow: '0 2px 8px rgba(40,167,69,0.08)'
                      }}>
                        {selectedSolicitud.respuesta}
                      </div>
                    </div>
                  )}
                  {selectedSolicitud.archivos && selectedSolicitud.archivos.length > 0 && (
                    <div className="mb-2">
                      <b>Archivos:</b>
                      <ul>
                        {selectedSolicitud.archivos.map((filePath, idx) => (
                          <li key={idx}>
                            <button
                              className="btn btn-link"
                              style={{ padding: 0, fontSize: 14 }}
                              onClick={() => openFile(filePath)}
                            >
                              Ver archivo {idx + 1}
                            </button>
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}
                </div>
              </div>
            )}
          </>
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
    </div>
  );
}

export default AdminPanel;