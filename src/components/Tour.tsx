import { useState, useEffect } from 'react';
import { Joyride, STATUS, Step } from 'react-joyride';

export function Tour() {
  const [run, setRun] = useState(false);

  useEffect(() => {
    // Small delay to ensure dom is mounted
    const timeout = setTimeout(() => {
        const hasSeenTour = localStorage.getItem('hasSeenTour');
        if (!hasSeenTour) {
        setRun(true);
        }
    }, 1000);
    return () => clearTimeout(timeout);
  }, []);

  const handleJoyrideEvent = (data: any) => {
    const { status } = data;
    const finishedStatuses: string[] = [STATUS.FINISHED, STATUS.SKIPPED];

    if (finishedStatuses.includes(status)) {
      setRun(false);
      localStorage.setItem('hasSeenTour', 'true');
    }
  };

  const steps: Step[] = [
    {
      target: '.tour-sidebar-nav',
      content: 'Navegue pelas rotas principais: Feed, Postos, Mensagens e seu Perfil por aqui.',
      placement: 'right',
    },
    {
      target: '.tour-new-post',
      content: 'Quer iniciar um assunto? Clique aqui para criar sua própria publicação na comunidade.',
      placement: 'bottom',
    },
    {
      target: '.tour-feed-main',
      content: 'Neste feed principal, você encontra discussões abertas. Filtre por categorias ou navegue.',
      placement: 'top',
    }
  ];

  return (
    <Joyride
      steps={steps}
      run={run}
      continuous
      scrollToFirstStep
      onEvent={handleJoyrideEvent}
      locale={{
        back: 'Voltar',
        close: 'Fechar',
        last: 'Concluir',
        next: 'Próximo',
        skip: 'Pular'
      }}
      options={{
        zIndex: 10000,
        primaryColor: 'var(--app-navy)',
        textColor: 'var(--app-slate)',
        width: 400,
        showProgress: true,
      }}
      styles={{
        buttonPrimary: {
          borderRadius: 0,
          backgroundColor: 'var(--app-navy)',
        },
        buttonBack: {
          marginRight: 10,
          color: 'var(--app-slate)',
        },
        buttonSkip: {
          color: 'var(--app-slate)',
        }
      }}
    />
  );
}
