import React, { useEffect, useState, useRef } from 'react';
import { supabase } from '../../supabaseClient';
import { FaUser, FaFileAlt, FaEye, FaCheckCircle, FaTimesCircle } from 'react-icons/fa';

const tiposAdmision = [
  'Ingreso Directo RR',
  'Traspaso de Universidad',
  'Admision Especial',
  'Estudio simultaneo',
  'Cambio de Carrera Plan Antiguo',
  'Otros'
];

function UserPanel() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [form, setForm] = useState({
    nombre: '',
    cedula: '',
    tipo_admision: '',
    carrera: '',
    telefono: '',
    descripcion: ''
  });
  const [archivos, setArchivos] = useState([]);
  const [loading, setLoading] = useState(true);
  const [msg, setMsg] = useState('');
  const [popup, setPopup] = useState({
    visible: false,
    success: true,
    info: null,
    message: ''
  });
  const [formVisible, setFormVisible] = useState(false);
  const [archivoPopup, setArchivoPopup] = useState({ visible: false, url: '', tipo: '' });
  const [selectedSolicitud, setSelectedSolicitud] = useState(null);
  const [search, setSearch] = useState('');
  const [estadoFiltro, setEstadoFiltro] = useState('todos');

  const fileInputRef = useRef();

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
      setMsg('Error al abrir el archivo.');
    }
  };

  useEffect(() => {
    setFormVisible(true);
    const fetchSolicitudes = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) {
        // Si no hay usuario, podrías redirigir al login
        // window.location.href = '/login';
        return;
      }
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('usuario_id', userId);
      if (!error) setSolicitudes(data || []);
      setLoading(false);
    };
    fetchSolicitudes();
  }, []);

  // Polling solo para la lista de solicitudes
  useEffect(() => {
    let intervalId;
    const fetchSolicitudes = async () => {
      const { data: userData } = await supabase.auth.getUser();
      const userId = userData?.user?.id;
      if (!userId) return;
      const { data, error } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('usuario_id', userId);
      if (!error) setSolicitudes(data || []);
    };
    fetchSolicitudes(); // carga inicial

    intervalId = setInterval(fetchSolicitudes, 5000); // actualiza cada 5 segundos

    return () => clearInterval(intervalId); // limpia el intervalo al desmontar
  }, []);

  const validateFiles = (files) => {
    for (let file of files) {
      const isImage = ['image/jpeg', 'image/png'].includes(file.type);
      const isPdf = file.type === 'application/pdf';
      if (isImage && file.size > 2 * 1024 * 1024) return false;
      if (isPdf && file.size > 5 * 1024 * 1024) return false;
      if (!isImage && !isPdf) return false;
    }
    return true;
  };

  const handleDrop = (e) => {
    e.preventDefault();
    const files = Array.from(e.dataTransfer.files);
    if (!validateFiles(files)) {
      setMsg('Archivo inválido. Imágenes máx 2MB, PDFs máx 5MB.');
      return;
    }
    setArchivos(prev => [...prev, ...files]);
    setMsg('');
  };

  const handleDragOver = (e) => {
    e.preventDefault();
  };

  const handleFileChange = (e) => {
    const files = Array.from(e.target.files);
    if (!validateFiles(files)) {
      setMsg('Archivo inválido. Imágenes máx 2MB, PDFs máx 5MB.');
      return;
    }
    setArchivos(prev => [...prev, ...files]);
    setMsg('');
  };

  const handleRemoveFile = (idx) => {
    setArchivos(archivos.filter((_, i) => i !== idx));
  };

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleClosePopup = () => {
    setPopup({ ...popup, visible: false });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setMsg('Enviando...');
    const { data: userData } = await supabase.auth.getUser();
    const userId = userData?.user?.id;
    if (!userId) return;

    // Validación de campos
    if (
      !form.nombre || !form.cedula || !form.tipo_admision ||
      !form.carrera || !form.telefono || !form.descripcion
    ) {
      setPopup({
        visible: true,
        success: false,
        info: { ...form },
        message: 'Debes llenar todos los campos requeridos.'
      });
      setMsg('');
      return;
    }

    // Subir archivos y guardar solo las rutas
    let archivosPaths = [];
    for (let file of archivos) {
      const cleanFileName = file.name.replace(/[^a-zA-Z0-9._-]/g, '_');
      const filePath = `${userId}/${Date.now()}_${cleanFileName}`;
      const { error: uploadError } = await supabase.storage
        .from('solicitudes')
        .upload(filePath, file);

      if (uploadError) {
        console.log(uploadError);
        setPopup({
          visible: true,
          success: false,
          info: { ...form },
          message: 'Error al subir archivos.'
        });
        setMsg('');
        return;
      }

      // Guardamos solo la ruta del archivo, no la URL firmada
      archivosPaths.push(filePath);
    }

    // Insertar solicitud
    const { error } = await supabase
      .from('solicitudes')
      .insert([{
        usuario_id: userId,
        nombre: form.nombre,
        cedula: form.cedula,
        tipo_admision: form.tipo_admision,
        carrera: form.carrera,
        telefono: form.telefono,
        descripcion: form.descripcion,
        archivos: archivosPaths, // Guardamos las rutas, no las URLs
        estado: 'activa',
        fecha_creacion: new Date().toISOString(),
        fecha_modificacion: null
      }]);

    if (error) {
      console.log(error);
      // Mostrar mensaje de error en pop-up 
      setPopup({
        visible: true,
        success: false,
        info: { ...form },
        message: 'Error al crear solicitud.'
      });
      setMsg('');
    } else {
      setPopup({
        visible: true,
        success: true,
        info: { ...form },
        message: 'Solicitud enviada correctamente.'
      });
      setForm({
        nombre: '',
        cedula: '',
        tipo_admision: '',
        carrera: '',
        telefono: '',
        descripcion: ''
      });
      setArchivos([]);
      setMsg('');
      // Opcional: recargar solicitudes
      setLoading(true);
      const { data } = await supabase
        .from('solicitudes')
        .select('*')
        .eq('usuario_id', userId);
      setSolicitudes(data || []);
      setLoading(false);
    }
  };

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

  const solicitudesOrdenadas = [...solicitudesFiltradas].sort((a, b) => {
    // Orden por estado: pendiente (activa) -> rechazada -> aceptada
    const estadoOrden = { 'activa': 0, 'rechazada': 1, 'aceptada': 2 };
    const estadoA = estadoOrden[a.estado] ?? 99;
    const estadoB = estadoOrden[b.estado] ?? 99;
    if (estadoA !== estadoB) return estadoA - estadoB;
    // Si es el mismo estado, ordena por fecha_creacion (más antigua primero)
    return new Date(a.fecha_creacion) - new Date(b.fecha_creacion);
  });

  // Calcula los totales para burbujas
  const pendientesCount = solicitudes.filter(s => s.estado === 'activa').length;
  const rechazadasCount = solicitudes.filter(s => s.estado === 'rechazada').length;

  return (
    <div>
      <h2 className="mb-3 text-primary">
        <FaUser style={{ marginRight: 8 }} />
        Panel de Usuario
      </h2>
      <p>Bienvenido, aquí podrás ver tus datos y crear solicitudes.</p>

      {/* Pop-up personalizado */}
      {popup.visible && (
        <div className="popup-solicitud-custom">
          <div style={{ textAlign: 'center', marginBottom: 12 }}>
            {popup.success ? (
              <span style={{
                fontSize: 48,
                color: 'green',
                display: 'inline-block',
                marginBottom: 8
              }}>✔️</span>
            ) : (
              <span style={{
                fontSize: 48,
                color: 'red',
                display: 'inline-block',
                marginBottom: 8
              }}>❌</span>
            )}
          </div>
          <div style={{ marginBottom: 8, fontWeight: 'bold', fontSize: '1.1rem' }}>
            {popup.message}
          </div>
          {popup.info && (
            <div style={{ marginBottom: 12, fontSize: '1rem', color: '#222' }}>
              <div><b>Nombre:</b> {popup.info.nombre}</div>
              <div><b>Carrera:</b> {popup.info.carrera}</div>
              <div><b>Cédula:</b> {popup.info.cedula}</div>
              <div><b>Tipo de Admisión:</b> {popup.info.tipo_admision}</div>
            </div>
          )}
          <button
            className="btn btn-primary w-100"
            onClick={handleClosePopup}
            style={{ marginTop: 8 }}
          >
            Aceptar
          </button>
        </div>
      )}

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

      <form
        onSubmit={handleSubmit}
        className={`mb-4 p-3 border rounded animated-form ${formVisible ? 'fade-in' : ''}`}
      >
        <input
          type="text"
          name="nombre"
          placeholder="Nombre"
          value={form.nombre}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />
        <input
          type="text"
          name="cedula"
          placeholder="Cédula de Identidad"
          value={form.cedula}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />
        <select
          name="tipo_admision"
          value={form.tipo_admision}
          onChange={handleChange}
          className="form-control mb-2"
          required
        >
          <option value="">Tipo de Admisión</option>
          {tiposAdmision.map(tipo => (
            <option key={tipo} value={tipo}>{tipo}</option>
          ))}
        </select>
        <input
          type="text"
          name="carrera"
          placeholder="Carrera"
          value={form.carrera}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />
        <input
          type="text"
          name="telefono"
          placeholder="N° de Teléfono"
          value={form.telefono}
          onChange={e => {
            let value = e.target.value;
            // Si no empieza con +591, lo añade automáticamente
            if (!value.startsWith('+591')) {
              value = '+591' + value.replace(/^\+?591?/, '');
            }
            setForm({ ...form, telefono: value });
          }}
          className="form-control mb-2"
          required
        />
        <textarea
          name="descripcion"
          placeholder="Describe tu solicitud"
          value={form.descripcion}
          onChange={handleChange}
          className="form-control mb-2"
          required
        />

        {/* Drag and drop area */}
        <div
          className="mb-2 p-3 border border-info rounded"
          style={{ background: '#f8f9fa', textAlign: 'center', cursor: 'pointer' }}
          onDrop={handleDrop}
          onDragOver={handleDragOver}
          onClick={() => fileInputRef.current.click()}
        >
          Arrastra aquí tus archivos o haz click para seleccionar
          <input
            type="file"
            multiple
            accept=".jpg,.jpeg,.png,.pdf"
            onChange={handleFileChange}
            style={{ display: 'none' }}
            ref={fileInputRef}
          />
        </div>
        {/* Previews tipo carrete con animación */}
        <div className="mb-2" style={{ display: 'flex', overflowX: 'auto', gap: '12px' }}>
          {archivos.map((file, idx) => (
            <div key={idx} className="carrete-item" style={{ position: 'relative', minWidth: 70, maxWidth: 120 }}>
              <span
                style={{
                  position: 'absolute',
                  top: 2,
                  right: 2,
                  background: 'rgba(0,0,0,0.6)',
                  color: 'white',
                  borderRadius: '50%',
                  width: 20,
                  height: 20,
                  textAlign: 'center',
                  cursor: 'pointer',
                  zIndex: 2,
                  fontSize: 16,
                  lineHeight: '20px'
                }}
                onClick={() => handleRemoveFile(idx)}
                title="Eliminar archivo"
              >
                ×
              </span>
              {file.type.startsWith('image/') ? (
                <img
                  src={URL.createObjectURL(file)}
                  alt={file.name}
                  style={{
                    width: 70,
                    height: 70,
                    objectFit: 'cover',
                    borderRadius: 8,
                    boxShadow: '0 2px 8px rgba(0,0,0,0.1)'
                  }}
                />
              ) : (
                <div
                  style={{
                    width: 70,
                    height: 70,
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    background: '#eee',
                    borderRadius: 8,
                    fontSize: 24,
                    fontWeight: 'bold'
                  }}
                >
                  PDF
                </div>
              )}
              <div style={{
                fontSize: 12,
                textAlign: 'center',
                marginTop: 4,
                wordBreak: 'break-all'
              }}>
                {file.name}
              </div>
            </div>
          ))}
        </div>

        <button type="submit" className="btn btn-primary">Enviar solicitud</button>
        {msg && <div className="mt-2">{msg}</div>}
      </form>

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

      {/* Filtro por estado */}
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

      <h4 className="mt-4">Tus solicitudes</h4>
      {loading ? (
        <p>Cargando...</p>
      ) : (
        <ul className="list-group mb-4">
          {solicitudesOrdenadas.map((s, i) => (
            <li key={s.id || i} className="list-group-item d-flex justify-content-between align-items-center">
              <div>
                <FaFileAlt className="text-info" style={{ marginRight: 8, fontSize: 22 }} />
                <b>{s.nombre}</b>
                <span className="ms-2" style={{ fontSize: 13 }}>
                  {s.tipo_admision}
                </span>
                <span className="ms-2" style={{ fontSize: 13 }}>
                  {s.estado === 'aceptada' && <span className="text-success"><FaCheckCircle /> Aceptada</span>}
                  {s.estado === 'rechazada' && <span className="text-danger"><FaTimesCircle /> Rechazada</span>}
                  {s.estado !== 'aceptada' && s.estado !== 'rechazada' && <span className="text-warning"><FaTimesCircle /> Pendiente</span>}
                </span>
                <span className="ms-2 text-muted" style={{ fontSize: 12 }}>
                  {/* Fecha de envío */}
                  {s.fecha_creacion && (
                    <>| <b>Enviado:</b> {new Date(s.fecha_creacion).toLocaleString()}</>
                  )}
                  {/* Fecha de modificación */}
                  {s.fecha_modificacion && (
                    <> | <b>Respondida:</b> {new Date(s.fecha_modificacion).toLocaleString()}</>
                  )}
                </span>
              </div>
              <button
                className="btn btn-outline-primary btn-sm"
                onClick={() => setSelectedSolicitud(s)}
              >
                <FaEye style={{ marginRight: 4 }} />
                Ver solicitud
              </button>
            </li>
          ))}
        </ul>
      )}

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
            <h4 className="mb-2 text-info">
              <FaFileAlt style={{ marginRight: 6 }} />
              Solicitud de {selectedSolicitud.nombre}
            </h4>
            <div className="mb-2"><b>Cédula:</b> {selectedSolicitud.cedula}</div>
            <div className="mb-2"><b>Carrera:</b> {selectedSolicitud.carrera}</div>
            <div className="mb-2"><b>Tipo de Admisión:</b> {selectedSolicitud.tipo_admision}</div>
            <div className="mb-2"><b>Teléfono:</b> {selectedSolicitud.telefono}</div>
            <div className="mb-2"><b>Estado:</b> {selectedSolicitud.estado}</div>
            <div className="mb-2"><b>Descripción:</b> {selectedSolicitud.descripcion}</div>
            <div className="mb-2"><b>Fecha de envío:</b> {selectedSolicitud.fecha_creacion ? new Date(selectedSolicitud.fecha_creacion).toLocaleString() : 'No disponible'}</div>
            <div className="mb-2"><b>Fecha de respuesta:</b> {selectedSolicitud.fecha_modificacion ? new Date(selectedSolicitud.fecha_modificacion).toLocaleString() : 'No disponible'}</div>
            {/* Mostrar respuesta del operador si existe */}
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

      <button
        className="btn btn-danger mb-3"
        onClick={async () => {
          await supabase.auth.signOut();
          window.location.href = '/login';
        }}
      >
        Cerrar sesión
      </button>

      {/* Footer de derechos reservados */}
      <footer className="mt-5 pt-4 border-top text-center">
        <p className="text-muted mb-0">
          © 2025 CarlonchoDevApp - Todos los derechos reservados
        </p>
      </footer>
    </div>
  );
}

export default UserPanel;