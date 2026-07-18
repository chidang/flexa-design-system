/**
 * flexa-ui public surface. Components + the shared vocabulary (enums), the icon
 * system, and the showcase registry that powers the kitchen-sink and docs.
 *
 * CSS is a side-effect import consumers add separately:
 *   import 'flexa-ui-kit/styles.css';
 */
export const UI_VERSION = '0.1.0';

// Shared vocabulary
export * from './enums';

// Status → tone (doc 04 §5 binding table — single source for domain components)
export { statusTone, formatStatusLabel } from './status-tone';
export type { StatusToneContext } from './status-tone';

// Icons
export { FxIcon } from './icon/FxIcon';
export type { FxIconProps, IconSize } from './icon/FxIcon';
export { ICON_MAP, ICON_NAMES } from './icon/map';
export type { IconName } from './icon/map';

// Components — U1 Form primitives
export { FxButton } from './button/button';
export type { FxButtonProps } from './button/button';
export { FxInput } from './input/input';
export type { FxInputProps, InputChangeMeta } from './input/input';
export { FxTextarea } from './textarea/textarea';
export type { FxTextareaProps, TextareaChangeMeta } from './textarea/textarea';
export { FxCheckbox } from './checkbox/checkbox';
export type { FxCheckboxProps, CheckboxChangeMeta } from './checkbox/checkbox';
export { FxRadioGroup } from './radio-group/radio-group';
export type { FxRadioGroupProps, RadioOption, RadioChangeMeta } from './radio-group/radio-group';
export { FxSwitch } from './switch/switch';
export type { FxSwitchProps, SwitchChangeMeta } from './switch/switch';
export { FxFieldGroup } from './field-group/field-group';
export type { FxFieldGroupProps } from './field-group/field-group';
export { FxValidationMessage } from './validation-message/validation-message';
export type { FxValidationMessageProps, ValidationTone } from './validation-message/validation-message';

// Components — U2 Display primitives
export { FxBadge } from './badge/badge';
export type { FxBadgeProps, BadgeAppearance } from './badge/badge';
export { FxTag } from './tag/tag';
export type { FxTagProps } from './tag/tag';
export { FxChip } from './chip/chip';
export type { FxChipProps } from './chip/chip';
export { FxAvatar } from './avatar/avatar';
export type { FxAvatarProps, AvatarSize, AvatarShape, AvatarStatus } from './avatar/avatar';
export { FxProgress } from './progress/progress';
export type { FxProgressProps } from './progress/progress';
export { FxSkeletonLoader } from './skeleton/skeleton';
export type { FxSkeletonLoaderProps, SkeletonShape } from './skeleton/skeleton';
export { FxEmptyState } from './empty-state/empty-state';
export type { FxEmptyStateProps, EmptyStateSize } from './empty-state/empty-state';
export { FxCard } from './card/card';
export type { FxCardProps, CardPadding, CardElement } from './card/card';
export { FxDescriptionList } from './description-list/description-list';
export type {
  FxDescriptionListProps,
  DescriptionListItem,
  DescriptionListLayout,
} from './description-list/description-list';

// Components — U3 Overlays & layering
export { FxToast, FxToastRegion, useToast } from './toast/toast';
export type {
  FxToastProps,
  FxToastRegionProps,
  ToastOptions,
  ToastController,
  ToastDismissReason,
} from './toast/toast';
export { FxAlert } from './alert/alert';
export type { FxAlertProps } from './alert/alert';
export { FxConfirmationDialog } from './confirmation-dialog/confirmation-dialog';
export type { FxConfirmationDialogProps } from './confirmation-dialog/confirmation-dialog';
export { FxDialog } from './dialog/dialog';
export type { FxDialogProps, DialogSize } from './dialog/dialog';
export { useModal } from './dialog/use-modal';
export type { UseModal, UseModalOptions, CloseReason } from './dialog/use-modal';
export { FxRightDrawer } from './right-drawer/right-drawer';
export type { FxRightDrawerProps, DrawerSize } from './right-drawer/right-drawer';
export { FxTooltip } from './tooltip/tooltip';
export type { FxTooltipProps, TooltipPlacement } from './tooltip/tooltip';
export { FxLoadingOverlay } from './loading-overlay/loading-overlay';
export type { FxLoadingOverlayProps } from './loading-overlay/loading-overlay';

