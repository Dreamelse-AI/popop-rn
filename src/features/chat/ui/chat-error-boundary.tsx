import { Component, type ErrorInfo, type ReactNode } from 'react';
import { View, Text, Pressable, StyleSheet } from 'react-native';

type ChatErrorBoundaryProps = {
  children: ReactNode;
  fallback: ReactNode;
};

type ChatErrorBoundaryState = {
  hasError: boolean;
};

export class ChatErrorBoundary extends Component<ChatErrorBoundaryProps, ChatErrorBoundaryState> {
  state: ChatErrorBoundaryState = { hasError: false };

  static getDerivedStateFromError(): ChatErrorBoundaryState {
    return { hasError: true };
  }

  componentDidCatch(error: Error, info: ErrorInfo) {
    console.error('[ChatErrorBoundary]', error, info.componentStack);
  }

  render() {
    if (this.state.hasError) {
      return this.props.fallback;
    }

    return this.props.children;
  }
}

type ChatErrorFallbackProps = {
  onBack: () => void;
  onRetry?: () => void;
};

export function ChatErrorFallback({ onBack, onRetry }: ChatErrorFallbackProps) {
  return (
    <View style={styles.container}>
      <Text style={styles.message}>聊天页面出现问题，请稍后重试</Text>
      <View style={styles.buttons}>
        <Pressable onPress={onBack} style={styles.backButton}>
          <Text style={styles.backButtonText}>返回</Text>
        </Pressable>
        {onRetry && (
          <Pressable onPress={onRetry} style={styles.retryButton}>
            <Text style={styles.retryButtonText}>重试</Text>
          </Pressable>
        )}
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fbf2d8',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 16,
    paddingHorizontal: 24,
  },
  message: {
    fontSize: 14,
    color: 'rgba(0,0,0,0.5)',
    textAlign: 'center',
  },
  buttons: {
    flexDirection: 'row',
    gap: 12,
  },
  backButton: {
    borderRadius: 9999,
    backgroundColor: 'rgba(0,0,0,0.1)',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  backButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: 'rgba(0,0,0,0.7)',
  },
  retryButton: {
    borderRadius: 9999,
    backgroundColor: '#000000',
    paddingHorizontal: 20,
    paddingVertical: 8,
  },
  retryButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#ffffff',
  },
});
