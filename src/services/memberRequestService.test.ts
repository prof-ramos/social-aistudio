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
});

describe('memberRequestService.createRequest', () => {
  it('calls insert_member_request RPC with mapped fields and returns result on success', async () => {
    const returnedId = 'req-1';
    rpcMock.mockResolvedValue({ data: returnedId, error: null });

    const data = {
      name: 'Alice',
      email: 'alice@asof.org.br',
      cpf: '12345678900',
      matricula: 'M001',
      category: 'MEMBRO_ATIVO',
      currentPost: 'Brasília',
    };

    const result = await memberRequestService.createRequest(data);

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