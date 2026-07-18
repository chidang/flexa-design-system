/**
 * Component registry — the single source both the kitchen-sink workbench and the
 * fds-docs "Components" section iterate (doc 13 §5). Registering a component is
 * one import + one array entry; the index page, per-component route, and
 * kitchen-sink route all populate from here. It also doubles as the
 * inventory-completeness checklist (rides `enum-drift.spec.ts` by U10).
 */
import type { ShowcaseSpec, UiCategory } from './showcase-types';
// U1 — Form primitives
import { buttonShowcase } from './button/button.showcase';
import { inputShowcase } from './input/input.showcase';
import { textareaShowcase } from './textarea/textarea.showcase';
import { checkboxShowcase } from './checkbox/checkbox.showcase';
import { radioGroupShowcase } from './radio-group/radio-group.showcase';
import { switchShowcase } from './switch/switch.showcase';
import { fieldGroupShowcase } from './field-group/field-group.showcase';
import { validationMessageShowcase } from './validation-message/validation-message.showcase';
// U2 — Display primitives
import { badgeShowcase } from './badge/badge.showcase';
import { tagShowcase } from './tag/tag.showcase';
import { chipShowcase } from './chip/chip.showcase';
import { avatarShowcase } from './avatar/avatar.showcase';
import { progressShowcase } from './progress/progress.showcase';
import { skeletonShowcase } from './skeleton/skeleton.showcase';
import { emptyStateShowcase } from './empty-state/empty-state.showcase';
import { cardShowcase } from './card/card.showcase';
import { descriptionListShowcase } from './description-list/description-list.showcase';
// U3 — Overlays & layering
import { toastShowcase } from './toast/toast.showcase';
import { alertShowcase } from './alert/alert.showcase';
import { confirmationDialogShowcase } from './confirmation-dialog/confirmation-dialog.showcase';
import { dialogShowcase } from './dialog/dialog.showcase';
import { rightDrawerShowcase } from './right-drawer/right-drawer.showcase';
import { tooltipShowcase } from './tooltip/tooltip.showcase';
import { loadingOverlayShowcase } from './loading-overlay/loading-overlay.showcase';
// U4 — Navigation
import { tabsShowcase } from './tabs/tabs.showcase';
import { breadcrumbShowcase } from './breadcrumb/breadcrumb.showcase';
import { paginationShowcase } from './pagination/pagination.showcase';
import { searchBarShowcase } from './search-bar/search-bar.showcase';
import { commandPaletteShowcase } from './command-palette/command-palette.showcase';
import { contextMenuShowcase } from './context-menu/context-menu.showcase';
import { sidebarShowcase } from './sidebar/sidebar.showcase';
import { nestedSidebarShowcase } from './nested-sidebar/nested-sidebar.showcase';
import { topNavigationShowcase } from './top-navigation/top-navigation.showcase';
import { quickActionsShowcase } from './quick-actions/quick-actions.showcase';
import { fabShowcase } from './fab/fab.showcase';
// U5 — Forms advanced
import { selectShowcase } from './select/select.showcase';
import { autocompleteShowcase } from './autocomplete/autocomplete.showcase';
import { tagInputShowcase } from './tag-input/tag-input.showcase';
import { numberInputShowcase } from './number-input/number-input.showcase';
import { currencyInputShowcase } from './currency-input/currency-input.showcase';
import { passwordInputShowcase } from './password-input/password-input.showcase';
import { emailInputShowcase } from './email-input/email-input.showcase';
import { phoneInputShowcase } from './phone-input/phone-input.showcase';
import { urlInputShowcase } from './url-input/url-input.showcase';
import { datePickerShowcase } from './date-picker/date-picker.showcase';
import { timePickerShowcase } from './time-picker/time-picker.showcase';
import { dateRangePickerShowcase } from './date-range-picker/date-range-picker.showcase';
import { sliderShowcase } from './slider/slider.showcase';
import { stepperShowcase } from './stepper/stepper.showcase';
import { colorPickerShowcase } from './color-picker/color-picker.showcase';
import { fileUploadShowcase } from './file-upload/file-upload.showcase';
import { dragDropUploadShowcase } from './drag-drop-upload/drag-drop-upload.showcase';
import { avatarUploadShowcase } from './avatar-upload/avatar-upload.showcase';
import { imageGalleryUploadShowcase } from './image-gallery-upload/image-gallery-upload.showcase';
import { formWizardShowcase } from './form-wizard/form-wizard.showcase';
// U6 — Data display
import { tableShowcase } from './table/table.showcase';
import { virtualTableShowcase } from './virtual-table/virtual-table.showcase';
import { dataGridShowcase } from './data-grid/data-grid.showcase';
import { bulkActionsBarShowcase } from './bulk-actions-bar/bulk-actions-bar.showcase';
import { listShowcase } from './list/list.showcase';
import { accordionShowcase } from './accordion/accordion.showcase';
import { treeShowcase } from './tree/tree.showcase';
import { kanbanBoardShowcase } from './kanban-board/kanban-board.showcase';
import { calendarShowcase } from './calendar/calendar.showcase';
import { timelineShowcase } from './timeline/timeline.showcase';
import { galleryShowcase } from './gallery/gallery.showcase';
import { mediaGridShowcase } from './media-grid/media-grid.showcase';
import { statisticBlockShowcase } from './statistic-block/statistic-block.showcase';
import { ratingShowcase } from './rating/rating.showcase';
// U7 — Layouts & dashboard
import { metricCardShowcase } from './metric-card/metric-card.showcase';
import { chartsContainerShowcase } from './charts-container/charts-container.showcase';
import { statisticsCardShowcase } from './statistics-card/statistics-card.showcase';
import { widgetShowcase } from './widget/widget.showcase';
import { appShellShowcase } from './app-shell/app-shell.showcase';
import { sidebarLayoutShowcase } from './sidebar-layout/sidebar-layout.showcase';
import { topNavigationLayoutShowcase } from './top-navigation-layout/top-navigation-layout.showcase';
import { bottomNavigationShowcase } from './bottom-navigation/bottom-navigation.showcase';
import { contentAreaShowcase } from './content-area/content-area.showcase';
import { splitViewShowcase } from './split-view/split-view.showcase';
import { wizardLayoutShowcase } from './wizard-layout/wizard-layout.showcase';
import { settingsLayoutShowcase } from './settings-layout/settings-layout.showcase';
import { authenticationLayoutShowcase } from './authentication-layout/authentication-layout.showcase';
import { dashboardLayoutShowcase } from './dashboard-layout/dashboard-layout.showcase';
import { blankStateLayoutShowcase } from './blank-state-layout/blank-state-layout.showcase';
import { activityFeedShowcase } from './activity-feed/activity-feed.showcase';
import { recentActivityShowcase } from './recent-activity/recent-activity.showcase';
import { progressSummaryShowcase } from './progress-summary/progress-summary.showcase';
import { quickLinksShowcase } from './quick-links/quick-links.showcase';
// U8 — Commerce
import { productCardShowcase } from './product-card/product-card.showcase';
import { listingCardShowcase } from './listing-card/listing-card.showcase';
import { pricingCardShowcase } from './pricing-card/pricing-card.showcase';
import { orderCardShowcase } from './order-card/order-card.showcase';
import { invoiceCardShowcase } from './invoice-card/invoice-card.showcase';
import { cartSummaryShowcase } from './cart-summary/cart-summary.showcase';
import { checkoutSummaryShowcase } from './checkout-summary/checkout-summary.showcase';
import { paymentStatusShowcase } from './payment-status/payment-status.showcase';
import { shippingTimelineShowcase } from './shipping-timeline/shipping-timeline.showcase';
import { escrowTimelineShowcase } from './escrow-timeline/escrow-timeline.showcase';
import { reviewCardShowcase } from './review-card/review-card.showcase';
import { sellerCardShowcase } from './seller-card/seller-card.showcase';
import { buyerCardShowcase } from './buyer-card/buyer-card.showcase';
import { marketplaceStatisticsShowcase } from './marketplace-statistics/marketplace-statistics.showcase';
// U9 — Collaboration & feedback
import { chatShowcase } from './chat/chat.showcase';
import { conversationListShowcase } from './conversation-list/conversation-list.showcase';
import { commentThreadShowcase } from './comment-thread/comment-thread.showcase';
import { mentionShowcase } from './mention/mention.showcase';
import { notificationCenterShowcase } from './notification-center/notification-center.showcase';
import { activityTimelineShowcase } from './activity-timeline/activity-timeline.showcase';
import { auditLogShowcase } from './audit-log/audit-log.showcase';
import { versionHistoryShowcase } from './version-history/version-history.showcase';
import { errorPageShowcase } from './error-page/error-page.showcase';
import { successPageShowcase } from './success-page/success-page.showcase';
import { warningBannerShowcase } from './warning-banner/warning-banner.showcase';
import { maintenanceBannerShowcase } from './maintenance-banner/maintenance-banner.showcase';
import { offlineStateShowcase } from './offline-state/offline-state.showcase';
import { inlineErrorShowcase } from './inline-error/inline-error.showcase';
// U10 — Admin & System
import { dataManagementToolbarShowcase } from './data-management-toolbar/data-management-toolbar.showcase';
import { advancedFiltersShowcase } from './advanced-filters/advanced-filters.showcase';
import { savedFiltersShowcase } from './saved-filters/saved-filters.showcase';
import { roleBadgeShowcase } from './role-badge/role-badge.showcase';
import { permissionMatrixShowcase } from './permission-matrix/permission-matrix.showcase';
import { auditTimelineShowcase } from './audit-timeline/audit-timeline.showcase';
import { systemLogsShowcase } from './system-logs/system-logs.showcase';
import { queueMonitorShowcase } from './queue-monitor/queue-monitor.showcase';
import { backgroundJobsPanelShowcase } from './background-jobs-panel/background-jobs-panel.showcase';
// U10 — AI
import { aiAssistantPanelShowcase } from './ai-assistant-panel/ai-assistant-panel.showcase';
import { promptInputShowcase } from './prompt-input/prompt-input.showcase';
import { aiSuggestionCardShowcase } from './ai-suggestion-card/ai-suggestion-card.showcase';
import { aiGenerationStatusShowcase } from './ai-generation-status/ai-generation-status.showcase';
import { aiConfidenceIndicatorShowcase } from './ai-confidence-indicator/ai-confidence-indicator.showcase';
import { aiDiffViewerShowcase } from './ai-diff-viewer/ai-diff-viewer.showcase';
import { approveRejectPanelShowcase } from './approve-reject-panel/approve-reject-panel.showcase';
import { aiActivityHistoryShowcase } from './ai-activity-history/ai-activity-history.showcase';

