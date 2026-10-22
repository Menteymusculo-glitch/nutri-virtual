// BORRADOR: texto pendiente de revisión por un asesor legal antes de darlo por definitivo.
export const metadata = {
  title: 'Fuentes de datos nutricionales | Mente y Músculo',
  description: 'De dónde salen los valores nutricionales del registro de comidas de Mente y Músculo y bajo qué licencias se usan.',
}

export default function FuentesPage() {
  return (
    <main style={{ maxWidth: 760, margin: '0 auto', padding: '48px 24px 80px', fontFamily: 'system-ui, sans-serif', color: '#2d3748', lineHeight: 1.7 }}>

      <div style={{ textAlign: 'center', marginBottom: 40 }}>
        <p style={{ fontSize: 13, fontWeight: 700, letterSpacing: 3, color: '#aaa', textTransform: 'uppercase', marginBottom: 8 }}>MENTE Y MÚSCULO</p>
        <h1 style={{ fontSize: 32, fontWeight: 800, color: '#1a202c', marginBottom: 8 }}>Fuentes de datos nutricionales</h1>
        <p style={{ color: '#718096', fontSize: 14 }}>Última actualización: octubre 2026</p>
      </div>

      <p>
        Los valores de calorías, proteínas, carbohidratos, grasas y fibra que ves en el registro de
        comidas proceden de las fuentes que se indican abajo. Todos se expresan por cada 100 g de
        porción comestible. Son valores de referencia: el contenido real de un alimento varía según
        la variedad, la marca y la forma de prepararlo.
      </p>

      <h2 style={h2}>1. USDA FoodData Central</h2>
      <p>
        La mayoría de los alimentos (los que no llevan la etiqueta «estimación») proceden de{' '}
        <strong>FoodData Central</strong>, la base de datos del Departamento de Agricultura de los
        Estados Unidos, en concreto de sus conjuntos <em>SR Legacy</em> y <em>Foundation Foods</em>.
      </p>
      <ul style={ul}>
        <li>
          <strong>Licencia:</strong> dominio público, publicada bajo{' '}
          <a href="https://creativecommons.org/publicdomain/zero/1.0/deed.es" style={link} target="_blank" rel="noopener noreferrer">CC0 1.0 Universal</a>.
        </li>
        <li>
          <strong>Cita:</strong> U.S. Department of Agriculture, Agricultural Research Service.
          FoodData Central. <a href="https://fdc.nal.usda.gov/" style={link} target="_blank" rel="noopener noreferrer">fdc.nal.usda.gov</a>.
        </li>
        <li>
          Los nombres en español, los sinónimos regionales y las porciones caseras traducidas son
          elaboración propia de Mente y Músculo. El USDA no ha revisado ni respalda esta aplicación.
        </li>
      </ul>

      <h2 style={h2}>2. Estimaciones propias</h2>
      <p>
        Algunos platos y productos no existen en FoodData Central (por ejemplo, la cachapa, el
        tequeño, la hallaca o la tortilla española). Para ellos mostramos una{' '}
        <strong>estimación</strong>: o bien se calcula a partir de una receta tipo con ingredientes de
        FoodData Central, o bien es un valor aproximado. En la aplicación aparecen con la etiqueta
        «estimación» y están en revisión.
      </p>

      <h2 style={h2}>3. Datos de la aplicación</h2>
      <p>
        Un número reducido de valores procede de la tabla de alimentos propia de Mente y Músculo,
        utilizada en la calculadora de macros.
      </p>

      <h2 style={h2}>4. Fuentes que no utilizamos</h2>
      <p>
        No incorporamos datos de tablas o publicaciones protegidas por derechos de autor sin
        permiso. Si en el futuro añadimos otras fuentes (por ejemplo, bases de datos de productos
        envasados con licencia abierta), las indicaremos en esta página con su licencia y su
        atribución.
      </p>

      <h2 style={h2}>5. Aviso</h2>
      <p>
        La información nutricional se ofrece con fines educativos y de seguimiento personal. No
        sustituye el consejo de un profesional de la salud. Si tienes una condición médica, te
        invito a consultar con tu médico o nutricionista.
      </p>
      <p>
        ¿Ves un valor que parece incorrecto? Escríbenos a{' '}
        <a href="mailto:soporte@menteymusculo.com" style={link}>soporte@menteymusculo.com</a> y lo revisamos.
      </p>
    </main>
  )
}

const h2: React.CSSProperties = {
  fontSize: 20,
  fontWeight: 800,
  color: '#1a202c',
  marginTop: 36,
  marginBottom: 12,
  paddingBottom: 6,
  borderBottom: '2px solid #fed7aa',
}

const ul: React.CSSProperties = {
  paddingLeft: 20,
  marginBottom: 12,
}

const link: React.CSSProperties = {
  color: '#c05621',
}
