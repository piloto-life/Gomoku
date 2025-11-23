export async function lookupCep(cep: string): Promise<{ cep: string; city: string; state: string; country: string }> {
  const normalized = (cep || '').replace(/\D/g, '');
  if (normalized.length !== 8) {
    throw new Error('CEP inválido');
  }

  const url = `https://viacep.com.br/ws/${normalized}/json/`;
  const res = await fetch(url);
  if (!res.ok) {
    throw new Error('Falha ao consultar CEP');
  }
  const data = await res.json();
  if (data.erro) {
    throw new Error('CEP não encontrado');
  }

  return {
    cep: data.cep || normalized,
    city: data.localidade || '',
    state: data.uf || '',
    country: 'Brasil',
  };
}
