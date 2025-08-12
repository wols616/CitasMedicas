import React, { useEffect, useState } from "react";
import axios from "axios";
import { PieChart, Pie, Cell, Legend, Tooltip, ResponsiveContainer } from "recharts";

const COLORS = ["#8884d8", "#82ca9d", "#ff726f", "#ffcf56"];

const ReporteCitasPorEstado = () => {
  const [data, setData] = useState([]);

  useEffect(() => {
    axios.get(`${import.meta.env.VITE_API_URL}/api/admin/citas-por-estado`)
      .then((res) => setData(res.data))
      .catch(() => setData([]));
  }, []);

  const formatData = data.map((item) => ({
    name:
      item.estado === 0
        ? "Pendiente"
        : item.estado === 1
        ? "Finalizada"
        : item.estado === 2
        ? "Cancelada por paciente"
        : item.estado === 3
        ? "Cancelada por médico"
        : "Otro",
    value: item.total,
  }));

  return (
    <div>
      <h5 className="fw-bold text-center text-primary mb-3">
        Distribución de Citas por Estado
      </h5>
      <ResponsiveContainer width="100%" height={300}>
        <PieChart>
          <Pie
            data={formatData}
            cx="50%"
            cy="50%"
            labelLine={false}
            label={({ name, percent }) => `${name} (${(percent * 100).toFixed(0)}%)`}
            outerRadius={120}
            fill="#8884d8"
            dataKey="value"
          >
            {formatData.map((entry, index) => (
              <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
            ))}
          </Pie>
          <Tooltip />
          <Legend />
        </PieChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReporteCitasPorEstado;
