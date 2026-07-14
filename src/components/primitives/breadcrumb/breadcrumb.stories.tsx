import type { Story } from "@ladle/react";
import { DotIcon } from "lucide-react";
import type { ReactNode } from "react";
import { Breadcrumb } from "./breadcrumb.js";

export default {
  title: "Primitives / Navigation / Breadcrumb",
};

const item = (label: string, href?: string) => (
  <Breadcrumb.Item key={label}>
    {href ? (
      <Breadcrumb.Link href={href}>{label}</Breadcrumb.Link>
    ) : (
      <Breadcrumb.Page>{label}</Breadcrumb.Page>
    )}
  </Breadcrumb.Item>
);

function Trail({ children }: { children: ReactNode }) {
  return (
    <Breadcrumb>
      <Breadcrumb.List>{children}</Breadcrumb.List>
    </Breadcrumb>
  );
}

export const Default: Story = () => (
  <Trail>
    {item("Home", "/")}
    <Breadcrumb.Separator />
    {item("Projects", "/projects")}
    <Breadcrumb.Separator />
    {item("Violet Forge")}
  </Trail>
);

export const CustomSeparator: Story = () => (
  <Trail>
    {item("Home", "/")}
    <Breadcrumb.Separator>
      <DotIcon />
    </Breadcrumb.Separator>
    {item("Settings", "/settings")}
    <Breadcrumb.Separator>
      <DotIcon />
    </Breadcrumb.Separator>
    {item("Domains")}
  </Trail>
);

/**
 * Collapsed levels: Ellipsis stands in for hidden ancestors. To make the
 * hidden levels navigable, wrap the Ellipsis in the existing <DropdownMenu>.
 */
export const CollapsedWithEllipsis: Story = () => (
  <Trail>
    {item("Home", "/")}
    <Breadcrumb.Separator />
    <Breadcrumb.Item>
      <Breadcrumb.Ellipsis />
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    {item("Components", "/components")}
    <Breadcrumb.Separator />
    {item("Breadcrumb")}
  </Trail>
);

/**
 * SPA router integration: `asChild` delegates rendering to the router's Link
 * (react-router, Next.js, TanStack Router) — no full page reload.
 */
export const RouterLinkAsChild: Story = () => (
  <Trail>
    <Breadcrumb.Item>
      <Breadcrumb.Link asChild>
        {/* stands in for a router <Link to="/">; the lib takes no router dep */}
        <a href="/" data-router-link>
          Home
        </a>
      </Breadcrumb.Link>
    </Breadcrumb.Item>
    <Breadcrumb.Separator />
    {item("Current")}
  </Trail>
);
