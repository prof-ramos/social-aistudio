import { vi, describe, it, expect, beforeEach } from 'vitest';
import { notificationService } from './notificationService';

const { fromMock, channelMock, removeChannelMock } = vi.hoisted(() => ({
  fromMock: vi.fn(),
  channelMock: vi.fn(),
  removeChannelMock: vi.fn(),
}));

vi.mock('../lib/supabase', () => ({
  supabase: { from: fromMock, channel: channelMock, removeChannel: removeChannelMock },
}));

beforeEach(() => {
  vi.clearAllMocks();
  const chain: any = { on: vi.fn(() => chain), subscribe: vi.fn(() => chain) };
  channelMock.mockReturnValue(chain);
});

describe('notificationService.subscribeToUnreadNotifications', () => {
  it('emits the unread count from a head/count query filtered to unread', async () => {
    const eqRead = vi.fn().mockResolvedValue({ count: 3, error: null });
    const eqUser = vi.fn().mockReturnValue({ eq: eqRead });
    const select = vi.fn().mockReturnValue({ eq: eqUser });
    fromMock.mockReturnValue({ select });

    const onUpdate = vi.fn();
    notificationService.subscribeToUnreadNotifications('u1', onUpdate);
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());

    expect(eqUser).toHaveBeenCalledWith('user_id', 'u1');
    expect(eqRead).toHaveBeenCalledWith('read', false);
    expect(onUpdate).toHaveBeenCalledWith(3);
  });

  it('does not emit when the count query errors (current behavior: swallow + return)', async () => {
    const eqRead = vi.fn().mockResolvedValue({ count: null, error: new Error('fail') });
    const eqUser = vi.fn().mockReturnValue({ eq: eqRead });
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq: eqUser }) });

    const onUpdate = vi.fn();
    notificationService.subscribeToUnreadNotifications('u1', onUpdate);
    await Promise.resolve();
    await Promise.resolve();

    expect(onUpdate).not.toHaveBeenCalled();
  });
});

describe('notificationService.subscribeToUserNotifications', () => {
  it('fetches with limit(50) and forwards the rows', async () => {
    const rows = [{ id: 'n1', user_id: 'u1', type: 'MENTION', actor_name: 'Bob', read: false, created_at: '2026-06-10' }];
    const limit = vi.fn().mockResolvedValue({ data: rows, error: null });
    const order = vi.fn().mockReturnValue({ limit });
    const eq = vi.fn().mockReturnValue({ order });
    fromMock.mockReturnValue({ select: vi.fn().mockReturnValue({ eq }) });

    const onUpdate = vi.fn();
    const unsubscribe = notificationService.subscribeToUserNotifications('u1', onUpdate);
    await vi.waitFor(() => expect(onUpdate).toHaveBeenCalled());

    expect(eq).toHaveBeenCalledWith('user_id', 'u1');
    expect(limit).toHaveBeenCalledWith(50);
    expect(onUpdate).toHaveBeenCalledWith(rows);

    unsubscribe();
    expect(removeChannelMock).toHaveBeenCalled();
  });
});

describe('notificationService.markAsRead', () => {
  it('updates read=true for the given id', async () => {
    const eq = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ eq });
    fromMock.mockReturnValue({ update });

    await notificationService.markAsRead('n1');

    expect(update).toHaveBeenCalledWith({ read: true });
    expect(eq).toHaveBeenCalledWith('id', 'n1');
  });

  it('throws on error', async () => {
    const eq = vi.fn().mockResolvedValue({ error: new Error('denied') });
    fromMock.mockReturnValue({ update: vi.fn().mockReturnValue({ eq }) });
    await expect(notificationService.markAsRead('n1')).rejects.toThrow('denied');
  });
});

describe('notificationService.markAllAsRead', () => {
  it('skips the DB call when there are no unread notifications', async () => {
    await notificationService.markAllAsRead([
      { id: 'a', read: true } as any,
      { id: 'b', read: true } as any,
    ]);
    expect(fromMock).not.toHaveBeenCalled();
  });

  it('updates only the unread ids', async () => {
    const inMock = vi.fn().mockResolvedValue({ error: null });
    const update = vi.fn().mockReturnValue({ in: inMock });
    fromMock.mockReturnValue({ update });

    await notificationService.markAllAsRead([
      { id: 'a', read: false } as any,
      { id: 'b', read: true } as any,
      { id: 'c', read: false } as any,
    ]);

    expect(update).toHaveBeenCalledWith({ read: true });
    expect(inMock).toHaveBeenCalledWith('id', ['a', 'c']);
  });
});

describe('notificationService.createNotification', () => {
  it('maps camelCase input to the row payload and returns the inserted row', async () => {
    const created = { id: 'n9', read: false };
    const single = vi.fn().mockResolvedValue({ data: created, error: null });
    const select = vi.fn().mockReturnValue({ single });
    const insert = vi.fn().mockReturnValue({ select });
    fromMock.mockReturnValue({ insert });

    const result = await notificationService.createNotification({
      userId: 'u1',
      type: 'MENTION',
      actorName: 'Bob',
      postId: 'p1',
      message: 'te citou',
      link: '/feed/p1',
    });

    expect(insert).toHaveBeenCalledWith({
      user_id: 'u1',
      type: 'MENTION',
      actor_name: 'Bob',
      post_id: 'p1',
      message: 'te citou',
      link: '/feed/p1',
      read: false,
    });
    expect(result).toBe(created);
  });

  it('throws when the insert fails', async () => {
    const single = vi.fn().mockResolvedValue({ data: null, error: new Error('insert failed') });
    const insert = vi.fn().mockReturnValue({ select: vi.fn().mockReturnValue({ single }) });
    fromMock.mockReturnValue({ insert });

    await expect(notificationService.createNotification({ userId: 'u1', type: 'X', actorName: 'A' })).rejects.toThrow('insert failed');
  });
});