// Components — U4 Navigation
export { FxTabs } from './tabs/tabs';
export type { FxTabsProps, TabItem } from './tabs/tabs';
export { FxBreadcrumb } from './breadcrumb/breadcrumb';
export type { FxBreadcrumbProps, BreadcrumbItem } from './breadcrumb/breadcrumb';
export { FxPagination } from './pagination/pagination';
export type { FxPaginationProps, PaginationLabels } from './pagination/pagination';
export { FxSearchBar } from './search-bar/search-bar';
export type { FxSearchBarProps } from './search-bar/search-bar';
export { FxCommandPalette } from './command-palette/command-palette';
export type { FxCommandPaletteProps, Command } from './command-palette/command-palette';
export { FxContextMenu } from './context-menu/context-menu';
export type { FxContextMenuProps, MenuItem } from './context-menu/context-menu';
export { FxSidebar } from './sidebar/sidebar';
export type { FxSidebarProps, SidebarItem } from './sidebar/sidebar';
export { FxNestedSidebar } from './nested-sidebar/nested-sidebar';
export type { FxNestedSidebarProps, NestedSidebarItem } from './nested-sidebar/nested-sidebar';
export { FxTopNavigation } from './top-navigation/top-navigation';
export type { FxTopNavigationProps, TopNavItem } from './top-navigation/top-navigation';
export { FxQuickActions } from './quick-actions/quick-actions';
export type { FxQuickActionsProps, QuickAction } from './quick-actions/quick-actions';
export { FxFloatingActionButton } from './fab/fab';
export type { FxFloatingActionButtonProps } from './fab/fab';

// Components — U5 Forms advanced
export { FxSelect } from './select/select';
export type { FxSelectProps, OptionItem, OptionGroup, SelectChangeMeta } from './select/select';
export { FxAutocomplete } from './autocomplete/autocomplete';
export type { FxAutocompleteProps, AutocompleteChangeMeta } from './autocomplete/autocomplete';
export { FxTagInput } from './tag-input/tag-input';
export type { FxTagInputProps, TagInputChangeMeta } from './tag-input/tag-input';
export { FxNumberInput } from './number-input/number-input';
export type { FxNumberInputProps, NumberChangeMeta } from './number-input/number-input';
export { FxCurrencyInput } from './currency-input/currency-input';
export type { FxCurrencyInputProps, Money, CurrencyChangeMeta } from './currency-input/currency-input';
export { FxPasswordInput } from './password-input/password-input';
export type {
  FxPasswordInputProps,
  PasswordChangeMeta,
  PasswordStrength,
} from './password-input/password-input';
export { FxEmailInput } from './email-input/email-input';
export type { FxEmailInputProps, EmailChangeMeta } from './email-input/email-input';
export { FxPhoneInput } from './phone-input/phone-input';
export type {
  FxPhoneInputProps,
  CountryOption,
  PhoneValue,
  PhoneChangeMeta,
} from './phone-input/phone-input';
export { FxUrlInput } from './url-input/url-input';
export type { FxUrlInputProps, UrlChangeMeta } from './url-input/url-input';
export { FxDatePicker } from './date-picker/date-picker';
export type {
  FxDatePickerProps,
  DatePickerChangeMeta,
  DatePickerLabels,
  IsoDate,
} from './date-picker/date-picker';
export { FxTimePicker } from './time-picker/time-picker';
export type {
  FxTimePickerProps,
  TimePickerChangeMeta,
  TimePickerLabels,
  IsoTime,
} from './time-picker/time-picker';
export { FxDateRangePicker } from './date-range-picker/date-range-picker';
export type {
  FxDateRangePickerProps,
  DateRange,
  DateRangeChangeMeta,
  DateRangePreset,
  DateRangeLabels,
} from './date-range-picker/date-range-picker';
export { FxSlider } from './slider/slider';
export type { FxSliderProps, SliderValue, SliderChangeMeta, SliderMark } from './slider/slider';
export { FxStepper } from './stepper/stepper';
export type { FxStepperProps, StepperChangeMeta } from './stepper/stepper';
export { FxColorPicker } from './color-picker/color-picker';
export type {
  FxColorPickerProps,
  ColorPickerChangeMeta,
  ColorPickerLabels,
} from './color-picker/color-picker';
export { FxFileUpload } from './file-upload/file-upload';
export type {
  FxFileUploadProps,
  UploadFile,
  UploadTransport,
  FileUploadLabels,
  FileUploadTriggerApi,
  FileUploadChangeMeta,
} from './file-upload/file-upload';
export { FxDragDropUpload } from './drag-drop-upload/drag-drop-upload';
export type { FxDragDropUploadProps } from './drag-drop-upload/drag-drop-upload';
export { FxAvatarUpload } from './avatar-upload/avatar-upload';
export type { FxAvatarUploadProps, AvatarUploadLabels } from './avatar-upload/avatar-upload';
export { FxImageGalleryUpload } from './image-gallery-upload/image-gallery-upload';
export type {
  FxImageGalleryUploadProps,
  ImageGalleryUploadLabels,
} from './image-gallery-upload/image-gallery-upload';
export { FxFormWizard } from './form-wizard/form-wizard';
export type {
  FxFormWizardProps,
  WizardStep,
  ValidationResult,
  FieldError,
  WizardDirection,
  WizardStepState,
  FormWizardLabels,
} from './form-wizard/form-wizard';