/** The 10 inventory sections (README), in display order. Empty ones hide. */
export const UI_CATEGORIES: UiCategory[] = [
  { id: 'forms', title: 'Forms & Inputs', blurb: 'Buttons, fields, and the controls that collect input.' },
  { id: 'display', title: 'Display Primitives', blurb: 'Badges, cards, avatars — the small building blocks.' },
  { id: 'overlays', title: 'Overlays & Layering', blurb: 'Toasts, dialogs, drawers, tooltips.' },
  { id: 'navigation', title: 'Navigation', blurb: 'Tabs, breadcrumbs, sidebars, command palette.' },
  { id: 'data', title: 'Data Display', blurb: 'Tables, lists, trees, calendars, timelines.' },
  { id: 'layouts', title: 'Layouts & Dashboard', blurb: 'App shells, split views, dashboard widgets.' },
  { id: 'commerce', title: 'Commerce', blurb: 'Orders, listings, escrow, checkout surfaces.' },
  { id: 'collaboration', title: 'Collaboration & Feedback', blurb: 'Chat, comments, notifications, status pages.' },
  { id: 'admin', title: 'Admin & System', blurb: 'Filters, permissions, audit, queues, jobs.' },
  { id: 'ai', title: 'AI', blurb: 'Assistant panels, suggestions, diffs, approvals.' },
];

