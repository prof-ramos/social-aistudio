import { vi, describe, it, expect, beforeEach } from 'vitest';
import { adminService } from './adminService';

const { fromMock, channelMock, removeChannelMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  channelMock: vi.fn(),
  removeChannelMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: {
    from: fromMock,
    channel: channelMock,
    removeChannel: removeChannelMock,
  },
}));

// --- helpers ---

const buildRealtimeChain = () => {
  const chain: any = {
    on: vi.fn(() => chain),
    subscribe: vi.fn(() => chain),
  };
  channelMock.mockReturnValue(chain);
  return chain;
};

const mockCountSelect = (result: { count: number | null; error: unknown }) => {
  const count = vi.fn().mockResolvedValue(result);
  const eq = vi.fn().mockReturnValue({ count });
  const select = vi.fn().mockReturnValue({ eq });
  fromMock.mockReturnValue({ select });
  return { count, eq, select };
};

const mockCountHead = (result: { count: number | null; error: unknown }) => {
  const eq = vi.fn().mockResolvedValue(result);
  const select = vi.fn().mockReturnValue({ eq });
  fromMock.mockReturnValue({ select });
  return { select, eq };
};

const mockSelectOrderedLimit = (result: { data: unknown; error: unknown }) => {
  const limit = vi.fn().mockResolvedValue(result);
  const order = vi.fn().mockReturnValue({ limit });
  const select = vi.fn().mockReturnValue({ order });
  fromMock.mockReturnValue({ select });
  return { limit, order, select };
};

const mockUpdateEq = (result: { error: unknown }) => {
  const eq = vi.fn().mockResolvedValue(result);
  const update = vi.fn().mockReturnValue({ eq });
  fromMock.mockReturnValue({ update });
  return { eq, update };
};

beforeEach(() => {
  vi.clearAllMocks();
  fromMock.mockReset();
  channelMock.mockReset();
  removeChannelMock.mockReset();
  buildRealtimeChain();
});

const requestRow = (overrides?: any) => ({
  id: 'r1',
  name: 'Bob',
  email: 'bob@asof.org.br',
  cpf: '123',
  matricula: '456',
  category: 'MEMBRO_ATIVO',
  currentPost: 'Paris',
  status: 'PENDING',
  rejection_reason: '',
  created_at: '2026-06-01',
  ...overrides,
});

const reportRow = (overrides?: any) => ({
  id: 'rp1',
  type: 'post',
  content_id: 'c1',
  preview: 'bad post',
  reported_by: 'u2',
  reason: 'spam',
  status: 'PENDING',
  notes: '',
  created_at: '2026-06-02',
  resolved_at: null,
  ...overrides,
});

// ===================== subscribeToPendingRequests =====================

