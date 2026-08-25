# @usetheo/ui

Violet Forge design system — the generic React components and primitives that form the non-AI
foundation of the Theo UI stack. Apache-2.0, ESM-only.

This is the layer with **no agent in it**: the shell, the tables, the forms, the feedback states,
the dashboard pieces. [`@theokit/ui`](https://github.com/usetheokit/theokit-ui) builds on top of it
with the agent surfaces (chat threads, tool calls, approval cards) and shares the same tokens, so
the two compose without a visual seam.

**Rule of thumb:** if the component would exist in an app with no agent in it, it belongs here.

## Install

```bash
pnpm add @usetheo/ui
```

Or copy a single component, shadcn-style, from the published registry:

```bash
npx shadcn@latest add https://usetheodev.github.io/usetheo-ui/r/data-table.json
```

## Catalog

<!-- BEGIN:catalog -->

**87 components** — 45 primitives + 42 composites.

### Primitives (45)

`ActionBar` · `Alert` · `Avatar` · `Badge` · `Breadcrumb` · `Button` · `Card` · `Checkbox` · `Combobox` · `CopyButton` · `DangerZone` · `DescriptionList` · `Dialog` · `DropdownMenu` · `EmptyState` · `FileDropzone` · `FormField` · `Input` · `JsonViewer` · `Label` · `LoginSplit` · `MetricsPanel` · `Pagination` · `PinInput` · `PlanBadge` · `Progress` · `RadioGroup` · `ScrollArea` · `Select` · `Sheet` · `Sidebar` · `Skeleton` · `Slider` · `SocialAuthRow` · `StatTile` · `StatusDot` · `Switch` · `Table` · `Tabs` · `Textarea` · `Timestamp` · `Toast` · `Tooltip` · `Topnav` · `UpdateBanner`

### Composites (42)

`AccountMenu` · `AnnotationInput` · `AnnotationSummaryGroup` · `AttributesTable` · `ChatMessageCard` · `CodeBlock` · `CommandPalette` · `CommentThread` · `ConfirmDialog` · `DataTable` · `DatasetItemDiff` · `DeploymentRow` · `DiffView` · `DomainConfig` · `EnvVarEditor` · `EvaluatorForm` · `Histogram` · `IoCards` · `MessageBranchSelector` · `MetricCard` · `PageShell` · `PercentileChart` · `PreviewEnvCard` · `PriceBreakdown` · `ProjectCard` · `PromptTemplateEditor` · `PromptVersionDiff` · `RollbackUi` · `SessionSummary` · `SessionTimeline` · `SeverityBadge` · `SpanGraph` · `SpanTree` · `SpanWaterfall` · `StatusIndicator` · `Stepper` · `TagInput` · `TaskHeader` · `TokenCostBreakdown` · `TraceCompare` · `TraceTranscript` · `TrendChart`

<!-- END:catalog -->

Generated from `src/components/` by `pnpm sync:readme` — do not edit the block above by hand.

## Theming

The tokens come from the Violet Forge foundation shipped here (`tailwind-preset`, `themes`, `cn`).
Consumers that also install `@theokit/ui` get the same token names, so a theme defined once applies
to both packages.

## Development

```bash
pnpm install
pnpm dev              # Ladle catalog
pnpm test
pnpm typecheck
pnpm lint
pnpm build
pnpm sync:readme      # regenerate the catalog block above
pnpm registry:build   # rebuild registry/r/*.json for the shadcn path
```

> Seeded from `theo-ui` @ `2b46eca` (2026-07-03, AI-exclusive pivot milestone M-B).
