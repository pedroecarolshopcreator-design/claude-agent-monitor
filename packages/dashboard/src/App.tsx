import { Shell } from './components/layout/Shell';
import { useSession } from './hooks/use-session';
import { useSSE } from './hooks/use-sse';
import { useProject } from './hooks/use-project';
import { useSprint } from './hooks/use-sprint';
import { useTasks } from './hooks/use-tasks';

export default function App() {
  const session = useSession();
  useSSE(session?.id);
  useProject();
  useSprint();
  useTasks();

  return <Shell />;
}
