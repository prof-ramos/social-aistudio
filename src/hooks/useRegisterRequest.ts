import { useState } from 'react';
import { memberRequestService } from '../services/memberRequestService';

const INITIAL_FORM = {
  name: '', email: '', cpf: '', matricula: '', category: 'MEMBRO_ATIVO', currentPost: ''
};

/**
 * Owns the access-request form state and submission: persists the request via
 * memberRequestService, then fires the admin notification email. Keeps the
 * RegisterRequest page free of direct service calls.
 */
export function useRegisterRequest() {
  const [formData, setFormData] = useState(INITIAL_FORM);
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState('');
  const [notificationWarning, setNotificationWarning] = useState('');

  const updateField = (field: keyof typeof INITIAL_FORM, value: string) =>
    setFormData(prev => ({ ...prev, [field]: value }));

  const submit = async () => {
    setLoading(true);
    setError('');
    setNotificationWarning('');
    try {
      const result = await memberRequestService.submitRequest(formData);
      if (!result.adminNotified) {
        setNotificationWarning(result.notificationError || 'A solicitação foi registrada, mas o aviso automático para a administração falhou.');
      }
      setSuccess(true);
    } catch (err) {
      console.error(err);
      setError('Erro ao enviar solicitação.');
    } finally {
      setLoading(false);
    }
  };

  return { formData, updateField, loading, success, error, notificationWarning, submit };
}