// Components — U6 Data display
export { FxTable, DEFAULT_TABLE_LABELS, nextSort } from './table/table';
export type {
  FxTableProps,
  TableColumn,
  TableSort,
  TableSelectable,
  TableLabels,
  Key,
} from './table/table';
export { FxVirtualTable, SELECT_ALL, ROW_HEIGHT, DEFAULT_OVERSCAN } from './virtual-table/virtual-table';
export type { FxVirtualTableProps } from './virtual-table/virtual-table';
export { FxDataGrid, DEFAULT_DATA_GRID_LABELS } from './data-grid/data-grid';
export type {
  FxDataGridProps,
  GridColumn,
  GridEditorType,
  GridOption,
  CellPos,
  CellEdit,
  ColumnState,
  DataGridLabels,
} from './data-grid/data-grid';
export { FxBulkActionsBar, DEFAULT_BULK_ACTIONS_LABELS } from './bulk-actions-bar/bulk-actions-bar';
export type {
  FxBulkActionsBarProps,
  BulkAction,
  BulkActionsLabels,
} from './bulk-actions-bar/bulk-actions-bar';
export { FxList } from './list/list';
export type { FxListProps, ListItem, ListItemState, ListSelectable, ListKey } from './list/list';
export { FxAccordion } from './accordion/accordion';
export type {
  FxAccordionProps,
  AccordionItem,
  AccordionVariant,
  AccordionHeadingLevel,
} from './accordion/accordion';
export { FxTree } from './tree/tree';
export type { FxTreeProps, TreeNode, TreeKey } from './tree/tree';
export { FxKanbanBoard, DEFAULT_KANBAN_LABELS } from './kanban-board/kanban-board';
export type {
  FxKanbanBoardProps,
  KanbanColumn,
  KanbanCard,
  CardMovePayload,
  KanbanLabels,
} from './kanban-board/kanban-board';
export { FxCalendar, DEFAULT_CALENDAR_LABELS } from './calendar/calendar';
export type {
  FxCalendarProps,
  CalendarEvent,
  CalendarView,
  CalendarLabels,
} from './calendar/calendar';
export { FxTimeline, DEFAULT_TIMELINE_LABELS } from './timeline/timeline';
export type { FxTimelineProps, TimelineItem, TimelineState, TimelineLabels } from './timeline/timeline';
export { FxGallery, DEFAULT_GALLERY_LABELS } from './gallery/gallery';
export type { FxGalleryProps, GalleryImage, GalleryLabels } from './gallery/gallery';
export { FxMediaGrid, DEFAULT_MEDIA_GRID_LABELS } from './media-grid/media-grid';
export type {
  FxMediaGridProps,
  MediaItem,
  MediaKind,
  MediaGridLabels,
} from './media-grid/media-grid';
export { FxStatisticBlock, DEFAULT_STATISTIC_BLOCK_LABELS } from './statistic-block/statistic-block';
export type {
  FxStatisticBlockProps,
  StatisticDelta,
  StatisticBlockLabels,
} from './statistic-block/statistic-block';
export { FxRating, DEFAULT_RATING_LABELS } from './rating/rating';
export type { FxRatingProps, RatingLabels } from './rating/rating';

