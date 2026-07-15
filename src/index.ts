// @usetheo/ui barrel — seeded from theo-ui (pivot M-B). 54 non-AI components + Violet Forge foundation.

export { cn } from "./lib/cn.js";
export {
  aggregateCost,
  asChat,
  contentText,
  isRedactedThinking,
  buildLayeredGraph,
  computeBarLayout,
  computeTraceBounds,
  deriveSpanKind,
  durationMs,
  flattenAll,
  flattenVisible,
  GRAPH_NODE_CAP,
  isSpanError,
  KIND_LABEL,
  niceAxisTicks,
  packRows,
  prettyValue,
  spanCostUsd,
  toNs,
  alignSpanTrees,
  groupByNamespace,
  traceMetrics,
  toTranscriptRows,
  VIRTUALIZE_THRESHOLD,
} from "./lib/trace/index.js";
export type {
  AlignDelta,
  AlignRow,
  AttributeGroup,
  AxisTick,
  BarLayout,
  ChatMessage,
  FlatSpan,
  GraphEdge,
  GraphNode,
  LayeredGraph,
  SpanKind,
  SpanStatus,
  ToolCall,
  TraceSpan,
  TranscriptRow,
  TranscriptRowStats,
} from "./lib/trace/index.js";

export { Button, buttonVariants, type ButtonProps } from "./components/primitives/button/index.js";
export { Badge, badgeVariants, type BadgeProps } from "./components/primitives/badge/index.js";
export {
  Breadcrumb,
  type BreadcrumbLinkProps,
} from "./components/primitives/breadcrumb/index.js";
export {
  DescriptionList,
  type DescriptionListProps,
} from "./components/primitives/description-list/index.js";
export { JsonViewer, type JsonViewerProps } from "./components/primitives/json-viewer/index.js";
export {
  Combobox,
  type ComboboxContentProps,
  type ComboboxInputProps,
  type ComboboxItemProps,
  type ComboboxProps,
} from "./components/primitives/combobox/index.js";
export {
  Slider,
  type SliderMark,
  type SliderProps,
} from "./components/primitives/slider/index.js";
export {
  UpdateBanner,
  type UpdateBannerProps,
} from "./components/primitives/update-banner/index.js";
export { Card } from "./components/primitives/card/index.js";
export { Input, type InputProps } from "./components/primitives/input/index.js";
export { Dialog } from "./components/primitives/dialog/index.js";
export { Tabs } from "./components/primitives/tabs/index.js";
export { Tooltip } from "./components/primitives/tooltip/index.js";
export {
  ScrollArea,
  isNearBottom,
  type StickToBottomMetrics,
  useStickToBottom,
  type UseStickToBottomOptions,
  type UseStickToBottomReturn,
} from "./components/primitives/scroll-area/index.js";
export {
  Toast,
  type ToastVariant,
  Toaster,
  useToast,
} from "./components/primitives/toast/index.js";
export { Skeleton } from "./components/primitives/skeleton/index.js";
export { Avatar, avatarVariants } from "./components/primitives/avatar/index.js";
export { Label } from "./components/primitives/label/index.js";
export { FormField } from "./components/primitives/form-field/index.js";
export { EmptyState } from "./components/primitives/empty-state/index.js";
export { Select } from "./components/primitives/select/index.js";
export { Checkbox } from "./components/primitives/checkbox/index.js";
export { RadioGroup } from "./components/primitives/radio-group/index.js";
export { Switch } from "./components/primitives/switch/index.js";
export { Textarea, type TextareaProps } from "./components/primitives/textarea/index.js";
export { Sidebar } from "./components/primitives/sidebar/index.js";
export { TopNav } from "./components/primitives/topnav/index.js";
export { Sheet, sheetVariants } from "./components/primitives/sheet/index.js";
export { Progress, type ProgressProps } from "./components/primitives/progress/index.js";
export {
  PlanBadge,
  type PlanBadgeProps,
  type PlanTier,
} from "./components/primitives/plan-badge/index.js";
export {
  AccountMenu,
  type AccountMenuProps,
} from "./components/composites/account-menu/index.js";
export {
  Table,
  type TableProps,
  type TableCellProps,
  type TableHeaderCellProps,
} from "./components/primitives/table/index.js";
export {
  StatusDot,
  type StatusDotProps,
  type StatusKind,
} from "./components/primitives/status-dot/index.js";
export {
  CopyButton,
  type CopyButtonProps,
} from "./components/primitives/copy-button/index.js";
export { Timestamp, type TimestampProps } from "./components/primitives/timestamp/index.js";
export { StatTile, type StatTileProps } from "./components/primitives/stat-tile/index.js";
export {
  DangerZone,
  type DangerZoneProps,
  type DangerZoneActionProps,
} from "./components/primitives/danger-zone/index.js";
export {
  ConfirmDialog,
  type ConfirmDialogProps,
} from "./components/composites/confirm-dialog/index.js";
export { CodeBlock, type CodeBlockProps } from "./components/composites/code-block/index.js";
export {
  StatusIndicator,
  type StatusIndicatorKind,
  type StatusIndicatorProps,
  type StatusIndicatorSize,
} from "./components/composites/status-indicator/index.js";
export {
  MetricCard,
  type MetricCardDelta,
  type MetricCardProps,
  type MetricCardTrend,
} from "./components/composites/metric-card/index.js";
export { Alert, type AlertProps, type AlertIntent } from "./components/primitives/alert/index.js";
export {
  Pagination,
  computePageRange,
  type PaginationProps,
} from "./components/primitives/pagination/index.js";
export { DropdownMenu } from "./components/primitives/dropdown-menu/index.js";
export { ActionBar, type ActionBarProps } from "./components/primitives/action-bar/index.js";
export { PinInput, type PinInputProps } from "./components/primitives/pin-input/index.js";
export {
  DataTable,
  type DataTableColumn,
  type DataTableProps,
  type DataTableSort,
  type DataTableVirtualizedOptions,
} from "./components/composites/data-table/index.js";
export { PageShell, type PageShellProps } from "./components/composites/page-shell/index.js";
export {
  linScale,
  niceMax,
  seriesPath,
  TrendChart,
  type TrendChartProps,
  type TrendPoint,
  type TrendSeries,
} from "./components/composites/trend-chart/index.js";
export {
  Stepper,
  deriveSteps,
  type StepStatus,
  type StepperProps,
  type StepperStepData,
} from "./components/composites/stepper/index.js";
export {
  FileDropzone,
  matchesAccept,
  validateFiles,
  type FileDropzoneError,
  type FileDropzoneErrorCode,
  type FileDropzoneProps,
  type FileDropzoneState,
  type FileRejection,
  type ValidateFilesOptions,
} from "./components/primitives/file-dropzone/index.js";
export { MetricsPanel, type Metric } from "./components/primitives/metrics-panel/index.js";
export {
  SocialAuthRow,
  type SocialProvider,
} from "./components/primitives/social-auth-row/index.js";
export { LoginSplit } from "./components/primitives/login-split/index.js";
export { TaskHeader } from "./components/composites/task-header/index.js";
export {
  DeploymentRow,
  type Deployment,
  type DeploymentStatus,
} from "./components/composites/deployment-row/index.js";
export { ProjectCard, type Project } from "./components/composites/project-card/index.js";
export {
  EnvVarEditor,
  type EnvScope,
  type EnvVar,
} from "./components/composites/env-var-editor/index.js";
export {
  PreviewEnvCard,
  type PreviewEnv,
  type PreviewService,
} from "./components/composites/preview-env-card/index.js";
export {
  DomainConfig,
  type Domain,
  type DomainStatus,
} from "./components/composites/domain-config/index.js";
export {
  RollbackUI,
  type RollbackTarget,
} from "./components/composites/rollback-ui/index.js";
export {
  CommandPalette,
  type CommandItem,
} from "./components/composites/command-palette/index.js";
export { SpanTree, SpanTreeRow } from "./components/composites/span-tree/index.js";
export type {
  SpanTreeProps,
  SpanTreeRowProps,
  SpanTreeRenderCtx,
} from "./components/composites/span-tree/index.js";
export { SpanWaterfall } from "./components/composites/span-waterfall/index.js";
export type { SpanWaterfallProps } from "./components/composites/span-waterfall/index.js";
export { AttributesTable } from "./components/composites/attributes-table/index.js";
export type { AttributesTableProps } from "./components/composites/attributes-table/index.js";
export { IOCards, MessageCard, MessageItem } from "./components/composites/io-cards/index.js";
export type { IOCardsProps, RenderMarkdown } from "./components/composites/io-cards/index.js";
export { TraceTranscript } from "./components/composites/trace-transcript/index.js";
export type { TraceTranscriptProps } from "./components/composites/trace-transcript/index.js";
export { SpanGraph } from "./components/composites/span-graph/index.js";
export type { SpanGraphProps } from "./components/composites/span-graph/index.js";
export { TraceCompare } from "./components/composites/trace-compare/index.js";
export type {
  TraceCompareProps,
  CompareLane,
} from "./components/composites/trace-compare/index.js";
export { aggregateSession } from "./lib/session/index.js";
export type { SessionTraceItem, SessionMetrics } from "./lib/session/index.js";
export { SessionSummary } from "./components/composites/session-summary/index.js";
export type { SessionSummaryProps } from "./components/composites/session-summary/index.js";
