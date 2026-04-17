import { createContext, useContext, useState, useEffect, type ReactNode } from 'react';
import { supabase } from '../lib/supabase';

interface OnboardingContextValue {
  needsOnboarding: boolean;
  sandboxStep: number;
  setSandboxStep: (step: number) => void;
  completeOnboarding: () => Promise<void>;
  toggleDev: () => Promise<void>;
}

const OnboardingContext = createContext<OnboardingContextValue>({
  needsOnboarding: false,
  sandboxStep: 1,
  setSandboxStep: () => {},
  completeOnboarding: async () => {},
  toggleDev: async () => {},
});

export function OnboardingProvider({ children }: { children: ReactNode }) {
  const [needsOnboarding, setNeedsOnboarding] = useState(false);
  const [sandboxStep, setSandboxStep] = useState(1);
  const [userId, setUserId] = useState<string | null>(null);

  useEffect(() => {
    const load = async () => {
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) return;
      setUserId(session.user.id);
      const { data } = await supabase
        .from('profiles')
        .select('onboarding_completed')
        .eq('id', session.user.id)
        .single();
      if (data) setNeedsOnboarding(!data.onboarding_completed);
    };
    load();
  }, []);

  const completeOnboarding = async () => {
    if (!userId) return;
    await supabase.from('profiles').update({ onboarding_completed: true }).eq('id', userId);
    setNeedsOnboarding(false);
  };

  const toggleDev = async () => {
    if (!userId) return;
    const next = !needsOnboarding;
    await supabase.from('profiles').update({ onboarding_completed: !next }).eq('id', userId);
    setNeedsOnboarding(next);
    if (next) setSandboxStep(1);
  };

  return (
    <OnboardingContext.Provider value={{ needsOnboarding, sandboxStep, setSandboxStep, completeOnboarding, toggleDev }}>
      {children}
    </OnboardingContext.Provider>
  );
}

export function useOnboarding() {
  return useContext(OnboardingContext);
}
