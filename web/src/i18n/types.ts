export type Locale = "fa" | "en";
export type Direction = "rtl" | "ltr";

export const LOCALES: Locale[] = ["fa", "en"];
export const STORAGE_KEY = "mitra-locale";

export interface Dictionary {
  common: {
    appName: string;
    save: string;
    cancel: string;
    delete: string;
    remove: string;
    edit: string;
    create: string;
    add: string;
    close: string;
    back: string;
    confirm: string;
    loading: string;
    retry: string;
    search: string;
    viewAll: string;
    optional: string;
    you: string;
    yes: string;
    no: string;
    errorGeneric: string;
    cannotUndo: string;
    deleteTitle: string;
    toggleSidebar: string;
    validation: {
      required: string;
      invalidEmail: string;
      passwordTooShort: string;
      invalidSlug: string;
    };
    roles: {
      owner: string;
      admin: string;
      manager: string;
      member: string;
      viewer: string;
      lead: string;
    };
    taskStatus: {
      todo: string;
      in_progress: string;
      review: string;
      done: string;
    };
    taskPriority: {
      low: string;
      medium: string;
      high: string;
      urgent: string;
    };
    notificationType: {
      task_assigned: string;
      mention: string;
      deadline: string;
      comment: string;
      member_added: string;
    };
    memberCount: (n: number) => string;
    taskCount: (n: number) => string;
    projectCount: (n: number) => string;
    teamCount: (n: number) => string;
  };
  languageSwitcher: {
    label: string;
    fa: string;
    en: string;
  };
  nav: {
    dashboard: string;
    organization: string;
    teams: string;
    projects: string;
    chat: string;
    notifications: string;
    settings: string;
    logout: string;
  };
  auth: {
    brandTagline: string;
    brandBullets: [string, string, string];
    login: {
      title: string;
      subtitle: string;
      email: string;
      password: string;
      submit: string;
      submitLoading: string;
      noAccount: string;
      registerLink: string;
    };
    register: {
      title: string;
      subtitle: string;
      fullName: string;
      email: string;
      password: string;
      passwordHint: string;
      submit: string;
      submitLoading: string;
      haveAccount: string;
      loginLink: string;
    };
  };
  dashboard: {
    greeting: (name: string) => string;
    subtitle: string;
    statProjects: string;
    statOpenTasks: string;
    statDueSoon: string;
    statMembers: string;
    recentProjectsTitle: string;
    recentProjectsEmpty: string;
    statusBreakdownTitle: string;
    statusBreakdownEmpty: string;
    noOrgTitle: string;
    noOrgDescription: string;
    noOrgCta: string;
  };
  organizations: {
    tabOverview: string;
    tabMembers: string;
    createTitle: string;
    createDescription: string;
    nameLabel: string;
    slugLabel: string;
    slugHint: string;
    submit: string;
    overviewNameLabel: string;
    overviewSlugLabel: string;
    overviewCreatedLabel: string;
    overviewMembersLabel: string;
    viewMembersCta: string;
  };
  members: {
    title: string;
    subtitle: (orgName: string) => string;
    addButton: string;
    tableName: string;
    tableEmail: string;
    tableRole: string;
    addModalTitle: string;
    userIdLabel: string;
    userIdHint: string;
    roleLabel: string;
    removeConfirm: (name: string) => string;
    empty: string;
  };
  teams: {
    listTitle: string;
    listSubtitle: string;
    createButton: string;
    createModalTitle: string;
    nameLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    detailMembersTitle: string;
    addMemberButton: string;
    deleteButton: string;
    deleteConfirm: (name: string) => string;
    createdLabel: string;
  };
  projects: {
    listTitle: string;
    listSubtitle: string;
    createButton: string;
    createModalTitle: string;
    editModalTitle: string;
    nameLabel: string;
    descriptionLabel: string;
    emptyTitle: string;
    emptyDescription: string;
    detailMembersTitle: string;
    addMemberButton: string;
    goToBoardCta: string;
    deleteButton: string;
    deleteConfirm: (name: string) => string;
    createdLabel: string;
    noDescription: string;
  };
  tasks: {
    boardTitle: string;
    addTaskButton: string;
    columnEmpty: string;
    createModalTitle: string;
    titleLabel: string;
    descriptionLabel: string;
    priorityLabel: string;
    assigneeLabel: string;
    unassigned: string;
    dueDateLabel: string;
    detailBack: string;
    statusLabel: string;
    createdBy: (name: string) => string;
    createdAt: (date: string) => string;
    descriptionEmpty: string;
    commentsTitle: string;
    commentPlaceholder: string;
    commentSubmit: string;
    commentsEmpty: string;
    deleteButton: string;
    deleteConfirm: (title: string) => string;
    editButton: string;
  };
  chat: {
    title: string;
    previewBadge: string;
    channelsTitle: string;
    composerPlaceholder: string;
    send: string;
    emptyThreadTitle: string;
    emptyThreadDescription: string;
    connected: string;
    connecting: string;
    offline: string;
  };
  notifications: {
    title: string;
    subtitle: string;
    markAllRead: string;
    emptyTitle: string;
    emptyDescription: string;
  };
  settings: {
    title: string;
    subtitle: string;
    fullNameLabel: string;
    emailLabel: string;
    saveButton: string;
    saved: string;
    accountSection: string;
    logoutButton: string;
  };
}
