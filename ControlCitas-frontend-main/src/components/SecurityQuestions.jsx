import React, { useState } from 'react';
import axios from 'axios';

const SecurityQuestions = () => {
  const [questions, setQuestions] = useState([
    { question: '¿Como se llamaba tu mascota de infancia?', answer: '' },
    { question: '¿Cuál era el nombre de tu maestro de tercer grado?', answer: '' },
    { question: '¿Cuál es tu pelicula favorita?', answer: '' }
  ]);
  const [status, setStatus] = useState('');
  const user = JSON.parse(localStorage.getItem('user'));

  const handleAnswerChange = (index, value) => {
    const newQuestions = [...questions];
    newQuestions[index].answer = value;
    setQuestions(newQuestions);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    // Verificar que todas las preguntas tengan respuesta
    if (questions.some(q => !q.answer.trim())) {
      setStatus('Por favor responde todas las preguntas');
      return;
    }

    try {
        
      console.log('Enviando datos:', {
        userId: user.id_usuario,
        answers: questions.map(q => q.answer)
      });
      
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/update-security-questions`, {
        userId: user.id_usuario,
        answers: questions.map(q => q.answer)
      }, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      console.log('Respuesta del servidor:', response.data);
      setStatus('Preguntas de seguridad actualizadas correctamente');
    } catch (error) {
      console.error('Error completo:', error);
      console.error('Respuesta del servidor:', error.response?.data);
      setStatus(error.response?.data?.error || 'Error al guardar las preguntas de seguridad');
    }
  };

  return (
    <div className="card shadow-sm">
      <div className="card-body">
        <h5 className="card-title mb-4">Preguntas de Seguridad</h5>
        
        <form onSubmit={handleSubmit}>
          {questions.map((q, index) => (
            <div key={index} className="mb-3">
              <label className="form-label">{q.question}</label>
              <input
                type="text"
                className="form-control"
                value={q.answer}
                onChange={(e) => handleAnswerChange(index, e.target.value)}
                placeholder="Ingresa tu respuesta"
              />
            </div>
          ))}

          {status && (
            <div className={`alert ${status.includes('Error') ? 'alert-danger' : 'alert-success'} mt-3`}>
              {status}
            </div>
          )}

          <button type="submit" className="btn btn-primary mt-3">
            Guardar Preguntas de Seguridad
          </button>
        </form>
      </div>
    </div>
  );
};

export default SecurityQuestions;
