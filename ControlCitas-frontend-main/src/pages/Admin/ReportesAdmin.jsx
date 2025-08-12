import React, { useEffect, useState, useRef } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import jsPDF from "jspdf";
import autoTable from "jspdf-autotable";
import logo from "../../assets/logo_clinica_blanco.png";

const ReportesAdmin = () => {
	// HU12
	const [fechaInicio, setFechaInicio] = useState("");
	const [fechaFin, setFechaFin] = useState("");
	const [reporteCitas, setReporteCitas] = useState([]);
	const [reporteCitasLoading, setReporteCitasLoading] = useState(false);

	// HU13
	const [medicos, setMedicos] = useState([]);
	const [medicoSeleccionado, setMedicoSeleccionado] = useState("");
	const [reporteMedico, setReporteMedico] = useState([]);
	const [reporteMedicoResumen, setReporteMedicoResumen] = useState(null);
	const [fechaInicioMedico, setFechaInicioMedico] = useState("");
	const [fechaFinMedico, setFechaFinMedico] = useState("");
	const [mostrarDesglose, setMostrarDesglose] = useState(false);

	// HU14
	const [reporteEspecialidad, setReporteEspecialidad] = useState([]);
	const [fechaInicioEsp, setFechaInicioEsp] = useState("");
	const [fechaFinEsp, setFechaFinEsp] = useState("");
	const [graficoData, setGraficoData] = useState([]);

	// HU15
	const [busquedaPaciente, setBusquedaPaciente] = useState("");
	const [pacientes, setPacientes] = useState([]);
	const [pacienteSeleccionado, setPacienteSeleccionado] = useState("");
	const [historialCitas, setHistorialCitas] = useState([]);
	const [ordenHistorial, setOrdenHistorial] = useState("desc");
	const [filtroEstado, setFiltroEstado] = useState("");

	const formatearFecha = (fechaStr) => {
		if (!fechaStr) return "";
		const fecha = new Date(fechaStr);
		const dia = String(fecha.getDate()).padStart(2, "0");
		const mes = String(fecha.getMonth() + 1).padStart(2, "0");
		const anio = fecha.getFullYear();
		return `${dia}/${mes}/${anio}`;
	};

	// Estado para vista previa de PDF
	const [pdfPreview, setPdfPreview] = useState(null);
	const iframeRef = useRef();

	// Declara la variable de entorno para la URL
	const apiUrl = import.meta.env.VITE_API_URL;

	// Cargar médicos y pacientes al inicio
	// useEffect(() => {
	// 	axios
	// 		.get(`${apiUrl}/api/admin/medicos`)
	// 		.then((res) => setMedicos(res.data))
	// 		.catch(() => setMedicos([]));
	// 	axios
	// 		.get(`${apiUrl}/api/admin/pacientes`)
	// 		.then((res) => setPacientes(res.data))
	// 		.catch(() => setPacientes([]));
	// }, []);


	useEffect(() => {
		axios.get("http://localhost:5000/api/admin/medicos")
			.then(res => setMedicos(res.data))
			.catch(() => setMedicos([]));
	}, []);

	// Inicializa fechas al mes actual
	useEffect(() => {
		const hoy = new Date();
		const yyyy = hoy.getFullYear();
		const mm = String(hoy.getMonth() + 1).padStart(2, "0");
		const dd = String(hoy.getDate()).padStart(2, "0");
		setFechaInicio(`${yyyy}-${mm}-01`);
		setFechaFin(`${yyyy}-${mm}-${dd}`);
		setFechaInicioMedico(`${yyyy}-${mm}-01`);
		setFechaFinMedico(`${yyyy}-${mm}-${dd}`);
		setFechaInicioEsp(`${yyyy}-${mm}-01`);
		setFechaFinEsp(`${yyyy}-${mm}-${dd}`);
	}, []);

	// HU12 - Reporte de citas por fecha
	const generarReporteCitas = async () => {
		if (!fechaInicio || !fechaFin) {
			Swal.fire("Error", "Debes seleccionar ambas fechas.", "error");
			return;
		}
		if (fechaInicio > fechaFin) {
			Swal.fire(
				"Error",
				"La fecha de inicio no puede ser posterior a la fecha de fin.",
				"error"
			);
			return;
		}
		setReporteCitasLoading(true);
		try {
			const res = await axios.get(`${apiUrl}/api/admin/reporte-citas-fecha`, {
				params: { fechaInicio, fechaFin },
			});
			setReporteCitas(res.data);
		} catch {
			setReporteCitas([]);
		}
		setReporteCitasLoading(false);
	};

	// Utilidad para generar PDF y mostrar preview
	const showPdfPreview = (generateDocFn, filename) => {
		const doc = generateDocFn();
		const pdfBlob = doc.output("blob");
		const url = URL.createObjectURL(pdfBlob);
		setPdfPreview({ url, filename });
	};

	// HU12
	const exportarCitasPDF = (preview = false) => {
		const doc = new jsPDF();
		doc.addImage(logo, "PNG", 10, 8, 18, 18);
		doc.setFontSize(16);
		doc.text("Clínica Johnson - Reporte de Citas", 32, 18);
		doc.setFontSize(11);
		doc.text(`Rango: ${fechaInicio} a ${fechaFin}`, 32, 26);
		doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 32, 32);
		autoTable(doc, {
			startY: 38,
			head: [["Paciente", "Médico", "Especialidad", "Fecha", "Hora", "Estado"]],
			body: reporteCitas.map((c) => [
				c.paciente,
				c.medico,
				c.especialidad,
				formatearFecha(c.fecha_cita),
				c.hora_cita,
				c.estado === 0
					? "Pendiente"
					: c.estado === 1
						? "Finalizada"
						: c.estado === 2
							? "Cancelada por paciente"
							: c.estado === 3
								? "Cancelada por médico"
								: "Desconocido",
			]),
		});
		if (preview) return doc;
		doc.save("reporte_citas.pdf");
	};

	// HU13 - Reporte de citas por médico
	const generarReporteMedico = async () => {
		if (!medicoSeleccionado || !fechaInicioMedico || !fechaFinMedico) {
			Swal.fire("Error", "Selecciona médico y rango de fechas.", "error");
			return;
		}
		if (fechaInicioMedico > fechaFinMedico) {
			Swal.fire(
				"Error",
				"La fecha de inicio no puede ser posterior a la fecha de fin.",
				"error"
			);
			return;
		}
		try {
			const res = await axios.get(`${apiUrl}/api/admin/reporte-citas-medico`, {
				params: {
					id_medico: medicoSeleccionado,
					fechaInicio: fechaInicioMedico,
					fechaFin: fechaFinMedico,
					desglose: mostrarDesglose ? 1 : 0,
				},
			});
			setReporteMedico(res.data.citas || []);
			setReporteMedicoResumen(res.data.resumen || null);
		} catch {
			setReporteMedico([]);
			setReporteMedicoResumen(null);
		}
	};

	const exportarMedicoPDF = (preview = false) => {
		const medico = medicos.find(
			(m) => m.id_medico === parseInt(medicoSeleccionado)
		);
		const doc = new jsPDF();
		doc.addImage(logo, "PNG", 10, 8, 18, 18);
		doc.setFontSize(16);
		doc.text("Clínica Johnson - Reporte de Citas por Médico", 32, 18);
		doc.setFontSize(11);
		doc.text(`Médico: ${medico?.nombres} ${medico?.apellidos}`, 32, 26);
		doc.text(`Rango: ${fechaInicioMedico} a ${fechaFinMedico}`, 32, 32);
		doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 32, 38);
		if (reporteMedicoResumen) {
			doc.text(
				`Atendidas: ${reporteMedicoResumen.atendidas}  Canceladas: ${reporteMedicoResumen.canceladas}  Pendientes: ${reporteMedicoResumen.pendientes}`,
				14,
				46
			);
		}
		let startY = 52;
		if (mostrarDesglose && reporteMedico.length > 0) {
			autoTable(doc, {
				startY,
				head: [["Fecha", "Hora", "Paciente", "Estado"]],
				body: reporteMedico.map((c) => [formatearFecha(c.fecha_cita), c.hora_cita, c.paciente, c.estado === 0
					? "Pendiente"
					: c.estado === 1
						? "Finalizada"
						: c.estado === 2
							? "Cancelada por paciente"
							: c.estado === 3
								? "Cancelada por médico"
								: "Desconocido"]),
			});
		}
		if (preview) return doc;
		doc.save("reporte_citas_medico.pdf");
	};

	// HU14 - Reporte de citas por especialidad
	const generarReporteEspecialidad = async () => {
		if (!fechaInicioEsp || !fechaFinEsp) {
			Swal.fire("Error", "Selecciona el rango de fechas.", "error");
			return;
		}
		if (fechaInicioEsp > fechaFinEsp) {
			Swal.fire(
				"Error",
				"La fecha de inicio no puede ser posterior a la fecha de fin.",
				"error"
			);
			return;
		}
		try {
			const res = await axios.get(
				`${apiUrl}/api/admin/reporte-citas-especialidad`,
				{
					params: { fechaInicio: fechaInicioEsp, fechaFin: fechaFinEsp },
				}
			);
			setReporteEspecialidad(res.data.tabla || []);
			setGraficoData(res.data.grafico || []);
		} catch {
			setReporteEspecialidad([]);
			setGraficoData([]);
		}
	};

	const exportarEspecialidadPDF = (preview = false) => {
		const doc = new jsPDF();
		doc.addImage(logo, "PNG", 10, 8, 18, 18);
		doc.setFontSize(16);
		doc.text("Clínica Johnson - Reporte de Citas por Especialidad", 32, 18);
		doc.setFontSize(11);
		doc.text(`Rango: ${fechaInicioEsp} a ${fechaFinEsp}`, 32, 26);
		doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 32, 32);
		autoTable(doc, {
			startY: 38,
			head: [["Especialidad", "Total Citas", "Porcentaje"]],
			body: reporteEspecialidad.map((e) => [
				e.especialidad,
				e.total,
				`${e.porcentaje}%`,
			]),
		});
		if (preview) return doc;
		doc.save("reporte_citas_especialidad.pdf");
	};

	// HU15 - Historial de citas de paciente
	const buscarPacientes = async (valor) => {
		setBusquedaPaciente(valor);
		if (valor.length < 2) {
			setPacientes([]);
			return;
		}
		try {
			const res = await axios.get(`${apiUrl}/api/admin/buscar-pacientes`, {
				params: { q: valor },
			});
			setPacientes(res.data);
		} catch {
			setPacientes([]);
		}
	};

	const cargarHistorialPaciente = async () => {
		if (!pacienteSeleccionado) {
			Swal.fire("Error", "Selecciona un paciente.", "error");
			return;
		}
		try {
			const res = await axios.get(
				`${apiUrl}/api/admin/historial-citas-paciente`,
				{
					params: {
						id_paciente: pacienteSeleccionado,
						orden: ordenHistorial,
						estado: filtroEstado,
					},
				}
			);
			setHistorialCitas(res.data);
		} catch {
			setHistorialCitas([]);
		}
	};

	const exportarHistorialPDF = (preview = false) => {
		const paciente = pacientes.find(
			(p) => p.id_paciente === parseInt(pacienteSeleccionado)
		);
		const doc = new jsPDF();
		doc.addImage(logo, "PNG", 10, 8, 18, 18);
		doc.setFontSize(16);
		doc.text("Clínica Johnson - Historial de Citas de Paciente", 32, 18);
		doc.setFontSize(11);
		doc.text(
			`Paciente: ${paciente?.nombres} ${paciente?.apellidos} (${paciente?.num_identificacion || ""
			})`,
			32,
			26
		);
		doc.text(`Fecha de generación: ${new Date().toLocaleString()}`, 32, 32);
		autoTable(doc, {
			startY: 38,
			head: [["Fecha", "Hora", "Médico", "Especialidad", "Estado", "Motivo"]],
			body: historialCitas.map((c) => [
				c.fecha_cita,
				c.hora_cita,
				c.medico,
				c.especialidad,
				c.estado === 0
					? "Pendiente"
					: c.estado === 1
						? "Finalizada"
						: c.estado === 2
							? "Cancelada por paciente"
							: c.estado === 3
								? "Cancelada por médico"
								: c.estado,
				c.motivo || "",
			]),
		});
		if (preview) return doc;
		doc.save("historial_citas_paciente.pdf");
	};

	// Cerrar preview
	const cerrarPreview = () => {
		if (pdfPreview?.url) URL.revokeObjectURL(pdfPreview.url);
		setPdfPreview(null);
	};

	// Gráfico de barras simple (HU14)
	const renderBarChart = () => {
		if (!graficoData.length) return null;
		const max = Math.max(...graficoData.map((e) => e.total));
		return (
			<div style={{ width: "100%", margin: "20px 0" }}>
				{graficoData.map((e, i) => (
					<div
						key={i}
						style={{ marginBottom: 8 }}
					>
						<div className="d-flex justify-content-between">
							<span style={{ fontWeight: 500 }}>{e.especialidad}</span>
							<span>
								{e.total} ({e.porcentaje}%)
							</span>
						</div>
						<div
							style={{
								background: "#e3eafc",
								borderRadius: 6,
								height: 18,
								width: "100%",
								marginTop: 2,
								marginBottom: 2,
								overflow: "hidden",
							}}
						>
							<div
								style={{
									background: "#2e5da1",
									width: `${(e.total / max) * 100}%`,
									height: "100%",
									borderRadius: 6,
								}}
							></div>
						</div>
					</div>
				))}
			</div>
		);
	};

	return (
		<div className="mt-4">
			{/* Preview PDF Modal */}
			{pdfPreview && (
				<div
					style={{
						position: "fixed",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						background: "rgba(0,0,0,0.4)",
						zIndex: 9999,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<div
						style={{
							background: "#fff",
							borderRadius: 12,
							padding: 16,
							maxWidth: "90vw",
							maxHeight: "90vh",
							boxShadow: "0 4px 24px 0 rgba(46,93,161,0.15)",
							position: "relative",
						}}
					>
						<button
							className="btn btn-danger position-absolute"
							style={{ top: 10, right: 10, zIndex: 2 }}
							onClick={cerrarPreview}
						>
							Cerrar
						</button>
						<iframe
							ref={iframeRef}
							src={pdfPreview.url}
							title="Vista previa PDF"
							style={{ width: "70vw", height: "80vh", border: "none" }}
						/>
						<div className="text-center mt-2">
							<a
								href={pdfPreview.url}
								download={pdfPreview.filename}
								className="btn btn-primary"
							>
								Descargar PDF
							</a>
						</div>
					</div>
				</div>
			)}

			<div className="shadow p-4 rounded my-5">
				{/* HU12 - Reporte de Citas por Fecha */}
				<section className="mb-5">
					<h4
						className="fw-bold"
						style={{ color: "#2e5da1" }}
					>
						Reporte de Citas por Fecha
					</h4>
					<div className="row g-2 align-items-end mb-2">
						<div className="col-md-3">
							<label className="form-label">Fecha inicio</label>
							<input
								type="date"
								className="form-control"
								value={fechaInicio}
								onChange={(e) => setFechaInicio(e.target.value)}
							/>
						</div>
						<div className="col-md-3">
							<label className="form-label">Fecha fin</label>
							<input
								type="date"
								className="form-control"
								value={fechaFin}
								onChange={(e) => setFechaFin(e.target.value)}
							/>
						</div>
						<div className="col-md-3">
							<button
								className="btn btn-primary fw-bold"
								style={{
									background: "#2e5da1",
									border: "none",
									borderRadius: 8,
								}}
								onClick={generarReporteCitas}
							>
								Generar Reporte
							</button>
						</div>
						<div className="col-md-3">
							{reporteCitas.length > 0 && (
								<>
									<button
										className="btn btn-outline-danger fw-bold me-2"
										onClick={() => exportarCitasPDF()}
									>
										Descargar PDF
									</button>
									<button
										className="btn btn-outline-primary fw-bold"
										onClick={() =>
											showPdfPreview(
												() => exportarCitasPDF(true),
												"reporte_citas.pdf"
											)
										}
									>
										Vista previa PDF
									</button>
								</>
							)}
						</div>
					</div>
					{reporteCitasLoading ? (
						<div className="text-center text-secondary py-3">Cargando...</div>
					) : reporteCitas.length === 0 ? (
						<div className="text-center text-secondary py-3">
							No hay citas en el rango seleccionado.
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead style={{ background: "#e3eafc" }}>
									<tr>
										<th>Paciente</th>
										<th>Médico</th>
										<th>Especialidad</th>
										<th>Fecha</th>
										<th>Hora</th>
										<th>Estado</th>
									</tr>
								</thead>
								<tbody>
									{reporteCitas.map((c, i) => (
										<tr key={i}>
											<td>{c.paciente}</td>
											<td>{c.medico}</td>
											<td>{c.especialidad}</td>
											<td>{formatearFecha(c.fecha_cita)}</td>
											<td>{c.hora_cita}</td>
											<td>
												{c.estado === 0
													? "Pendiente"
													: c.estado === 1
														? "Finalizada"
														: c.estado === 2
															? "Cancelada por paciente"
															: c.estado === 3
																? "Cancelada por médico"
																: "Desconocido"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>

				{/* HU13 - Reporte de Citas por Médico */}
				<section className="mb-5">
					<h4
						className="fw-bold"
						style={{ color: "#2e5da1" }}
					>
						Reporte de Citas por Médico
					</h4>
					<div className="row g-2 align-items-end mb-2">
						<div className="col-md-4">
							<label className="form-label">Médico</label>
							<select
								className="form-select"
								value={medicoSeleccionado}
								onChange={(e) => setMedicoSeleccionado(e.target.value)}
							>
								<option value="">Seleccione...</option>
								{medicos.map((m) => (
									<option
										key={m.id_medico}
										value={m.id_medico}
									>
										{m.nombres} {m.apellidos} - {m.especialidad}
									</option>
								))}
							</select>
						</div>
						<div className="col-md-2">
							<label className="form-label">Fecha inicio</label>
							<input
								type="date"
								className="form-control"
								value={fechaInicioMedico}
								onChange={(e) => setFechaInicioMedico(e.target.value)}
							/>
						</div>
						<div className="col-md-2">
							<label className="form-label">Fecha fin</label>
							<input
								type="date"
								className="form-control"
								value={fechaFinMedico}
								onChange={(e) => setFechaFinMedico(e.target.value)}
							/>
						</div>
						<div className="col-md-2">
							<label className="form-label">Desglose por fechas</label>
							<input
								type="checkbox"
								className="form-check-input ms-2"
								checked={mostrarDesglose}
								onChange={(e) => setMostrarDesglose(e.target.checked)}
							/>
						</div>
						<div className="col-md-2">
							<button
								className="btn btn-primary fw-bold"
								style={{
									background: "#2e5da1",
									border: "none",
									borderRadius: 8,
								}}
								onClick={generarReporteMedico}
							>
								Generar Reporte
							</button>
							{reporteMedicoResumen && (
								<>
									<button
										className="btn btn-outline-danger fw-bold mt-2 me-2"
										onClick={() => exportarMedicoPDF()}
									>
										Descargar PDF
									</button>
									<button
										className="btn btn-outline-primary fw-bold mt-2"
										onClick={() =>
											showPdfPreview(
												() => exportarMedicoPDF(true),
												"reporte_citas_medico.pdf"
											)
										}
									>
										Vista previa PDF
									</button>
								</>
							)}
						</div>
					</div>
					{reporteMedicoResumen && (
						<div className="mb-2">
							<b>Atendidas:</b> {reporteMedicoResumen.atendidas} &nbsp;
							<b>Canceladas:</b> {reporteMedicoResumen.canceladas} &nbsp;
							<b>Pendientes:</b> {reporteMedicoResumen.pendientes}
						</div>
					)}
					{mostrarDesglose && reporteMedico.length > 0 && (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead style={{ background: "#e3eafc" }}>
									<tr>
										<th>Fecha</th>
										<th>Hora</th>
										<th>Paciente</th>
										<th>Estado</th>
									</tr>
								</thead>
								<tbody>
									{reporteMedico.map((c, i) => (
										<tr key={i}>
											<td>{formatearFecha(c.fecha_cita)}</td>
											<td>{c.hora_cita}</td>
											<td>{c.paciente}</td>
											<td>
												{c.estado === 0
													? "Pendiente"
													: c.estado === 1
														? "Finalizada"
														: c.estado === 2
															? "Cancelada por paciente"
															: c.estado === 3
																? "Cancelada por médico"
																: "Desconocido"}
											</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
					{reporteMedicoResumen === null && (
						<div className="text-center text-secondary py-3">
							No hay citas para este médico en el rango seleccionado.
						</div>
					)}
				</section>

				{/* HU14 - Reporte de Citas por Especialidad */}
				<section className="mb-5">
					<h4
						className="fw-bold"
						style={{ color: "#2e5da1" }}
					>
						Reporte de Citas por Especialidad
					</h4>
					<div className="row g-2 align-items-end mb-2">
						<div className="col-md-3">
							<label className="form-label">Fecha inicio</label>
							<input
								type="date"
								className="form-control"
								value={fechaInicioEsp}
								onChange={(e) => setFechaInicioEsp(e.target.value)}
							/>
						</div>
						<div className="col-md-3">
							<label className="form-label">Fecha fin</label>
							<input
								type="date"
								className="form-control"
								value={fechaFinEsp}
								onChange={(e) => setFechaFinEsp(e.target.value)}
							/>
						</div>
						<div className="col-md-3">
							<button
								className="btn btn-primary fw-bold"
								style={{
									background: "#2e5da1",
									border: "none",
									borderRadius: 8,
								}}
								onClick={generarReporteEspecialidad}
							>
								Generar Reporte
							</button>
						</div>
						<div className="col-md-3">
							{reporteEspecialidad.length > 0 && (
								<>
									<button
										className="btn btn-outline-danger fw-bold me-2"
										onClick={() => exportarEspecialidadPDF()}
									>
										Descargar PDF
									</button>
									<button
										className="btn btn-outline-primary fw-bold"
										onClick={() =>
											showPdfPreview(
												() => exportarEspecialidadPDF(true),
												"reporte_citas_especialidad.pdf"
											)
										}
									>
										Vista previa PDF
									</button>
								</>
							)}
						</div>
					</div>
					{reporteEspecialidad.length === 0 ? (
						<div className="text-center text-secondary py-3">
							No hay citas en el rango seleccionado.
						</div>
					) : (
						<>
							<div className="table-responsive">
								<table className="table table-hover align-middle mb-0">
									<thead style={{ background: "#e3eafc" }}>
										<tr>
											<th>Especialidad</th>
											<th>Total Citas</th>
											<th>Porcentaje</th>
										</tr>
									</thead>
									<tbody>
										{reporteEspecialidad.map((e, i) => (
											<tr key={i}>
												<td>{e.especialidad}</td>
												<td>{e.total}</td>
												<td>{e.porcentaje}%</td>
											</tr>
										))}
									</tbody>
								</table>
							</div>
							{renderBarChart()}
						</>
					)}
				</section>

				{/* HU15 - Historial de Citas de Paciente */}
				<section>
					<h4
						className="fw-bold"
						style={{ color: "#2e5da1" }}
					>
						Historial de Citas de Paciente
					</h4>
					<div className="row g-2 align-items-end mb-2">
						<div className="col-md-4">
							<label className="form-label">Buscar paciente</label>
							<input
								type="text"
								className="form-control"
								placeholder="Nombre, correo o documento"
								value={busquedaPaciente}
								onChange={(e) => buscarPacientes(e.target.value)}
							/>
							{pacientes.length > 0 && (
								<select
									className="form-select mt-2"
									value={pacienteSeleccionado}
									onChange={(e) => setPacienteSeleccionado(e.target.value)}
								>
									<option value="">Seleccione paciente...</option>
									{pacientes.map((p) => (
										<option
											key={p.id_paciente}
											value={p.id_paciente}
										>
											{p.nombres} {p.apellidos} - {p.correo} -{" "}
											{p.num_identificacion}
										</option>
									))}
								</select>
							)}
						</div>
						<div className="col-md-2">
							<label className="form-label">Orden</label>
							<select
								className="form-select"
								value={ordenHistorial}
								onChange={(e) => setOrdenHistorial(e.target.value)}
							>
								<option value="asc">Más antiguas</option>
								<option value="desc">Más recientes</option>
							</select>
						</div>
						<div className="col-md-2">
							<label className="form-label">Estado</label>
							<select
								className="form-select"
								value={filtroEstado}
								onChange={(e) => setFiltroEstado(e.target.value)}
							>
								<option value="">Todos</option>
								<option value="pendiente">Pendiente</option>
								<option value="finalizada">Finalizada</option>
								<option value="cancelada_paciente">
									Cancelada por paciente
								</option>
								<option value="cancelada_medico">Cancelada por médico</option>
							</select>
						</div>
						<div className="col-md-2">
							<button
								className="btn btn-primary fw-bold"
								style={{
									background: "#2e5da1",
									border: "none",
									borderRadius: 8,
								}}
								onClick={cargarHistorialPaciente}
							>
								Consultar Historial
							</button>
							{historialCitas.length > 0 && (
								<>
									<button
										className="btn btn-outline-danger fw-bold mt-2 me-2"
										onClick={() => exportarHistorialPDF()}
									>
										Descargar PDF
									</button>
									<button
										className="btn btn-outline-primary fw-bold mt-2"
										onClick={() =>
											showPdfPreview(
												() => exportarHistorialPDF(true),
												"historial_citas_paciente.pdf"
											)
										}
									>
										Vista previa PDF
									</button>
								</>
							)}
						</div>
					</div>
					{historialCitas.length === 0 ? (
						<div className="text-center text-secondary py-3">
							No hay citas para este paciente.
						</div>
					) : (
						<div className="table-responsive">
							<table className="table table-hover align-middle mb-0">
								<thead style={{ background: "#e3eafc" }}>
									<tr>
										<th>Fecha</th>
										<th>Hora</th>
										<th>Médico</th>
										<th>Especialidad</th>
										<th>Estado</th>
										<th>Motivo</th>
									</tr>
								</thead>
								<tbody>
									{historialCitas.map((c, i) => (
										<tr key={i}>
											<td>
												{(() => {
													if (!c.fecha_cita) return "";
													const fecha = new Date(c.fecha_cita);
													const dia = String(fecha.getDate()).padStart(2, "0");
													const mes = String(fecha.getMonth() + 1).padStart(
														2,
														"0"
													);
													const anio = fecha.getFullYear();
													return `${dia}/${mes}/${anio}`;
												})()}
											</td>
											<td>{c.hora_cita ? c.hora_cita.slice(0, 5) : ""}</td>
											<td>{c.medico}</td>
											<td>{c.especialidad}</td>
											<td>
												<span
													className={
														c.estado === 0
															? "badge bg-primary"
															: c.estado === 1
																? "badge bg-success"
																: c.estado === 2
																	? "badge bg-warning text-dark"
																	: "badge bg-danger"
													}
												>
													{
														[
															"Pendiente",
															"Finalizada",
															"Cancelada por paciente",
															"Cancelada por médico",
														][c.estado]
													}
												</span>
											</td>
											<td>{c.motivo || ""}</td>
										</tr>
									))}
								</tbody>
							</table>
						</div>
					)}
				</section>
			</div>
		</div>
	);
};

export default ReportesAdmin;