// Components — U7 Layouts & dashboard
export { FxMetricCard } from './metric-card/metric-card';
export type { FxMetricCardProps, MetricCardDelta } from './metric-card/metric-card';
export { FxChartsContainer } from './charts-container/charts-container';
export type {
  FxChartsContainerProps,
  ChartLegendEntry,
  ChartsEmptyState,
} from './charts-container/charts-container';
export { FxStatisticsCard } from './statistics-card/statistics-card';
export type {
  FxStatisticsCardProps,
  StatisticsRangeOption,
} from './statistics-card/statistics-card';
export { FxWidget } from './widget/widget';
export type { FxWidgetProps, WidgetEmptyState } from './widget/widget';
export { FxAppShell } from './app-shell/app-shell';
export type { FxAppShellProps } from './app-shell/app-shell';
export { FxSidebarLayout } from './sidebar-layout/sidebar-layout';
export type {
  FxSidebarLayoutProps,
  SidebarLayoutAsideWidth,
} from './sidebar-layout/sidebar-layout';
export { FxTopNavigationLayout } from './top-navigation-layout/top-navigation-layout';
export type {
  FxTopNavigationLayoutProps,
  TopNavigationLayoutMaxWidth,
} from './top-navigation-layout/top-navigation-layout';
export { FxBottomNavigation } from './bottom-navigation/bottom-navigation';
export type {
  FxBottomNavigationProps,
  BottomNavItem,
} from './bottom-navigation/bottom-navigation';
export { FxContentArea } from './content-area/content-area';
export type {
  FxContentAreaProps,
  ContentAreaMaxWidth,
} from './content-area/content-area';
export { FxSplitView } from './split-view/split-view';
export type { FxSplitViewProps, SplitViewCollapsed } from './split-view/split-view';
export { FxWizardLayout } from './wizard-layout/wizard-layout';
export type { FxWizardLayoutProps } from './wizard-layout/wizard-layout';
export { FxSettingsLayout } from './settings-layout/settings-layout';
export type { FxSettingsLayoutProps, SettingsSection } from './settings-layout/settings-layout';
export { FxAuthenticationLayout } from './authentication-layout/authentication-layout';
export type { FxAuthenticationLayoutProps } from './authentication-layout/authentication-layout';
export { FxDashboardLayout } from './dashboard-layout/dashboard-layout';
export type { FxDashboardLayoutProps, DashboardGap } from './dashboard-layout/dashboard-layout';
export { FxBlankStateLayout } from './blank-state-layout/blank-state-layout';
export type { FxBlankStateLayoutProps } from './blank-state-layout/blank-state-layout';
export { FxActivityFeed, formatRelative } from './activity-feed/activity-feed';
export type {
  FxActivityFeedProps,
  ActivityItem,
  ActivityEmptyState,
} from './activity-feed/activity-feed';
export { FxRecentActivity } from './recent-activity/recent-activity';
export type { FxRecentActivityProps } from './recent-activity/recent-activity';
export { FxProgressSummary } from './progress-summary/progress-summary';
export type {
  FxProgressSummaryProps,
  ProgressSummaryItem,
} from './progress-summary/progress-summary';
export { FxQuickLinks } from './quick-links/quick-links';
export type { FxQuickLinksProps, QuickLink } from './quick-links/quick-links';

