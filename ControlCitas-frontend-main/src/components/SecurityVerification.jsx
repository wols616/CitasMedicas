import React, { useState } from 'react';
import axios from 'axios';

const SecurityVerification = ({ userId, onVerificationComplete, onClose }) => {
  const [verificationMethod, setVerificationMethod] = useState('email');
  const [securityQuestion, setSecurityQuestion] = useState(null);
  const [answer, setAnswer] = useState('');
  const [error, setError] = useState('');
  const [verificationCode, setVerificationCode] = useState('');

  const fetchSecurityQuestion = async () => {
    try {
      const response = await axios.get(`/api/security-question/${userId}`);
      if (response.data.configured) {
        setSecurityQuestion({
          number: response.data.questionNumber,
          text: response.data.question
        });
      } else {
        setError('Las preguntas de seguridad no han sido configuradas');
        setVerificationMethod('email');
      }
    } catch (error) {
      console.error('Error al obtener pregunta de seguridad:', error);
      setError('Error al obtener la pregunta de seguridad');
    }
  };

  const handleMethodChange = (method) => {
    setVerificationMethod(method);
    setError('');
    if (method === 'security-question') {
      fetchSecurityQuestion();
    }
  };

  const handleVerification = async () => {
    try {
      if (verificationMethod === 'security-question') {
        const response = await axios.post('/api/verify-security-question', {
          userId,
          questionNumber: securityQuestion.number,
          answer
        });

        if (response.data.verified) {
          onVerificationComplete();
        } else {
          setError('Respuesta incorrecta');
        }
      } else {
        // Lógica existente para verificación por correo
        // ... código para verificar el código enviado por correo ...
      }
    } catch (error) {
      setError('Error en la verificación');
      console.error('Error:', error);
    }
  };

  return (
    <div className="modal-content">
      <div className="modal-header">
        <h5 className="modal-title">Verificación de Identidad</h5>
        <button type="button" className="btn-close" onClick={onClose}></button>
      </div>
      <div className="modal-body">
        <div className="mb-3">
          <label className="form-label">Método de verificación</label>
          <div className="d-flex gap-2">
            <button
              className={`btn ${verificationMethod === 'email' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleMethodChange('email')}
            >
              Código por correo
            </button>
            <button
              className={`btn ${verificationMethod === 'security-question' ? 'btn-primary' : 'btn-outline-primary'}`}
              onClick={() => handleMethodChange('security-question')}
            >
              Pregunta clave
            </button>
          </div>
        </div>

        {verificationMethod === 'email' ? (
          <div className="mb-3">
            <label className="form-label">Código de verificación</label>
            <input
              type="text"
              className="form-control"
              value={verificationCode}
              onChange={(e) => setVerificationCode(e.target.value)}
              placeholder="Ingresa el código enviado a tu correo"
            />
          </div>
        ) : securityQuestion ? (
          <div className="mb-3">
            <label className="form-label">{securityQuestion.text}</label>
            <input
              type="text"
              className="form-control"
              value={answer}
              onChange={(e) => setAnswer(e.target.value)}
              placeholder="Ingresa tu respuesta"
            />
          </div>
        ) : null}

        {error && (
          <div className="alert alert-danger">{error}</div>
        )}
      </div>
      <div className="modal-footer">
        <button type="button" className="btn btn-secondary" onClick={onClose}>
          Cancelar
        </button>
        <button
          type="button"
          className="btn btn-primary"
          onClick={handleVerification}
          disabled={!verificationCode && !answer}
        >
          Verificar
        </button>
      </div>
    </div>
  );
};

export default SecurityVerification;
