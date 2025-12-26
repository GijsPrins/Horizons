// Dutch translations for Horizons
export const nl = {
  // App
  app: {
    name: 'Horizons',
    tagline: 'Samen naar nieuwe horizons',
  },

  // Navigation
  nav: {
    dashboard: 'Dashboard',
    teams: 'Teams',
    celebration: 'Viering',
    history: 'Geschiedenis',
    settings: 'Instellingen',
    admin: 'Beheer',
    logout: 'Uitloggen',
  },

  // Auth
  auth: {
    login: 'Inloggen',
    register: 'Registreren',
    logout: 'Uitloggen',
    email: 'E-mailadres',
    password: 'Wachtwoord',
    passwordConfirm: 'Wachtwoord bevestigen',
    displayName: 'Weergavenaam',
    forgotPassword: 'Wachtwoord vergeten?',
    noAccount: 'Nog geen account?',
    hasAccount: 'Al een account?',
    loginSuccess: 'Welkom terug!',
    registerSuccess: 'Account aangemaakt!',
    logoutSuccess: 'Tot ziens!',
    errors: {
      invalidEmail: 'Ongeldig e-mailadres',
      invalidPassword: 'Wachtwoord moet minimaal 6 tekens bevatten',
      passwordMismatch: 'Wachtwoorden komen niet overeen',
      loginFailed: 'Inloggen mislukt. Controleer je gegevens.',
      registerFailed: 'Registreren mislukt. Probeer het opnieuw.',
    },
  },

  // Goals
  goals: {
    title: 'Doelen',
    myGoals: 'Mijn doelen',
    teamGoals: 'Team doelen',
    sharedGoals: 'Gedeelde doelen',
    addGoal: 'Doel toevoegen',
    editGoal: 'Doel bewerken',
    deleteGoal: 'Doel verwijderen',
    goalTitle: 'Titel',
    goalDescription: 'Beschrijving',
    goalType: 'Type',
    goalCategory: 'Categorie',
    goalYear: 'Jaar',
    isShared: 'Delen met team',
    isCompleted: 'Voltooid',
    markComplete: 'Markeer als voltooid',
    markIncomplete: 'Markeer als niet voltooid',
    progress: 'Voortgang',
    noGoals: 'Nog geen doelen voor dit jaar.',
    createFirst: 'Maak je eerste doel aan!',
    types: {
      single: 'Eenmalig',
      weekly: 'Wekelijks',
      milestone: 'Mijlpalen',
    },
    typeDescriptions: {
      single: 'Een doel dat je één keer bereikt',
      weekly: 'Track je voortgang per week (52 weken)',
      milestone: 'Een doel met meerdere stappen',
    },
    confirmDelete: 'Weet je zeker dat je dit doel wilt verwijderen?',
    saved: 'Doel opgeslagen!',
    deleted: 'Doel verwijderd.',
  },

  // Progress
  progress: {
    title: 'Voortgang',
    weeklyProgress: 'Wekelijkse voortgang',
    milestones: 'Mijlpalen',
    week: 'Week',
    achieved: 'Behaald',
    notAchieved: 'Niet behaald',
    addNote: 'Notitie toevoegen',
    targetCount: 'Aantal mijlpalen',
    current: '{current} van {target}',
  },

  // Attachments
  attachments: {
    title: 'Bijlagen',
    addUrl: 'Link toevoegen',
    addImage: 'Afbeelding toevoegen',
    addNote: 'Notitie toevoegen',
    addMilestone: 'Mijlpaal toevoegen',
    url: 'URL',
    imageUrl: 'Afbeelding URL',
    note: 'Notitie',
    milestone: 'Mijlpaal',
    milestoneDate: 'Datum',
    noAttachments: 'Geen bijlagen.',
  },

  // Categories
  categories: {
    title: 'Categorieën',
    addCategory: 'Categorie toevoegen',
    editCategory: 'Categorie bewerken',
    deleteCategory: 'Categorie verwijderen',
    name: 'Naam',
    color: 'Kleur',
    icon: 'Icoon',
    global: 'Globale categorieën',
    team: 'Team categorieën',
    noCategory: 'Geen categorie',
    defaults: {
      gezondheid: 'Gezondheid',
      persoonlijk: 'Persoonlijk',
      relatie: 'Relatie',
      carriere: 'Carrière',
      financieel: 'Financieel',
      creatief: 'Creatief',
      sport: 'Sport',
      overig: 'Overig',
    },
  },

  // Teams
  teams: {
    title: 'Teams',
    myTeams: 'Mijn teams',
    createTeam: 'Team aanmaken',
    joinTeam: 'Team joinen',
    editTeam: 'Team bewerken',
    leaveTeam: 'Team verlaten',
    deleteTeam: 'Team verwijderen',
    teamName: 'Teamnaam',
    teamDescription: 'Beschrijving',
    inviteCode: 'Uitnodigingscode',
    copyCode: 'Kopieer code',
    codeCopied: 'Code gekopieerd!',
    enterCode: 'Voer uitnodigingscode in',
    members: 'Leden',
    role: 'Rol',
    roles: {
      admin: 'Beheerder',
      member: 'Lid',
    },
    noTeams: 'Je bent nog geen lid van een team.',
    createOrJoin: 'Maak een team aan of join er een!',
    confirmLeave: 'Weet je zeker dat je dit team wilt verlaten?',
    confirmDelete: 'Weet je zeker dat je dit team wilt verwijderen?',
    joined: 'Je bent lid geworden van het team!',
    left: 'Je hebt het team verlaten.',
    created: 'Team aangemaakt!',
    invalidCode: 'Ongeldige uitnodigingscode.',
  },

  // Celebration
  celebration: {
    title: 'Jaarviering',
    journey: 'Jouw reis door {year}',
    achievements: 'Prestaties',
    completed: 'Voltooid',
    inProgress: 'Bezig',
    notStarted: 'Niet gestart',
    stats: {
      title: 'Statistieken',
      totalGoals: 'Totaal doelen',
      completedGoals: 'Voltooid',
      completionRate: 'Slagingspercentage',
      byCategory: 'Per categorie',
    },
    noData: 'Geen doelen om te vieren dit jaar.',
    celebrate: '🎉 Gefeliciteerd met je prestaties!',
  },

  // History
  history: {
    title: 'Geschiedenis',
    selectYear: 'Selecteer jaar',
    noHistory: 'Geen geschiedenis beschikbaar.',
  },

  // Settings
  settings: {
    title: 'Instellingen',
    profile: 'Profiel',
    displayName: 'Weergavenaam',
    avatarUrl: 'Avatar URL',
    theme: 'Thema',
    themes: {
      light: 'Licht',
      dark: 'Donker',
      system: 'Systeem',
    },
    saved: 'Instellingen opgeslagen!',
  },

  // Admin
  admin: {
    title: 'Beheer',
    globalCategories: 'Globale categorieën',
    onlyAdmins: 'Alleen beheerders hebben toegang tot deze pagina.',
  },

  // Common
  common: {
    save: 'Opslaan',
    cancel: 'Annuleren',
    delete: 'Verwijderen',
    edit: 'Bewerken',
    add: 'Toevoegen',
    close: 'Sluiten',
    confirm: 'Bevestigen',
    loading: 'Laden...',
    error: 'Er is een fout opgetreden.',
    success: 'Gelukt!',
    required: 'Dit veld is verplicht.',
    optional: 'Optioneel',
    search: 'Zoeken...',
    filter: 'Filter',
    all: 'Alle',
    none: 'Geen',
    yes: 'Ja',
    no: 'Nee',
    back: 'Terug',
    next: 'Volgende',
    previous: 'Vorige',
  },
}

export type Translations = typeof nl
