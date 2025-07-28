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

const carreras = [
  { codigo: '103020', nombre: 'LIC. EN ING. AGR TROP MAN R. REN' },
  { codigo: '19701', nombre: 'LIC. EN INGENIERIA AGRICOLA' },
  { codigo: '649701', nombre: 'LIC. EN INGENIERIA FITOTECNISTA' },
  { codigo: '730602', nombre: 'LIC. EN INGENIERIA FORESTAL(NUE)' },
  { codigo: '770201', nombre: 'LIC. INGENIERO AGRONOMO ZOOTECNISTA' },
  { codigo: '117071', nombre: 'LICENCIATURA EN ING. AGROINDUSTRIAL' },
  { codigo: '718801', nombre: 'LICENCIATURA EN INGENIERIA AGRONOMICA' },
  { codigo: '128091', nombre: 'PRG DESC. DE LIC. EN ING. DEL MEDIO AMB.' },
  { codigo: '102040', nombre: 'PROGRAMA COMPLEMENTACION ING. FORESTA' },
  { codigo: '730001', nombre: 'PROGRAMA LIC. EN INGENIERIA FORESTAL' },
  { codigo: '709701', nombre: 'TEC. SUPERIOR EN MECANIZACION AGRICOLA' },
  { codigo: '135121', nombre: 'TEC. UNIV. SUP. GES. TERR. DES. END. SUS' },
  { codigo: '49001', nombre: 'LICENCIATURA EN BIOQUIMICA Y FARMACIA' },
  { codigo: '109401', nombre: 'LIC. EN ADMINISTRACION DE EMPRESAS' },
  { codigo: '89801', nombre: 'LICENCIATURA EN CONTADURIA PUBLICA' },
  { codigo: '59801', nombre: 'LICENCIATURA EN ECONOMIA' },
  { codigo: '125091', nombre: 'LICENCIATURA EN INGENIERIA COMERCIAL' },
  { codigo: '126091', nombre: 'LICENCIATURA EN INGENIERIA FINANCIERA' },
  { codigo: '132091', nombre: 'LIC. EN PROD. AGRARIA Y DES. TERRITORIAL' },
  { codigo: '163211', nombre: 'PROG LIC EN ING EN GEST DE REC HID. AGRO' },
  { codigo: '119071', nombre: 'PROG. COM. LIC. DESARR. RURAL SOSTENIBLE' },
  { codigo: '169231', nombre: 'PROG. LIC. EN INGENIERIA EN PISCICULTURA' },
  { codigo: '168201', nombre: 'TECNICO SUPERIOR EN AGRONOMIA' },
  { codigo: '179901', nombre: 'LIC. EN ODONTOLOGIA (PLAN NUEVO)' },
  { codigo: '129091', nombre: 'LIC. EN FISIOTERAPIA Y KINESIOLOGIA' },
  { codigo: '188301', nombre: 'LICENCIATURA EN MEDICINA' },
  { codigo: '133011', nombre: 'LICENCIATURA EN NUTRICION Y DIETETICA' },
  { codigo: '118071', nombre: 'PROG DE COMPL EN LIC FISIOTERAPIA Y KINE' },
  { codigo: '156151', nombre: 'LIC. EN DIS. INTERIORES Y DEL MOBILIARIO' },
  { codigo: '122081', nombre: 'LIC. EN DISEÑO GRAF Y COMUNIC VISUAL' },
  { codigo: '127091', nombre: 'LIC. EN PLANIF. DEL TERR. Y MED. AMB' },
  { codigo: '202002', nombre: 'LICENCIATURA EN ARQUITECTURA' },
  { codigo: '231802', nombre: 'LICENCIATURA EN TURISMO' },
  { codigo: '161191', nombre: 'PR. TEC. UNIV. MED. ETNOTURISMO COMUNIT.' },
  { codigo: '229801', nombre: 'TECNICO UNIV. SUPERIOR EN CONSTRUCCIONES' },
  { codigo: '269301', nombre: 'LIC. EN LINGUIS. APLIC.ENSEÑANZA LENGUAS' },
  { codigo: '251302', nombre: 'LICENCIATURA EN CIENCIAS DE LA EDUCACION' },
  { codigo: '258301', nombre: 'LICENCIATURA EN CIENCIAS DE LA EDUCACION' },
  { codigo: '140502', nombre: 'LICENCIATURA EN COMUNICACION SOCIAL(NUE)' },
  { codigo: '240101', nombre: 'LICENCIATURA EN PSICOLOGIA (NUE)' },
  { codigo: '108061', nombre: 'LICENCIATURA EN TRABAJO SOCIAL' },
  { codigo: '168231', nombre: 'PROG TEC SUP. EN EDUC. INFANT PARVULARIO' },
  { codigo: '124081', nombre: 'PROG. LIC. EN PEDAGOGIA SOCIAL PRODUCTI' },
  { codigo: '147141', nombre: 'PROG. LIC. EN CS. ACT. FISICA Y DEPORTE' },
  { codigo: '153141', nombre: 'PROG. LIC. ESP. EN CIEN. SOC. E INTERCUL' },
  { codigo: '152141', nombre: 'PROG. LIC. ESP. EN LENG. ORIG. Y COMUNIC' },
  { codigo: '145141', nombre: 'PROGRAMA DE LICENCIATURA EN MUSICA' },
  { codigo: '690602', nombre: 'PROGRAMA LIC. ESP. ED. INTERCUL.BILINGUE' },
  { codigo: '279901', nombre: 'LICENCIATURA EN CIENCIAS JURIDICAS' },
  { codigo: '280101', nombre: 'LICENCIATURA EN CIENCIAS POLITICAS (NUE)' },
  { codigo: '114071', nombre: 'LICENCIATURA DIDACTICA MATEMATICA' },
  { codigo: '399501', nombre: 'LICENCIATURA EN BIOLOGIA' },
  { codigo: '760101', nombre: 'LICENCIATURA EN DIDACTICA DE LA FISICA' },
  { codigo: '359201', nombre: 'LICENCIATURA EN FISICA' },
  { codigo: '650001', nombre: 'LICENCIATURA EN ING. ELECTROMECANICA' },
  { codigo: '320902', nombre: 'LICENCIATURA EN INGENIERIA CIVIL (NUEVO)' },
  { codigo: '409701', nombre: 'LICENCIATURA EN INGENIERIA DE ALIMENTOS' },
  { codigo: '411702', nombre: 'LICENCIATURA EN INGENIERIA DE SISTEMAS' },
  { codigo: '419701', nombre: 'LICENCIATURA EN INGENIERIA DE SISTEMAS' },
  { codigo: '299701', nombre: 'LICENCIATURA EN INGENIERIA ELECTRICA' },
  { codigo: '429701', nombre: 'LICENCIATURA EN INGENIERIA ELECTRONICA' },
  { codigo: '309801', nombre: 'LICENCIATURA EN INGENIERIA INDUSTRIAL' },
  { codigo: '134111', nombre: 'LICENCIATURA EN INGENIERIA INFORMATICA' },
  { codigo: '439801', nombre: 'LICENCIATURA EN INGENIERIA MATEMATICA' },
  { codigo: '319801', nombre: 'LICENCIATURA EN INGENIERIA MECANICA' },
  { codigo: '339701', nombre: 'LICENCIATURA EN INGENIERIA QUIMICA' },
  { codigo: '349701', nombre: 'LICENCIATURA EN MATEMATICAS' },
  { codigo: '389701', nombre: 'LICENCIATURA EN QUIMICA' },
  { codigo: '170241', nombre: 'PROG DESC DE TEC UNIV SUP EN GASTRONOMIA' },
  { codigo: '165221', nombre: 'PROGRAMA DE INGENIERIA EN BIOTECNOLOGIA' },
  { codigo: '166231', nombre: 'PROGRAMA LIC. EN INGENIERIA EN ENERGIA' },
  { codigo: '590602', nombre: 'AUXILIAR TECNICO EN ENFERMERIA' },
  { codigo: '131091', nombre: 'LIC. EN ING. MEC. AUTOMOT. Y MAQ. AGROIN' },
  { codigo: '146131', nombre: 'PRG. COMP. LIC. ING. MEC. AUT. Y MAQ. AG' },
  { codigo: '146142', nombre: 'PRG. COMP. LIC. ING. MEC. AUT. Y MAQ. AG' },
  { codigo: '123081', nombre: 'PRG. TEC. MED. EN GEST MUN Y DES END SOS' },
  { codigo: '155162', nombre: 'TEC. UNIV. MEDIO EN ENFERMERIA (NUEVO)' },
  { codigo: '569201', nombre: 'TEC.UNIV. SUP. EN INDUSTRIA DE ALIMENTOS' },
  { codigo: '720101', nombre: 'TEC.UNIV.SUP. EN MECANICA AUTOMOTRIZ' },
  { codigo: '589401', nombre: 'TEC.UNIV.SUP. EN CONSTRUCCION CIVIL' },
  { codigo: '489201', nombre: 'TEC.UNIV.SUP. EN MECANICA INDUSTRIAL' },
  { codigo: '529801', nombre: 'TEC.UNIV.SUP. EN QUIMICA INDUSTRIAL' },
  { codigo: '150802', nombre: 'LICENCIATURA EN SOCIOLOGIA' },
  { codigo: '142131', nombre: 'PROGRAMA DE LICENCIATURA EN ANTROPOLOGIA' },
  { codigo: '164221', nombre: 'PROGRAMA DE LICENCIATURA EN HISTORIA' },
  { codigo: '149141', nombre: 'PROG. DE LIC. EN INGENIERIA AMBIENTAL' },
  { codigo: '150141', nombre: 'PROG. DE LIC. EN INGENIERIA PETROQUIMICA' },
  { codigo: '144131', nombre: 'PROG. DE LICENCIATURA EN COMUNICACION' },
  { codigo: '158161', nombre: 'PROG. DE LICENCIATURA EN ENFERMERIA' },
  { codigo: '148141', nombre: 'PROG. LIC. EN ADMINISTRACION DE EMPRESAS' },
  { codigo: '159161', nombre: 'PROG. LICENCIATURA EN PEDAGOGIA SOCIAL' },
  { codigo: '138131', nombre: 'PROGRAMA DE LIC. EN ENFERMERIA OBSTETRIZ' },
  { codigo: '136121', nombre: 'PROGRAMA DE LIC. EN INGENIERIA AMBIENTAL' },
  { codigo: '162211', nombre: 'PROG. LICENCIATURA EN CONTADURIA PUBLICA' },
  { codigo: '141131', nombre: 'PROGRAMA DE LIC. EN ENFERMERIA OBSTETRIZ' },
  { codigo: '143131', nombre: 'PROG. LIC. EN GEST. DES. ENDOG Y AGROEC' },
  { codigo: '39503', nombre: 'LIC. EN MEDICINA VETERINARIA Y ZOOTECNIA' },
  { codigo: '171241', nombre: 'PROG. DESC DE T.U.S. EN VET. Y ZOOTECNIA' },
  { codigo: '157161', nombre: 'PROG. DE LIC. EN INGENIERIA AGROFORESTAL' },
  { codigo: '154141', nombre: 'PROG. LIC. EN ING. REC. HIDRICOS AGROPEC' },
  { codigo: '151141', nombre: 'PROGRAMA LICENCIATURA EN CONSTRUCCIONES' },
  { codigo: '130091', nombre: 'LICENCIATURA EN ENFERMERIA' },
  { codigo: '190602', nombre: 'LICENCIATURA EN ENFERMERIA(NUE)' },
  { codigo: '167231', nombre: 'PROG. DESC. TUM ENFERMERIA COMUNITARIA' }
];