describe('adminService.subscribeToPendingRequests', () => {
  it('fetches the exact count of PENDING requests and subscribes to changes', async () => {
    mockCountHead({ count: 3, error: null });
    const onUpdate = vi.fn();

    const unsubscribe = adminService.subscribeToPendingRequests(onUpdate);

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalledWith(3));

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });

  it('does not call onUpdate when the count query errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockCountHead({ count: null, error: new Error('db down') });
    const onUpdate = vi.fn();

    adminService.subscribeToPendingRequests(onUpdate);

    await new Promise((r) => setTimeout(r, 50));
    expect(onUpdate).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ===================== subscribeToAllRequests =====================

describe('adminService.subscribeToAllRequests', () => {
  it('fetches requests ordered by created_at desc with limit 50', async () => {
    const rows = [requestRow({ id: 'r1' }), requestRow({ id: 'r2' })];
    const { limit, order } = mockSelectOrderedLimit({ data: rows, error: null });
    const onUpdate = vi.fn();

    const unsubscribe = adminService.subscribeToAllRequests(onUpdate);

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(50);
    expect(onUpdate).toHaveBeenCalledWith(rows);

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });

  it('does not call onUpdate when query errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSelectOrderedLimit({ data: null, error: new Error('fail') });
    const onUpdate = vi.fn();

    adminService.subscribeToAllRequests(onUpdate);

    await new Promise((r) => setTimeout(r, 50));
    expect(onUpdate).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ===================== updateRequestStatus =====================

describe('adminService.updateRequestStatus', () => {
  it('updates status to APPROVED', async () => {
    const { eq, update } = mockUpdateEq({ error: null });

    await adminService.updateRequestStatus('r1', 'APPROVED');

    expect(update).toHaveBeenCalledWith({ status: 'APPROVED' });
    expect(eq).toHaveBeenCalledWith('id', 'r1');
  });

  it('throws on error', async () => {
    mockUpdateEq({ error: new Error('rls') });

    await expect(adminService.updateRequestStatus('r1', 'REJECTED')).rejects.toThrow('rls');
  });
});

// ===================== rejectRequestWithReason =====================

describe('adminService.rejectRequestWithReason', () => {
  it('updates status and rejection_reason', async () => {
    const { eq, update } = mockUpdateEq({ error: null });

    await adminService.rejectRequestWithReason('r1', 'CPF invalido');

    expect(update).toHaveBeenCalledWith({ status: 'REJECTED', rejection_reason: 'CPF invalido' });
    expect(eq).toHaveBeenCalledWith('id', 'r1');
  });

  it('throws on error', async () => {
    mockUpdateEq({ error: new Error('db down') });

    await expect(adminService.rejectRequestWithReason('r1', 'reason')).rejects.toThrow('db down');
  });
});

// ===================== createUserFromRequest =====================

describe('adminService.createUserFromRequest', () => {
  it('inserts into users with snake_case fields mapped from request', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: null });
    fromMock.mockReturnValue({ insert: insertMock });

    const req = requestRow();
    await adminService.createUserFromRequest('auth-uid-123', req);

    expect(insertMock).toHaveBeenCalledWith({
      id: 'auth-uid-123',
      name: 'Bob',
      email: 'bob@asof.org.br',
      role: 'MEMBRO_ATIVO',
      cpf: '123',
      matricula: '456',
      current_post: 'Paris',
    });
  });

  it('throws on insert error', async () => {
    const insertMock = vi.fn().mockResolvedValue({ error: new Error('dup email') });
    fromMock.mockReturnValue({ insert: insertMock });

    await expect(adminService.createUserFromRequest('uid', requestRow())).rejects.toThrow('dup email');
  });
});

// ===================== subscribeToReports =====================

describe('adminService.subscribeToReports', () => {
  it('fetches reports ordered by created_at desc with limit 50', async () => {
    const rows = [reportRow(), reportRow({ id: 'rp2' })];
    const { limit, order } = mockSelectOrderedLimit({ data: rows, error: null });
    const onUpdate = vi.fn();

    const unsubscribe = adminService.subscribeToReports(onUpdate);

    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());
    expect(order).toHaveBeenCalledWith('created_at', { ascending: false });
    expect(limit).toHaveBeenCalledWith(50);
    expect(onUpdate).toHaveBeenCalledWith(rows);

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });

  it('does not call onUpdate when query errors', async () => {
    const consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    mockSelectOrderedLimit({ data: null, error: new Error('fail') });
    const onUpdate = vi.fn();

    adminService.subscribeToReports(onUpdate);

    await new Promise((r) => setTimeout(r, 50));
    expect(onUpdate).not.toHaveBeenCalled();
    consoleSpy.mockRestore();
  });
});

// ===================== updateReportStatus =====================

describe('adminService.updateReportStatus', () => {
  it('updates only status when notes is not provided', async () => {
    const { eq, update } = mockUpdateEq({ error: null });

    await adminService.updateReportStatus('rp1', 'RESOLVED_REMOVED');

    expect(update).toHaveBeenCalledWith({ status: 'RESOLVED_REMOVED' });
    expect(eq).toHaveBeenCalledWith('id', 'rp1');
  });

  it('updates status and notes when notes is provided', async () => {
    const { eq, update } = mockUpdateEq({ error: null });

    await adminService.updateReportStatus('rp1', 'RESOLVED_WARNED', 'aviso verbal');

    expect(update).toHaveBeenCalledWith({ status: 'RESOLVED_WARNED', notes: 'aviso verbal' });
    expect(eq).toHaveBeenCalledWith('id', 'rp1');
  });

  it('throws on error', async () => {
    mockUpdateEq({ error: new Error('rls') });

    await expect(adminService.updateReportStatus('rp1', 'RESOLVED_KEPT')).rejects.toThrow('rls');
  });
});
