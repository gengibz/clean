const { getConnection } = require('../config/db');

// Convierte hr2 tipo 1800 a "18:00:00"
function convertirHr2aHora(hr2) {
  if (!hr2 || hr2 <= 0) return null;
  const str = hr2.toString().padStart(4, '0');
  return `${str.slice(0, 2)}:${str.slice(2, 4)}:00`;
}

exports.listarVehiculos = async (req, res) => {
  try {
    const pool = await getConnection();
    const fechaParam = req.query.fecha;
    const fechaBase = fechaParam ? new Date(fechaParam) : new Date();
    const yyyy = fechaBase.getFullYear();
    const mm = String(fechaBase.getMonth() + 1).padStart(2, '0');
    const dd = String(fechaBase.getDate()).padStart(2, '0');
    const fechaHoy = `${yyyy}-${mm}-${dd}`;

    const fechaMananaBase = new Date(fechaBase);
    fechaMananaBase.setDate(fechaBase.getDate() + 1);
    const yyyyM = fechaMananaBase.getFullYear();
    const mmM = String(fechaMananaBase.getMonth() + 1).padStart(2, '0');
    const ddM = String(fechaMananaBase.getDate()).padStart(2, '0');
    const fechaManana = `${yyyyM}-${mmM}-${ddM}`;

    const result = await pool.request().query(`
      SELECT 
        vhi.mat AS matricula,
        abh.stt AS inicio,
        abh.typ AS tipo,
        abh.hr1 AS hr1,
        abh.hr2 AS hr2,
        abh.fin AS fin,
        cho.nom AS conductor,
        CONVERT(DATE, abh.fec) AS fecha
      FROM abh
      JOIN vhi ON vhi.ind = abh.vhi
      LEFT JOIN cho ON cho.ind = abh.cho
      WHERE vhi.mat LIKE 'L%'
        AND (CONVERT(DATE, abh.fec) = '${fechaHoy}' OR CONVERT(DATE, abh.fec) = '${fechaManana}')
      ORDER BY vhi.mat, abh.fec, abh.stt
    `);

    const data = result.recordset.map(row => {
      const finRealHora = row.tipo === 5 && row.hr2 > 0
        ? convertirHr2aHora(row.hr2)
        : row.fin;

      const fechaStr = new Date(row.fecha).toISOString().slice(0, 10);

      let finCompletoISO;
      if (finRealHora && /^\d{2}:\d{2}:\d{2}$/.test(finRealHora)) {
        finCompletoISO = new Date(`${fechaStr}T${finRealHora}`);
      } else if (row.fin && !isNaN(new Date(row.fin))) {
        finCompletoISO = new Date(row.fin);
      } else {
        finCompletoISO = new Date(new Date(row.inicio).getTime() + 60000); // fallback
      }

      return { ...row, fin: finRealHora, finCompletoISO };
    });

    const agrupado = {};
    data.forEach(row => {
      const mat = row.matricula.trim();
      const fechaStr = new Date(row.fecha).toISOString().slice(0, 10);
      if (!agrupado[mat]) agrupado[mat] = { hoy: [], manana: [] };
      if (fechaStr === fechaHoy) agrupado[mat].hoy.push(row);
      else if (fechaStr === fechaManana) agrupado[mat].manana.push(row);
    });

    const resultadoFinal = Object.keys(agrupado).map(mat => {
      const hoyServicios = agrupado[mat].hoy;
      const mananaServicios = agrupado[mat].manana;

      const hoyServiciosCopiaParaPrimero = [...hoyServicios];
      const hoyServiciosCopiaParaUltimo = [...hoyServicios];
      const mananaServiciosCopia = [...mananaServicios];

      hoyServiciosCopiaParaPrimero.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
      const primerHoy = hoyServiciosCopiaParaPrimero.length > 0 ? hoyServiciosCopiaParaPrimero[0] : null;

      hoyServiciosCopiaParaUltimo.sort((a, b) => b.finCompletoISO - a.finCompletoISO);
      const ultimoHoy = hoyServiciosCopiaParaUltimo.length > 0 ? hoyServiciosCopiaParaUltimo[0] : null;

      mananaServiciosCopia.sort((a, b) => new Date(a.inicio) - new Date(b.inicio));
      const primeroManana = mananaServiciosCopia.length > 0 ? mananaServiciosCopia[0] : null;

      return {
        matricula: mat,
        primerServicioHoy: primerHoy,
        ultimoServicioHoy: ultimoHoy,
        primerServicioManana: primeroManana
      };
    });

    // Ordenar por el número después de la L
    resultadoFinal.sort((a, b) => {
      const numA = parseInt(a.matricula.replace(/\D/g, '')) || 0;
      const numB = parseInt(b.matricula.replace(/\D/g, '')) || 0;
      return numA - numB;
    });

    res.json(resultadoFinal);
  } catch (err) {
    res.status(500).json({ error: err.message });
  }
};
