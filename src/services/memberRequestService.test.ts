import { vi, describe, it, expect, beforeEach } from 'vitest';
import { memberRequestService } from './memberRequestService';

const { fromMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { from: fromMock },
}));

const mockInsert = (result: { data: unknown; error: unknown }) => {
  const single = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ single });
  const insert = vi.fn().mockReturnValue({ select });
  fromMock.mockReturnValue({ insert });
  return { insert, select, single };
};

beforeEach(() => {
  vi.clearAllMocks();
});

describe('memberRequestService.createRequest', () => {
  it('inserts with mapped fields and returns the row on success', async () => {
    const row = { id: 'req-1', status: 'PENDING' };
    const { insert } = mockInsert({ data: row, error: null });

    const data = {
      name: 'Alice',
      email: 'alice@asof.org.br',
      cpf: '12345678900',
      matricula: 'M001',
      category: 'MEMBRO_ATIVO',
      currentPost: 'Brasília',
    };

    const result = await memberRequestService.createRequest(data);

    expect(insert).toHaveBeenCalledWith({
      name: 'Alice',
      email: 'alice@asof.org.br',
      cpf: '12345678900',
      matricula: 'M001',
      category: 'MEMBRO_ATIVO',
      current_post: 'Brasília',
      status: 'PENDING',
    });
    expect(result).toBe(row);
  });

  it('throws when Supabase returns an error', async () => {
    mockInsert({ data: null, error: new Error('insert failed') });

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
