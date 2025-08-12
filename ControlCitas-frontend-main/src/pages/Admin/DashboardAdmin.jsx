import { useState } from "react";

import ReportesAdmin from "../Admin/ReportesAdmin";
import ReporteCitasPorEstado from "../Admin/ReporteCitasPorEstado";
import ReporteCitasPorMedico from "../Admin/ReporteCitasPorMedico";
import ReporteDiasConMasCitas from "../Admin/ReporteDiasConMasCitas";
import React, { useEffect, useRef } from "react";
import logo from "../../assets/logo_clinica_blanco.png";

const DashboardAdmin = () => {
	const [mostrarReportes, setMostrarReportes] = useState(false);



	return (
		<div
			className="d-flex flex-column align-items-center justify-content-center"
			style={{
				minHeight: "100vh",
				width: "100%",
				background: "#f5faff",
				padding: "0",
				margin: "0",
			}}
		>
			<div
				className="shadow p-4 rounded my-5"
				style={{
					background: "#fff",
					maxWidth: "1100px",
					width: "100%",
					borderRadius: "18px",
					boxShadow: "0 4px 24px 0 rgba(46,93,161,0.10)",
				}}
			>
				<div className="text-center mb-4">
					<img
						src={logo}
						alt="Logo Clínica Johnson"
						style={{
							height: 56,
							width: 56,
							borderRadius: "50%",
							background: "#2e5da1",
							padding: 8,
						}}
					/>
					<h2
						className="fw-bold mt-3"
						style={{ color: "#2e5da1" }}
					>
						Dashboard de Administración
					</h2>
					<p
						className="text-secondary mb-5"
						style={{ fontSize: "1.08rem" }}
					>
						Gráficos, Reportes y consultas avanzadas del sistema.
					</p>
				</div>

				<section className="mb-5 mt-5">
					<div className="row">
						<div className="col-md-6">
							<ReporteCitasPorEstado />
						</div>
						<div className="col-md-6">
							<ReporteCitasPorMedico />
						</div>
					</div>
					<div className="row mt-4">
						<div className="col-md-12">
							<ReporteDiasConMasCitas />
						</div>
					</div>
				</section>

				<div className="text-center my-4">
					<button
						className="btn btn-outline-primary fw-bold"
						onClick={() => setMostrarReportes(!mostrarReportes)}
					>
						{mostrarReportes ? "Ocultar Reportes" : "Ver Reportes Detallados"}
					</button>
				</div>
				{mostrarReportes && <ReportesAdmin />}
			</div>
		</div>
	);
};

export default DashboardAdmin;