// Components — U8 Commerce
export { FxProductCard } from './product-card/product-card';
export type {
  FxProductCardProps,
  ProductSummary,
  ProductSeller,
  ProductCardLabels,
} from './product-card/product-card';
export { FxListingCard } from './listing-card/listing-card';
export type {
  FxListingCardProps,
  ListingSummary,
  ListingCardLabels,
} from './listing-card/listing-card';
export { FxPricingCard } from './pricing-card/pricing-card';
export type {
  FxPricingCardProps,
  PricingPlan,
  PricingFeature,
  PricingPeriod,
  PricingCardLabels,
} from './pricing-card/pricing-card';
export { FxOrderCard } from './order-card/order-card';
export type {
  FxOrderCardProps,
  OrderSummary,
  OrderPerspective,
  OrderCardLabels,
} from './order-card/order-card';
export { FxInvoiceCard } from './invoice-card/invoice-card';
export type {
  FxInvoiceCardProps,
  InvoiceSummary,
  InvoiceCardLabels,
} from './invoice-card/invoice-card';
export { FxCartSummary } from './cart-summary/cart-summary';
export type {
  FxCartSummaryProps,
  CartItem,
  CartTotals,
  CartSummaryLabels,
} from './cart-summary/cart-summary';
export { FxCheckoutSummary } from './checkout-summary/checkout-summary';
export type {
  FxCheckoutSummaryProps,
  CheckoutSection,
  CheckoutSummaryLabels,
} from './checkout-summary/checkout-summary';
export { FxPaymentStatus } from './payment-status/payment-status';
export type {
  FxPaymentStatusProps,
  PaymentInfo,
  PaymentMethod,
  PaymentStatusLabels,
} from './payment-status/payment-status';
export { FxShippingTimeline } from './shipping-timeline/shipping-timeline';
export type {
  FxShippingTimelineProps,
  Shipment,
  ShipmentEvent,
  ShippingTimelineLabels,
} from './shipping-timeline/shipping-timeline';
export { FxEscrowTimeline } from './escrow-timeline/escrow-timeline';
export type {
  FxEscrowTimelineProps,
  EscrowEvent,
  EscrowAction,
  EscrowPerspective,
  PartyRef,
  EscrowTimelineLabels,
} from './escrow-timeline/escrow-timeline';
export { FxReviewCard } from './review-card/review-card';
export type {
  FxReviewCardProps,
  Review,
  ReviewResponse,
  ReviewCardLabels,
} from './review-card/review-card';
export { FxSellerCard } from './seller-card/seller-card';
export type {
  FxSellerCardProps,
  SellerSummary,
  SellerCardLabels,
} from './seller-card/seller-card';
export { FxBuyerCard } from './buyer-card/buyer-card';
export type {
  FxBuyerCardProps,
  BuyerSummary,
  BuyerCardLabels,
} from './buyer-card/buyer-card';
export { FxMarketplaceStatistics } from './marketplace-statistics/marketplace-statistics';
export type {
  FxMarketplaceStatisticsProps,
  MarketplaceRangeOption,
  MarketplaceStatisticsLabels,
} from './marketplace-statistics/marketplace-statistics';

