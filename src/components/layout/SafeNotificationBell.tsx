"use client";

import { Component, type ReactNode } from "react";
import { NotificationBell } from "./NotificationBell";

class NotificationBellBoundary extends Component<
  { children: ReactNode },
  { error: boolean }
> {
  state = { error: false };

  static getDerivedStateFromError() {
    return { error: true };
  }

  render() {
    if (this.state.error) return null;
    return this.props.children;
  }
}

export function SafeNotificationBell() {
  return (
    <NotificationBellBoundary>
      <NotificationBell />
    </NotificationBellBoundary>
  );
}
