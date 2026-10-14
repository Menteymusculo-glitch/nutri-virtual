export const metadata = {
  title: 'Política de Privacidad | Mente y Músculo',
  description: 'Cómo recopilamos, usamos y protegemos tus datos personales en la plataforma Mente y Músculo.',
}

export default function PrivacidadPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'system-ui, sans-serif', color: '#2d3748', lineHeight: 1.7 }}>

      {/* Header */}
      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>MENTE Y MÚSCULO</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Política de Privacidad</h1>
        <p style={{ color: '#718096', fontSize: 14 }}>Última actualización: octubre 2026</p>
      </div>

      <p>
        En <strong>Mente y Músculo</strong> (Ray Viloria, operado en Venezuela y con servicios digitales
        accesibles a nivel internacional) respetamos tu privacidad y nos comprometemos a proteger los
        datos personales que compartes con nosotros. Esta política explica qué información recopilamos,
        con qué finalidad, cómo la protegemos y cuáles son tus derechos.
      </p>

      {/* ─── SECCIÓN 1 ─── */}
      <h2 id="recopilacion" style={h2}>1. Información que recopilamos</h2>
      <p>Recopilamos únicamente los datos necesarios para prestarte los servicios:</p>
      <ul style={ul}>
        <li><strong>Datos de cuenta:</strong> nombre, dirección de correo electrónico y contraseña (almacenada cifrada).</li>
        <li><strong>Datos de pago:</strong> gestionados íntegramente por Stripe o GoHighLevel. Nunca almacenamos números de tarjeta ni datos bancarios en nuestros servidores.</li>
        <li><strong>Datos de salud y físicos:</strong> peso, altura, porcentaje de grasa, objetivo, condición hormonal, alergias e intolerancias, que introduces voluntariamente para recibir planes personalizados.</li>
        <li><strong>Datos de contacto para leads:</strong> nombre, correo y teléfono (WhatsApp), cuando completas formularios de captación como la Calculadora de Grasa Corporal.</li>
        <li><strong>Datos de uso:</strong> herramientas utilizadas, fecha y plan contratado (para estadísticas internas y mejora del servicio).</li>
      </ul>

      {/* ─── SECCIÓN 2 ─── */}
      <h2 id="finalidades" style={h2}>2. Finalidades del tratamiento</h2>
      <ul style={ul}>
        <li>Generarte y entregarte tu plan de alimentación personalizado.</li>
        <li>Enviarte tu diagnóstico de identidad y materiales de seguimiento.</li>
        <li>Gestionar tu suscripción, acceso y facturación.</li>
        <li>Comunicarnos contigo por correo y WhatsApp con contenido relevante, ofertas y actualizaciones del programa (solo si has dado tu consentimiento).</li>
        <li>Mejorar nuestras herramientas y detectar problemas técnicos.</li>
      </ul>

      {/* ─── SECCIÓN 3 ─── */}
      <h2 id="alumnas" style={h2}>3. Tratamiento de datos de alumnas activas</h2>
      <p>
        Como alumna activa de <strong>M&amp;M Training Club</strong>, <strong>Premium</strong> o{' '}
        <strong>Gym Virtual</strong>, tienes acceso a las herramientas de IA de la plataforma. A
        continuación se describen las actividades de tratamiento que afectan específicamente a tu
        relación como alumna.
      </p>

      <h3 style={h3}>3.1 Nutri Virtual — Plan de alimentación IA</h3>
      <p>
        Al usar <em>Nutri Virtual</em> introduces datos de salud (peso, talla, porcentaje de grasa,
        condición hormonal, alergias) que se envían a un modelo de lenguaje (actualmente Groq /
        Qwen 3.8-27B) alojado en servidores de terceros en EE.UU. El modelo genera tu plan; los
        datos no se utilizan para entrenar el modelo ni se comparten con terceros para fines
        comerciales. El plan resultante se almacena asociado a tu cuenta para que puedas consultarlo
        desde tu dashboard.
      </p>
      <p>
        <strong>Base jurídica:</strong> consentimiento explícito al generar el plan y, donde aplique,
        artículo 9 RGPD (datos de salud tratados con fines de asistencia preventiva o de bienestar).
      </p>

      <h3 style={h3}>3.2 Motor de Identidad — Diagnóstico IA</h3>
      <p>
        Al completar el <em>Motor de Identidad</em> introduces información sobre tus metas, emociones,
        estado vital y visión de vida. Estos datos se envían al mismo modelo de IA para generar tu
        diagnóstico. Se almacenan en nuestra base de datos (Supabase, servidores en la UE) vinculados
        a tu cuenta.
      </p>
      <p>
        <strong>Base jurídica:</strong> consentimiento al iniciar la herramienta.
      </p>

      <h3 style={h3}>3.3 Historial Profundo · Onboarding M&amp;M</h3>
      <p>
        El formulario <em>«Historial Profundo · Onboarding M&amp;M»</em> recoge información detallada
        de salud y estilo de vida: historial médico, condiciones crónicas, historial de hábitos
        alimenticios, bienestar emocional y objetivos de transformación. Esta información es analizada
        por los asistentes de IA de la plataforma (<strong>Alfred</strong> y <strong>Vera</strong>) para
        personalizar tu experiencia de coaching desde el primer día.
      </p>
      <ul style={ul}>
        <li>Los datos se almacenan cifrados en nuestra base de datos y solo son accesibles por Ray Viloria y el equipo de coaches con acceso autorizado.</li>
        <li>No se comparten con terceros para fines publicitarios ni comerciales.</li>
        <li>Se envían al modelo de IA exclusivamente para generar recomendaciones personalizadas para ti.</li>
        <li>Puedes solicitar la eliminación de tu historial en cualquier momento (ver sección 7).</li>
      </ul>
      <p>
        <strong>Base jurídica:</strong> consentimiento explícito prestado al inicio del formulario de
        onboarding. Sin ese consentimiento, el formulario no puede completarse.
      </p>

      {/* ─── SECCIÓN 4 ─── */}
      <h2 id="compartir" style={h2}>4. Compartición con terceros</h2>
      <p>Solo compartimos datos con terceros en los siguientes supuestos:</p>
      <ul style={ul}>
        <li><strong>Stripe:</strong> procesamiento de pagos. Sujeto a su propia política de privacidad.</li>
        <li><strong>GoHighLevel / DAX Engine:</strong> CRM y automatización de comunicaciones. Almacena tu nombre, correo y teléfono para gestionar el acceso y enviarte comunicaciones si has dado consentimiento.</li>
        <li><strong>Groq (LLM):</strong> los datos de salud y personales que introduces en las herramientas de IA se procesan en su infraestructura. Groq declara no usar los datos de las llamadas API para entrenar modelos.</li>
        <li><strong>Supabase:</strong> base de datos en la nube (servidores en la UE) donde se almacenan tus datos de cuenta, planes y diagnósticos.</li>
        <li><strong>Vercel:</strong> infraestructura de hosting de la plataforma web.</li>
      </ul>
      <p>No vendemos ni cedemos tus datos a terceros para fines publicitarios.</p>

      {/* ─── SECCIÓN 5 ─── */}
      <h2 id="retencion" style={h2}>5. Retención de datos</h2>
      <ul style={ul}>
        <li>Datos de cuenta: mientras la cuenta esté activa + 2 años tras la baja.</li>
        <li>Planes nutricionales y diagnósticos: 2 años desde su generación.</li>
        <li>Historial de onboarding: hasta que lo solicites eliminar o 2 años desde la última actividad.</li>
        <li>Leads (calculadora, quiz): 1 año desde la captación.</li>
        <li>Datos de facturación: según obligaciones legales (mínimo 5 años).</li>
      </ul>

      {/* ─── SECCIÓN 6 ─── */}
      <h2 id="seguridad" style={h2}>6. Seguridad</h2>
      <p>
        Aplicamos medidas técnicas y organizativas razonables: conexiones cifradas (HTTPS/TLS),
        contraseñas almacenadas con hash (Supabase Auth), acceso a la base de datos restringido
        por clave de servicio (no expuesta al cliente), y control de acceso por roles dentro de la
        plataforma.
      </p>

      {/* ─── SECCIÓN 7 ─── */}
      <h2 id="derechos" style={h2}>7. Tus derechos</h2>
      <p>Puedes ejercer en cualquier momento los siguientes derechos:</p>
      <ul style={ul}>
        <li><strong>Acceso:</strong> solicitar qué datos tenemos sobre ti.</li>
        <li><strong>Rectificación:</strong> corregir datos incorrectos.</li>
        <li><strong>Supresión:</strong> solicitar la eliminación de tu cuenta y datos asociados.</li>
        <li><strong>Portabilidad:</strong> recibir tus datos en formato exportable.</li>
        <li><strong>Retirada del consentimiento:</strong> puedes retirar tu consentimiento para comunicaciones comerciales en cualquier momento (enlace de baja en cada correo).</li>
      </ul>
      <p>
        Para ejercer cualquiera de estos derechos escribe a{' '}
        <a href="mailto:ray@menteymusculo.com" style={{ color: '#E05C1C' }}>ray@menteymusculo.com</a>{' '}
        con el asunto «Privacidad — [tu nombre]». Responderemos en un plazo máximo de 30 días.
      </p>

      {/* ─── SECCIÓN 8 ─── */}
      <h2 id="cookies" style={h2}>8. Cookies y almacenamiento local</h2>
      <p>
        La plataforma utiliza cookies de sesión necesarias para mantenerte autenticado (gestionadas
        por Supabase Auth). No utilizamos cookies de rastreo publicitario ni de terceros. El navegador
        puede almacenar preferencias de interfaz en <code>localStorage</code> únicamente para tu
        comodidad.
      </p>

      {/* ─── SECCIÓN 9 ─── */}
      <h2 id="cambios" style={h2}>9. Cambios en esta política</h2>
      <p>
        Podemos actualizar esta política cuando sea necesario. Los cambios significativos se
        comunicarán por correo electrónico con al menos 15 días de antelación. La versión vigente
        siempre estará disponible en esta página con su fecha de actualización.
      </p>

      {/* Footer */}
      <div style={{ marginTop: 56, paddingTop: 24, borderTop: '1px solid #e2e8f0', textAlign: 'center' }}>
        <p style={{ fontSize: 13, color: '#a0aec0' }}>
          © {new Date().getFullYear()} Mente y Músculo · Ray Viloria ·{' '}
          <a href="mailto:ray@menteymusculo.com" style={{ color: '#a0aec0' }}>ray@menteymusculo.com</a>
        </p>
      </div>
    </main>
  )
}

const h2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 700,
  color: '#1a202c',
  marginTop: 40,
  marginBottom: 12,
  paddingBottom: 6,
  borderBottom: '2px solid #fed7aa',
}

const h3: React.CSSProperties = {
  fontSize: 16,
  fontWeight: 700,
  color: '#2d3748',
  marginTop: 24,
  marginBottom: 8,
}

const ul: React.CSSProperties = {
  paddingLeft: 20,
  marginBottom: 12,
}
