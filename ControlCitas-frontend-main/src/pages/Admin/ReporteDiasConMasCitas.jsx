import React, { useEffect, useState } from "react";
import axios from "axios";
import {
	LineChart,
	Line,
	XAxis,
	YAxis,
	CartesianGrid,
	Tooltip,
	ResponsiveContainer,
	Legend,
} from "recharts";

const ReporteDiasConMasCitas = () => {
	const [data, setData] = useState([]);

	useEffect(() => {
		axios
			.get(`${import.meta.env.VITE_API_URL}/api/admin/citas-por-dia`)
			.then((res) => {
				const formatted = res.data.map((item) => {
					const date = new Date(item.fecha);
					const dia = String(date.getDate()).padStart(2, "0");
					const mes = String(date.getMonth() + 1).padStart(2, "0");
					const anio = date.getFullYear();
					return {
						...item,
						fecha: `${dia}/${mes}/${anio}`,
					};
				});
				setData(formatted);
			})
			.catch(() => setData([]));
	}, []);

	return (
		<div className="mt-4">
			<h5 className="fw-bold text-center text-primary mb-3">
				Citas por Día (Histórico)
			</h5>
			<ResponsiveContainer
				width="100%"
				height={300}
			>
				<LineChart
					data={data}
					margin={{ top: 20, right: 20, left: 0, bottom: 20 }}
				>
					<CartesianGrid strokeDasharray="3 3" />
					<XAxis
						dataKey="fecha"
						angle={-25}
						textAnchor="end"
						height={60}
					/>
					<YAxis allowDecimals={false} />
					<Tooltip />
					<Legend />
					<Line
						type="monotone"
						dataKey="total"
						stroke="#2e5da1"
						activeDot={{ r: 6 }}
						name="Total de Citas"
					/>
				</LineChart>
			</ResponsiveContainer>
		</div>
	);
};

export default ReporteDiasConMasCitas;
