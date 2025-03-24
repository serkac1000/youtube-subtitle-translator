import { Switch, Route } from "wouter";
import { queryClient } from "./lib/queryClient";
import { QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "@/components/ui/toaster";
import NotFound from "@/pages/not-found";
import Home from "@/pages/Home";

// Import the Google Material Icons
import 'material-icons/iconfont/material-icons.css';

// Add global styles for speech wave animation
const globalStyle = document.createElement('style');
globalStyle.innerHTML = `
.speech-wave {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 24px;
}

.speech-wave span {
  display: inline-block;
  width: 3px;
  height: 100%;
  margin: 0 1px;
  background-color: #2196F3;
  animation: wave 1s infinite ease-in-out;
  opacity: 0.2;
}

.speech-wave.active span {
  opacity: 1;
}

.speech-wave span:nth-child(1) { animation-delay: 0s; }
.speech-wave span:nth-child(2) { animation-delay: 0.1s; }
.speech-wave span:nth-child(3) { animation-delay: 0.2s; }
.speech-wave span:nth-child(4) { animation-delay: 0.3s; }
.speech-wave span:nth-child(5) { animation-delay: 0.4s; }

@keyframes wave {
  0%, 100% { transform: scaleY(0.2); }
  50% { transform: scaleY(1.0); }
}

::-webkit-scrollbar {
  width: 8px;
  height: 8px;
}

::-webkit-scrollbar-track {
  background: #1e1e1e;
}

::-webkit-scrollbar-thumb {
  background: #555;
  border-radius: 4px;
}

::-webkit-scrollbar-thumb:hover {
  background: #777;
}
`;
document.head.appendChild(globalStyle);

function Router() {
  return (
    <Switch>
      <Route path="/" component={Home} />
      <Route component={NotFound} />
    </Switch>
  );
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <Router />
      <Toaster />
    </QueryClientProvider>
  );
}

export default App;
