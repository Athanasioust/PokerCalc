import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet } from 'react-native';

interface State { hasError: boolean; }

export default class ErrorBoundary extends React.Component<
  { children: React.ReactNode },
  State
> {
  state: State = { hasError: false };

  static getDerivedStateFromError(): State {
    return { hasError: true };
  }

  render() {
    if (this.state.hasError) {
      return (
        <View style={styles.container}>
          <Text style={styles.emoji}>♠</Text>
          <Text style={styles.title}>Something went wrong</Text>
          <Text style={styles.body}>
            An unexpected error occurred. Tap below to restart.
          </Text>
          <TouchableOpacity
            style={styles.btn}
            onPress={() => this.setState({ hasError: false })}
          >
            <Text style={styles.btnText}>Restart App</Text>
          </TouchableOpacity>
        </View>
      );
    }
    return this.props.children;
  }
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#1a1a2e',
    alignItems: 'center',
    justifyContent: 'center',
    padding: 32,
  },
  emoji: {
    fontSize: 64,
    color: '#fff',
    marginBottom: 16,
  },
  title: {
    fontSize: 22,
    fontWeight: '800',
    color: '#fff',
    marginBottom: 10,
  },
  body: {
    fontSize: 15,
    color: '#aaa',
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  btn: {
    backgroundColor: '#fff',
    paddingHorizontal: 28,
    paddingVertical: 14,
    borderRadius: 12,
  },
  btnText: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a2e',
  },
});
