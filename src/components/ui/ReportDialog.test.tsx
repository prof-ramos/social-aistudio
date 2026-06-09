import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { vi } from 'vitest';
import { ReportDialog } from './ReportDialog';

describe('ReportDialog', () => {
  it('submits reason and details via callback', async () => {
    const onSubmitted = vi.fn();
    const onCancel = vi.fn();
    const user = userEvent.setup();

    render(
      <ReportDialog isOpen onCancel={onCancel} onSubmitted={onSubmitted} />
    );

    await user.selectOptions(screen.getByLabelText(/motivo/i), 'Spam');
    await user.type(screen.getByLabelText(/detalhes/i), 'Conteúdo repetitivo');
    await user.click(screen.getByRole('button', { name: /denunciar/i }));

    expect(onSubmitted).toHaveBeenCalledWith('Spam', 'Conteúdo repetitivo');
  });
});