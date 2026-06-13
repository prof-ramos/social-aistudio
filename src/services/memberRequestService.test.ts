import { vi, describe, it, expect, beforeEach } from 'vitest';
import { memberRequestService } from './memberRequestService';

const { rpcMock } = vi.hoisted(() => ({
  rpcMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { rpc: rpcMock },
}));

beforeEach(() => {
  vi.clearAllMocks();
  global.fetch = vi.fn();
});

const requestInput = {
  name: 'Alice',
  email: 'alice@asof.org.br',
  cpf: '12345678900',
  matricula: 'M001',
  category: 'MEMBRO_ATIVO',
  currentPost: 'Brasília',
};

describe('memberRequestService.createRequest', () => {
  it('calls insert_member_request RPC with mapped fields and returns result on success', async () => {
    const returnedId = 'req-1';
    rpcMock.mockResolvedValue({ data: returnedId, error: null });

    const result = await memberRequestService.createRequest(requestInput);

    expect(rpcMock).toHaveBeenCalledWith('insert_member_request', {
      p_name: 'Alice',
      p_email: 'alice@asof.org.br',
      p_cpf: '12345678900',
      p_matricula: 'M001',
      p_category: 'MEMBRO_ATIVO',
      p_current_post: 'Brasília',
    });
    expect(result).toBe(returnedId);
  });

  it('throws when Supabase returns an error', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('insert failed') });

    await expect(
      memberRequestService.createRequest({
        name: 'Bob',
        email: 'bob@asof.org.br',
        cpf: '00000000000',
        matricula: 'M002',
        category: 'MEMBRO_APOSENTADO',
        currentPost: 'Lisboa',
      })
    ).rejects.toThrow('insert failed');
  });
});

describe('memberRequestService.submitRequest', () => {
  it('creates the request and notifies the admin endpoint', async () => {
    rpcMock.mockResolvedValue({ data: 'req-1', error: null });
    vi.mocked(fetch).mockResolvedValue({
      ok: true,
    } as Response);

    const result = await memberRequestService.submitRequest(requestInput);

    expect(result).toEqual({
      inserted: 'req-1',
      adminNotified: true,
      notificationError: null,
    });
    expect(fetch).toHaveBeenCalledWith('/api/admin/notify-request', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Alice',
        email: 'alice@asof.org.br',
        matricula: 'M001',
      }),
    });
  });

  it('returns a warning result when the admin notification fails after insert', async () => {
    rpcMock.mockResolvedValue({ data: 'req-1', error: null });
    vi.mocked(fetch).mockResolvedValue({
      ok: false,
      json: () => Promise.resolve({ error: 'Solicitação não encontrada' }),
    } as Response);

    const result = await memberRequestService.submitRequest(requestInput);

    expect(result.inserted).toBe('req-1');
    expect(result.adminNotified).toBe(false);
    expect(result.notificationError).toBe('Solicitação não encontrada');
  });

  it('does not notify the admin endpoint when creating the request fails', async () => {
    rpcMock.mockResolvedValue({ data: null, error: new Error('insert failed') });

    await expect(memberRequestService.submitRequest(requestInput)).rejects.toThrow('insert failed');
    expect(fetch).not.toHaveBeenCalled();
  });
});
