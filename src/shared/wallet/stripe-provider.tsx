import Constants from 'expo-constants';
import { StripeProvider } from '@stripe/stripe-react-native';
import type { ReactElement, ReactNode } from 'react';

const stripePublishableKey =
  process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY?.trim() ||
  (Constants.expoConfig?.extra?.stripePublishableKey as string | undefined)?.trim() ||
  '';

type AppStripeProviderProps = {
  children: ReactNode;
};

function asStripeChild(node: ReactNode): ReactElement | ReactElement[] {
  if (Array.isArray(node)) {
    return node as ReactElement[];
  }
  return node as ReactElement;
}

export function AppStripeProvider({ children }: AppStripeProviderProps) {
  if (!stripePublishableKey) {
    return <>{children}</>;
  }

  return (
    <StripeProvider publishableKey={stripePublishableKey} merchantIdentifier="merchant.com.popop.app">
      {asStripeChild(children)}
    </StripeProvider>
  );
}

export { stripePublishableKey };
