interface Step { label: string; }

/**
 * Renders a vertical step-by-step progress indicator with done, active, and pending states.
 * @param steps - Ordered list of step definitions, each with a label.
 * @param currentStep - Zero-based index of the currently active step; steps before it are shown as done.
 */
export function ProgressStepper({ steps, currentStep }: { steps: Step[]; currentStep: number }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
      {steps.map((step, i) => {
        const isDone   = i < currentStep;
        const isActive = i === currentStep;
        const isLast   = i === steps.length - 1;
        return (
          <div key={i} style={{ display: 'flex', alignItems: 'flex-start', gap: 12 }}>
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 22, flexShrink: 0 }}>
              <div style={{
                width: 22, height: 22, borderRadius: '50%',
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                background: isDone ? '#43B02A' : isActive ? '#0522BA' : '#F5F5F7',
                border: `2px solid ${isDone ? '#43B02A' : isActive ? '#0522BA' : '#EBEBEF'}`,
                transition: 'all 0.3s ease',
              }}>
                {isDone && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isActive && (
                  <div style={{ width: 7, height: 7, borderRadius: '50%', background: 'white', animation: 'pulse-dot 1s ease-in-out infinite' }} />
                )}
              </div>
              {!isLast && (
                <div style={{ width: 2, height: 26, background: isDone ? '#43B02A' : '#EBEBEF', borderRadius: 1, transition: 'background 0.4s ease 0.15s' }} />
              )}
            </div>
            <div style={{ paddingTop: 2, paddingBottom: isLast ? 0 : 26 }}>
              <span style={{
                fontSize: 14, lineHeight: '22px',
                fontWeight: isActive ? 700 : isDone ? 500 : 400,
                color: isDone ? '#178217' : isActive ? '#0A0A0A' : '#9DA0B2',
                transition: 'color 0.3s',
              }}>
                {isDone ? '✓ ' : ''}{step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