function UserPanel() {
  const [solicitudes, setSolicitudes] = useState([]);
  const [currentUser, setCurrentUser] = useState(null);
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

  // Función para obtener el email del usuario por ID
  const getUserEmail = async (userId) => {
    try {
      const { data, error } = await supabase.auth.admin.getUserById(userId);
      if (error) {
        console.error('Error al obtener usuario:', error);
        return userId; // Fallback al ID si no se puede obtener el email
      }
      return data.user?.email || userId;
    } catch (error) {
      console.error('Error al obtener email del usuario:', error);
      return userId; // Fallback al ID
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
      setMsg('Error al abrir el archivo.');
    }
  };

  useEffect(() => {
    setFormVisible(true);
    const getUser = async () => {
      const { data } = await supabase.auth.getUser();
      setCurrentUser(data.user);
    };
    getUser();
    
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
      {/* Información del usuario en la parte superior */}
      <div className="mb-3 p-2 bg-light rounded d-flex justify-content-between align-items-center">
        <div>
          <small className="text-muted">Sesión activa:</small>
          <span className="ms-2 fw-bold">{currentUser?.email || 'Cargando...'}</span>
        </div>
        <div>
          <span className="badge bg-primary">Usuario</span>
        </div>
      </div>

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
        <select
          name="carrera"
          value={form.carrera}
          onChange={handleChange}
          className="form-control mb-2"
          required
        >
          <option value="">Selecciona tu carrera</option>
          {carreras.map(carrera => (
            <option key={carrera.codigo} value={`${carrera.codigo} - ${carrera.nombre}`}>
              {carrera.codigo} - {carrera.nombre}
            </option>
          ))}
        </select>
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
            <div className="mb-2">
              <small className="text-muted">Enviado por:</small>
              <span className="ms-2 fw-bold">{currentUser?.email || 'Usuario'}</span>
            </div>
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