/** Every shipped component's showcase spec. Add one line per component. */
export const FLEXA_UI_COMPONENTS: ShowcaseSpec[] = [
  // U1 — Form primitives
  buttonShowcase,
  inputShowcase,
  textareaShowcase,
  checkboxShowcase,
  radioGroupShowcase,
  switchShowcase,
  fieldGroupShowcase,
  validationMessageShowcase,
  // U2 — Display primitives
  badgeShowcase,
  tagShowcase,
  chipShowcase,
  avatarShowcase,
  progressShowcase,
  skeletonShowcase,
  emptyStateShowcase,
  cardShowcase,
  descriptionListShowcase,
  // U3 — Overlays & layering
  toastShowcase,
  alertShowcase,
  confirmationDialogShowcase,
  dialogShowcase,
  rightDrawerShowcase,
  tooltipShowcase,
  loadingOverlayShowcase,
  // U4 — Navigation
  tabsShowcase,
  breadcrumbShowcase,
  paginationShowcase,
  searchBarShowcase,
  commandPaletteShowcase,
  contextMenuShowcase,
  sidebarShowcase,
  nestedSidebarShowcase,
  topNavigationShowcase,
  quickActionsShowcase,
  fabShowcase,
  // U5 — Forms advanced
  selectShowcase,
  autocompleteShowcase,
  tagInputShowcase,
  numberInputShowcase,
  currencyInputShowcase,
  passwordInputShowcase,
  emailInputShowcase,
  phoneInputShowcase,
  urlInputShowcase,
  datePickerShowcase,
  timePickerShowcase,
  dateRangePickerShowcase,
  sliderShowcase,
  stepperShowcase,
  colorPickerShowcase,
  fileUploadShowcase,
  dragDropUploadShowcase,
  avatarUploadShowcase,
  imageGalleryUploadShowcase,
  formWizardShowcase,
  // U6 — Data display
  tableShowcase,
  virtualTableShowcase,
  dataGridShowcase,
  bulkActionsBarShowcase,
  listShowcase,
  accordionShowcase,
  treeShowcase,
  kanbanBoardShowcase,
  calendarShowcase,
  timelineShowcase,
  galleryShowcase,
  mediaGridShowcase,
  statisticBlockShowcase,
  ratingShowcase,
  // U7 — Layouts & dashboard
  metricCardShowcase,
  chartsContainerShowcase,
  statisticsCardShowcase,
  widgetShowcase,
  appShellShowcase,
  sidebarLayoutShowcase,
  topNavigationLayoutShowcase,
  bottomNavigationShowcase,
  contentAreaShowcase,
  splitViewShowcase,
  wizardLayoutShowcase,
  settingsLayoutShowcase,
  authenticationLayoutShowcase,
  dashboardLayoutShowcase,
  blankStateLayoutShowcase,
  activityFeedShowcase,
  recentActivityShowcase,
  progressSummaryShowcase,
  quickLinksShowcase,
  // U8 — Commerce
  productCardShowcase,
  listingCardShowcase,
  pricingCardShowcase,
  orderCardShowcase,
  invoiceCardShowcase,
  cartSummaryShowcase,
  checkoutSummaryShowcase,
  paymentStatusShowcase,
  shippingTimelineShowcase,
  escrowTimelineShowcase,
  reviewCardShowcase,
  sellerCardShowcase,
  buyerCardShowcase,
  marketplaceStatisticsShowcase,
  // U9 — Collaboration & feedback
  chatShowcase,
  conversationListShowcase,
  commentThreadShowcase,
  mentionShowcase,
  notificationCenterShowcase,
  activityTimelineShowcase,
  auditLogShowcase,
  versionHistoryShowcase,
  errorPageShowcase,
  successPageShowcase,
  warningBannerShowcase,
  maintenanceBannerShowcase,
  offlineStateShowcase,
  inlineErrorShowcase,
  // U10 — Admin & System
  dataManagementToolbarShowcase,
  advancedFiltersShowcase,
  savedFiltersShowcase,
  roleBadgeShowcase,
  permissionMatrixShowcase,
  auditTimelineShowcase,
  systemLogsShowcase,
  queueMonitorShowcase,
  backgroundJobsPanelShowcase,
  // U10 — AI
  aiAssistantPanelShowcase,
  promptInputShowcase,
  aiSuggestionCardShowcase,
  aiGenerationStatusShowcase,
  aiConfidenceIndicatorShowcase,
  aiDiffViewerShowcase,
  approveRejectPanelShowcase,
  aiActivityHistoryShowcase,
];

/** All component slugs (for `generateStaticParams` / route generation). */
export function allSlugs(): string[] {
  return FLEXA_UI_COMPONENTS.map((c) => c.slug);
}

/** Look up a component spec by slug. */
export function findComponent(slug: string): ShowcaseSpec | undefined {
  return FLEXA_UI_COMPONENTS.find((c) => c.slug === slug);
}

/** Components grouped under their category, in category order, empties dropped. */
export function componentsByCategory(): { category: UiCategory; items: ShowcaseSpec[] }[] {
  return UI_CATEGORIES.map((category) => ({
    category,
    items: FLEXA_UI_COMPONENTS.filter((c) => c.category === category.id),
  })).filter((g) => g.items.length > 0);
}