// Components — U9 Collaboration & feedback
export { FxChat, DEFAULT_CHAT_LABELS } from './chat/chat';
export type {
  FxChatProps,
  ChatMessage,
  ChatAttachment,
  ChatMessageStatus,
  ChatSendPayload,
  ChatLabels,
} from './chat/chat';
export { FxConversationList, DEFAULT_CONVERSATION_LIST_LABELS } from './conversation-list/conversation-list';
export type {
  FxConversationListProps,
  ConversationSummary,
  ConversationLastMessage,
  ConversationFilter,
  ConversationListLabels,
} from './conversation-list/conversation-list';
export { FxCommentThread, DEFAULT_COMMENT_THREAD_LABELS } from './comment-thread/comment-thread';
export type {
  FxCommentThreadProps,
  Comment,
  CommentSort,
  CommentThreadLabels,
} from './comment-thread/comment-thread';
export { FxMention, FxMentionPicker, DEFAULT_MENTION_PICKER_LABELS } from './mention/mention';
export type {
  FxMentionProps,
  FxMentionPickerProps,
  MentionUser,
  MentionPickerLabels,
} from './mention/mention';
export { FxNotificationCenter, DEFAULT_NOTIFICATION_CENTER_LABELS } from './notification-center/notification-center';
export type {
  FxNotificationCenterProps,
  NotificationItem,
  NotificationCenterLabels,
} from './notification-center/notification-center';
export { FxActivityTimeline, DEFAULT_ACTIVITY_TIMELINE_LABELS } from './activity-timeline/activity-timeline';
export type {
  FxActivityTimelineProps,
  ActivityFilter,
  ActivityTimelineLabels,
} from './activity-timeline/activity-timeline';
export { FxAuditLog, DEFAULT_AUDIT_LOG_LABELS } from './audit-log/audit-log';
export type {
  FxAuditLogProps,
  AuditEntry,
  AuditActor,
  AuditChange,
  AuditColumnKey,
  AuditLogLabels,
} from './audit-log/audit-log';
export { FxVersionHistory, DEFAULT_VERSION_HISTORY_LABELS } from './version-history/version-history';
export type {
  FxVersionHistoryProps,
  Version,
  VersionHistoryLabels,
} from './version-history/version-history';
export { FxErrorPage, DEFAULT_ERROR_COPY } from './error-page/error-page';
export type { FxErrorPageProps, ErrorPageCode } from './error-page/error-page';
export { FxSuccessPage } from './success-page/success-page';
export type { FxSuccessPageProps, SuccessAutoAdvance } from './success-page/success-page';
export { FxWarningBanner } from './warning-banner/warning-banner';
export type { FxWarningBannerProps } from './warning-banner/warning-banner';
export { FxMaintenanceBanner, DEFAULT_MAINTENANCE_BANNER_LABELS } from './maintenance-banner/maintenance-banner';
export type {
  FxMaintenanceBannerProps,
  MaintenanceBannerLabels,
} from './maintenance-banner/maintenance-banner';
export { FxOfflineState, DEFAULT_OFFLINE_STATE_LABELS } from './offline-state/offline-state';
export type {
  FxOfflineStateProps,
  OfflineStateMode,
  OfflineStateLabels,
} from './offline-state/offline-state';
export { FxInlineError } from './inline-error/inline-error';
export type { FxInlineErrorProps } from './inline-error/inline-error';

// Components — U10 Admin & System
export { FxDataManagementToolbar, DEFAULT_DATA_MANAGEMENT_TOOLBAR_LABELS } from './data-management-toolbar/data-management-toolbar';
export type {
  FxDataManagementToolbarProps,
  ToolbarColumn,
  DataManagementToolbarLabels,
} from './data-management-toolbar/data-management-toolbar';
export { FxAdvancedFilters, DEFAULT_ADVANCED_FILTERS_LABELS } from './advanced-filters/advanced-filters';
export type {
  FxAdvancedFiltersProps,
  FilterField,
  FilterValue,
  FilterOperator,
  AdvancedFiltersLabels,
} from './advanced-filters/advanced-filters';
export { FxSavedFilters, DEFAULT_SAVED_FILTERS_LABELS } from './saved-filters/saved-filters';
export type {
  FxSavedFiltersProps,
  SavedFilter,
  SavedSort,
  SavedFiltersLabels,
} from './saved-filters/saved-filters';
export { FxRoleBadge, DEFAULT_ROLE_BADGE_LABELS } from './role-badge/role-badge';
export type { FxRoleBadgeProps, RoleBadgeLabels } from './role-badge/role-badge';
export { FxPermissionMatrix, DEFAULT_PERMISSION_MATRIX_LABELS } from './permission-matrix/permission-matrix';
export type {
  FxPermissionMatrixProps,
  Permission,
  PermissionMatrixLabels,
} from './permission-matrix/permission-matrix';
export { FxAuditTimeline, DEFAULT_AUDIT_TIMELINE_LABELS, actionTone } from './audit-timeline/audit-timeline';
export type { FxAuditTimelineProps, AuditTimelineLabels } from './audit-timeline/audit-timeline';
export { FxSystemLogs, DEFAULT_SYSTEM_LOGS_LABELS, levelTone } from './system-logs/system-logs';
export type {
  FxSystemLogsProps,
  LogEntry,
  LogQuery,
  LogRangeOption,
  SystemLogsLabels,
} from './system-logs/system-logs';
export { FxQueueMonitor, DEFAULT_QUEUE_MONITOR_LABELS, depthTone, formatAge } from './queue-monitor/queue-monitor';
export type {
  FxQueueMonitorProps,
  QueueInfo,
  QueueThresholds,
  QueueAction,
  QueueMonitorLabels,
} from './queue-monitor/queue-monitor';
export { FxBackgroundJobsPanel, DEFAULT_BACKGROUND_JOBS_PANEL_LABELS } from './background-jobs-panel/background-jobs-panel';
export type {
  FxBackgroundJobsPanelProps,
  JobInfo,
  BackgroundJobsPanelLabels,
} from './background-jobs-panel/background-jobs-panel';

