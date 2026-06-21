import { Link } from "react-router-dom";
import { Card, CardHeader, CardBody } from "@/components/ui/Card";
import { PageHeader } from "@/components/ui/PageHeader";
import { Button } from "@/components/ui/Button";
import { isBrowserObsSupported, isDesktopApp } from "@/lib/runtimeEnv";

const steps = [
  {
    step: 1,
    title: "Select a reference face",
    body: "In the studio, pick a saved preset or upload a clear photo of the face you want to swap to.",
  },
  {
    step: 2,
    title: "Start camera and swap",
    body: "Open your camera, then start face swap. The right panel shows the swapped output.",
  },
  {
    step: 3,
    title: "OBS Virtual Camera",
    body: "Install OBS Studio 28+ and enable WebSocket (Tools → WebSocket Server Settings). Start swap, then click Start OBS Virtual Camera in Studio. Use the desktop app (pnpm dev:desktop) or open Morphix at http://127.0.0.1:5173 in your browser on the same PC as OBS.",
  },
  {
    step: 4,
    title: "Use in calls",
    body: "In Zoom, Discord, or Teams, select OBS Virtual Camera as your camera. You should see your swapped face.",
  },
];

export function HelpPage() {
  return (
    <div className="max-w-3xl mx-auto animate-fade-up">
      <PageHeader
        title="Setup guide"
        description="How to use Morphix face swap in calls and streams."
        action={
          <Link to="/studio">
            <Button variant="primary" size="sm">Open studio</Button>
          </Link>
        }
      />

      {!isDesktopApp() && !isBrowserObsSupported() && (
        <Card className="mb-4">
          <CardBody>
            <p className="text-sm text-[var(--text-secondary)]">
              OBS Virtual Camera works on the same PC as OBS Studio. Use the desktop app{" "}
              <code className="text-xs bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">pnpm dev:desktop</code> or run{" "}
              <code className="text-xs bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">pnpm dev</code> and open{" "}
              <code className="text-xs bg-[var(--bg-muted)] px-1.5 py-0.5 rounded">http://127.0.0.1:5173</code>.
            </p>
          </CardBody>
        </Card>
      )}

      <div className="space-y-4">
        {steps.map((s) => (
          <Card key={s.step}>
            <CardHeader>
              <h2 className="text-base font-semibold">
                Step {s.step}: {s.title}
              </h2>
            </CardHeader>
            <CardBody>
              <p className="text-sm text-[var(--text-secondary)] leading-relaxed">{s.body}</p>
            </CardBody>
          </Card>
        ))}
      </div>
    </div>
  );
}
