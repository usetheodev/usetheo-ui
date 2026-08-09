import type { Story } from "@ladle/react";
import { X } from "lucide-react";
import { Button } from "../../primitives/button/index.js";
import { TaskHeader } from "./task-header.js";

export default { title: "Composites / Agent / TaskHeader" };

export const Statuses: Story = () => (
  <div className="grid max-w-2xl gap-3">
    <TaskHeader title="Organise the screenshots" status="idle" />
    <TaskHeader title="Requesting access permission" status="permission_required" />
    <TaskHeader title="Bootstrapping environment" status="starting" />
    <TaskHeader
      title="Organise the screenshots"
      status="running"
      onToggle={() => undefined}
      actions={
        <Button size="icon" variant="ghost" aria-label="Close">
          <X />
        </Button>
      }
    />
    <TaskHeader title="Create expense report" status="completed" />
    <TaskHeader title="Deploy failed" status="failed" />
  </div>
);
