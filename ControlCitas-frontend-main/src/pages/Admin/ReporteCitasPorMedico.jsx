import React, { useEffect, useState } from "react";
import axios from "axios";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";

const ReporteCitasPorMedico = () => {
  const [data, setData] = useState([]);


  useEffect(() => {
    axios
      .get(`${import.meta.env.VITE_API_URL}/api/admin/citas-por-medico`)
      .then((res) => setData(res.data))
      .catch(() => setData([]));
  }, []);

  return (
    <div>
      <h5 className="fw-bold text-center text-primary mb-3">
        Citas por Médico
      </h5>
      <ResponsiveContainer width="100%" height={300}>
        <BarChart
          data={data}
          margin={{ top: 20, right: 20, left: 0, bottom: 50 }}
        >
          <CartesianGrid strokeDasharray="3 3" />
          <XAxis
            dataKey="medico"
            angle={-25}
            textAnchor="end"
            interval={0}
            height={60}
          />
          <YAxis allowDecimals={false} />
          <Tooltip />
          <Legend />
          <Bar dataKey="total" fill="#2e5da1" name="Total de Citas" />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
};

export default ReporteCitasPorMedico;