// Components — U10 AI
export { FxAiAssistantPanel, DEFAULT_AI_ASSISTANT_PANEL_LABELS } from './ai-assistant-panel/ai-assistant-panel';
export type {
  FxAiAssistantPanelProps,
  AiTurn,
  AiAssistantPanelLabels,
} from './ai-assistant-panel/ai-assistant-panel';
export { FxPromptInput, DEFAULT_PROMPT_INPUT_LABELS } from './prompt-input/prompt-input';
export type { FxPromptInputProps, PromptInputLabels } from './prompt-input/prompt-input';
export { FxAiSuggestionCard, DEFAULT_AI_SUGGESTION_CARD_LABELS } from './ai-suggestion-card/ai-suggestion-card';
export type {
  FxAiSuggestionCardProps,
  AiSuggestion,
  AiSuggestionCardLabels,
} from './ai-suggestion-card/ai-suggestion-card';
export { FxAiGenerationStatus, DEFAULT_AI_GENERATION_STATUS_LABELS } from './ai-generation-status/ai-generation-status';
export type {
  FxAiGenerationStatusProps,
  GenerationStep,
  AiGenerationStatusLabels,
} from './ai-generation-status/ai-generation-status';
export { FxAiConfidenceIndicator, DEFAULT_AI_CONFIDENCE_LABELS } from './ai-confidence-indicator/ai-confidence-indicator';
export type {
  FxAiConfidenceIndicatorProps,
  ConfidenceBand,
  AiConfidenceLabels,
} from './ai-confidence-indicator/ai-confidence-indicator';
export { FxAiDiffViewer, DEFAULT_AI_DIFF_VIEWER_LABELS } from './ai-diff-viewer/ai-diff-viewer';
export type { FxAiDiffViewerProps, AiDiffViewerLabels } from './ai-diff-viewer/ai-diff-viewer';
export { FxApproveRejectPanel, DEFAULT_APPROVE_REJECT_LABELS } from './approve-reject-panel/approve-reject-panel';
export type { FxApproveRejectPanelProps, ApproveRejectLabels } from './approve-reject-panel/approve-reject-panel';
export { FxAiActivityHistory, DEFAULT_AI_ACTIVITY_HISTORY_LABELS } from './ai-activity-history/ai-activity-history';
export type {
  FxAiActivityHistoryProps,
  AiRun,
  AiActivityHistoryLabels,
} from './ai-activity-history/ai-activity-history';

// Showcase / registry (data — safe to import in build-time docs tooling)
export type {
  ShowcaseSpec,
  ShowcaseVariant,
  PropRow,
  EventRow,
  KeyboardRow,
  AriaRow,
  ContractRef,
  UiCategory,
} from './showcase-types';
export {
  FLEXA_UI_COMPONENTS,
  UI_CATEGORIES,
  allSlugs,
  findComponent,
  componentsByCategory,
} from './registry';
