interface Step { label: string; }

/**
 * Renders a vertical step-by-step progress indicator with done, active, and pending states.
 * @param steps - Ordered list of step definitions, each with a label.
 * @param currentStep - Zero-based index of the currently active step; steps before it are shown as done.
 */
export function ProgressStepper({ steps, currentStep }: { steps: Step[]; currentStep: number }) {
  return (
    <div className="flex flex-col gap-0">
      {steps.map((step, i) => {
        const isDone   = i < currentStep;
        const isActive = i === currentStep;
        const isLast   = i === steps.length - 1;
        return (
          <div key={i} className="flex items-start gap-3">
            <div className="flex flex-col items-center w-[22px] shrink-0">
              <div
                className={`w-[22px] h-[22px] rounded-full flex items-center justify-center shrink-0 border-2 transition-all duration-300 ${
                  isDone   ? 'bg-green-50 border-green-50' :
                  isActive ? 'bg-primary-100 border-primary-100' :
                             'bg-content-4 border-content-8'
                }`}
              >
                {isDone && (
                  <svg width="10" height="8" viewBox="0 0 10 8" fill="none">
                    <path d="M1 4L3.5 6.5L9 1" stroke="white" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round"/>
                  </svg>
                )}
                {isActive && (
                  <div className="w-[7px] h-[7px] rounded-full bg-white animate-pulse-dot" />
                )}
              </div>
              {!isLast && (
                <div
                  className={`w-[2px] h-[26px] rounded-[1px] transition-colors duration-[400ms] delay-150 ${isDone ? 'bg-green-50' : 'bg-content-8'}`}
                />
              )}
            </div>
            <div className={`pt-[2px] ${isLast ? '' : 'pb-[26px]'}`}>
              <span
                className={`text-sm leading-[22px] transition-colors duration-300 ${
                  isDone   ? 'font-medium text-green-80' :
                  isActive ? 'font-bold text-fg-strong' :
                             'font-normal text-content-36'
                }`}
              >
                {isDone ? '✓ ' : ''}{step.label}
              </span>
            </div>
          </div>
        );
      })}
    </div>
  );
}
