import * as React from "react";
import type { ToastItem, ToastVariant } from "../components/ui/toast";
import { mapFriendlyError } from "../lib/errorMapper";

export type ToasterToast = ToastItem;

interface ToastOptions {
  title?: React.ReactNode;
  description?: React.ReactNode;
  variant?: ToastVariant;
  duration?: number;
}

type Action =
  | { type: "ADD_TOAST"; toast: ToasterToast }
  | { type: "DISMISS_TOAST"; toastId?: string }
  | { type: "REMOVE_TOAST"; toastId?: string };

interface State {
  toasts: ToasterToast[];
}

let count = 0;
function genId() {
  count = (count + 1) % Number.MAX_SAFE_INTEGER;
  return count.toString();
}

const toastTimeouts = new Map<string, ReturnType<typeof setTimeout>>();

const listeners: Array<(state: State) => void> = [];
let memoryState: State = { toasts: [] };

function dispatch(action: Action) {
  memoryState = reducer(memoryState, action);
  listeners.forEach((listener) => {
    listener(memoryState);
  });
}

function reducer(state: State, action: Action): State {
  switch (action.type) {
    case "ADD_TOAST": {
      // Clear existing timeouts since newer replaces older
      toastTimeouts.forEach((timeout) => clearTimeout(timeout));
      toastTimeouts.clear();

      return {
        ...state,
        toasts: [action.toast],
      };
    }
    case "DISMISS_TOAST": {
      const { toastId } = action;
      if (toastId) {
        const timeout = toastTimeouts.get(toastId);
        if (timeout) {
          clearTimeout(timeout);
          toastTimeouts.delete(toastId);
        }
      } else {
        toastTimeouts.forEach((timeout) => clearTimeout(timeout));
        toastTimeouts.clear();
      }

      return {
        ...state,
        toasts: toastId ? state.toasts.filter((t) => t.id !== toastId) : [],
      };
    }
    case "REMOVE_TOAST": {
      return {
        ...state,
        toasts: action.toastId ? state.toasts.filter((t) => t.id !== action.toastId) : [],
      };
    }
    default:
      return state;
  }
}

/**
 * Trigger a toast notification.
 * Auto-dismiss:
 * - 5000ms for errors/destructive
 * - 4000ms for success, info, warning
 */
export function toast(props: ToastOptions) {
  const id = genId();
  const isError = props.variant === "destructive" || props.variant === "error";
  const duration = props.duration ?? (isError ? 5000 : 4000);

  const newToast: ToasterToast = {
    ...props,
    id,
    duration,
  };

  dispatch({ type: "ADD_TOAST", toast: newToast });

  const timeout = setTimeout(() => {
    dispatch({ type: "DISMISS_TOAST", toastId: id });
    toastTimeouts.delete(id);
  }, duration);

  toastTimeouts.set(id, timeout);

  return {
    id,
    dismiss: () => dispatch({ type: "DISMISS_TOAST", toastId: id }),
  };
}

/**
 * Convenience helper to map and display any caught error gracefully.
 */
export function toastError(error: any, fallbackTitle: string = "Something went wrong") {
  const friendly = mapFriendlyError(error, fallbackTitle);
  return toast({
    title: friendly.title,
    description: friendly.message,
    variant: "error",
  });
}

export function useToast() {
  const [state, setState] = React.useState<State>(memoryState);

  React.useEffect(() => {
    listeners.push(setState);
    return () => {
      const index = listeners.indexOf(setState);
      if (index > -1) {
        listeners.splice(index, 1);
      }
    };
  }, [state]);

  return {
    ...state,
    toast,
    toastError,
    dismiss: (toastId?: string) => dispatch({ type: "DISMISS_TOAST", toastId }),
  };
}
