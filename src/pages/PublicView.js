"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
exports.PublicView = PublicView;
/// <reference types="vite/client" />
const react_1 = require("react");
const fa_1 = require("react-icons/fa");
const icons_1 = require("@/utils/icons");
const endpoints_1 = require("@/api/endpoints");
// Sample data for development/demo
const SAMPLE_PROJECTS = [
    {
        id: 'mobile-app-1',
        name: 'Aplikacja mobilna',
        description: 'Aplikacja mobilna dla klientów, która umożliwia zarządzanie zamówieniami, przeglądanie ofert i kontakt z obsługą',
        icon: 'mobile-app',
        status: 'active',
        priority: 'high',
        progress: 65,
        startDate: '2024-04-12',
        lastUpdate: new Date().toISOString(),
        teamSize: 4,
        technologies: ['React Native', 'TypeScript', 'Node.js', 'Expo'],
        goals: [
            'Stworzenie intuicyjnej aplikacji mobilnej',
            'Zapewnienie wysokiej wydajności i stabilności',
            'Integracja z systemami zewnętrznymi',
            'Wdrożenie w App Store i Google Play',
        ],
        createdAt: '2024-04-12T00:00:00Z',
        updatedAt: new Date().toISOString(),
    },
];
const SAMPLE_STAGES = [
    {
        id: 'stage-1',
        projectId: 'mobile-app-1',
        name: 'Analiza wymagań',
        description: 'Zebranie i analiza wymagań projektowych',
        status: 'completed',
        icon: 'check',
        order: 1,
        progress: 100,
        createdAt: '2024-04-12T00:00:00Z',
        updatedAt: '2024-05-12T00:00:00Z',
    },
    {
        id: 'stage-2',
        projectId: 'mobile-app-1',
        name: 'Projekt UI/UX',
        description: 'Projektowanie interfejsu użytkownika',
        status: 'completed',
        icon: 'check',
        order: 2,
        progress: 100,
        createdAt: '2024-05-12T00:00:00Z',
        updatedAt: '2024-05-26T00:00:00Z',
    },
    {
        id: 'stage-3',
        projectId: 'mobile-app-1',
        name: 'Implementacja',
        description: 'Kodowanie i implementacja funkcjonalności',
        status: 'in-progress',
        icon: 'dot',
        order: 3,
        progress: 65,
        createdAt: '2024-05-26T00:00:00Z',
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'stage-4',
        projectId: 'mobile-app-1',
        name: 'Testy',
        description: 'Testowanie aplikacji',
        status: 'pending',
        icon: '4',
        order: 4,
        createdAt: '2024-05-26T00:00:00Z',
        updatedAt: new Date().toISOString(),
    },
    {
        id: 'stage-5',
        projectId: 'mobile-app-1',
        name: 'Wdrożenie',
        description: 'Publikacja aplikacji w sklepach',
        status: 'pending',
        icon: '5',
        order: 5,
        createdAt: '2024-05-26T00:00:00Z',
        updatedAt: new Date().toISOString(),
    },
];
function getBuildDate() {
    const buildDate = import.meta.env.VITE_BUILD_DATE;
    if (buildDate)
        return buildDate;
    const today = new Date();
    return today.toISOString().split('T')[0];
}
function PublicView() {
    const [projects, setProjects] = (0, react_1.useState)([]);
    const [selectedProject, setSelectedProject] = (0, react_1.useState)(null);
    const [activeTab, setActiveTab] = (0, react_1.useState)('roadmap');
    const [mobileMenuOpen, setMobileMenuOpen] = (0, react_1.useState)(false);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const loadProjects = async () => {
            try {
                // Always attempt to fetch live data from API for public view
                try {
                  const live = await endpoints_1.projectsApi.getAll();
                  if (live && live.length > 0) {
                    setProjects(live);
                    setSelectedProject(live[0]);
                    setLoading(false);
                    return;
                  }
                  // If API returns empty list, fall back to sample data
                  console.warn('No projects returned from API, falling back to sample data');
                }
                catch (err) {
                  console.warn('Failed to load live projects, falling back to sample', err);
                }

                // Fallback to sample data
                setProjects(SAMPLE_PROJECTS);
                setSelectedProject(SAMPLE_PROJECTS[0]);
            }
            catch (error) {
                console.error('Failed to load projects:', error);
                setProjects(SAMPLE_PROJECTS);
                setSelectedProject(SAMPLE_PROJECTS[0]);
            }
            finally {
                setLoading(false);
            }
        };
        loadProjects();
    }, []);
    if (loading) {
        return (<div className="flex items-center justify-center min-h-screen bg-slate-950">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400">Loading...</p>
        </div>
      </div>);
    }
    const sidebarContent = (<>
      <div className="px-4 lg:px-6 py-4 lg:py-5 border-b border-slate-800/80">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-3">
            <div className="grid h-8 w-8 place-items-center rounded-xl bg-gradient-to-br from-indigo-500 to-violet-500 text-white shadow-lg shadow-indigo-500/25">
              <span className="text-sm font-semibold">R</span>
            </div>
            <div>
              <div className="text-base font-semibold tracking-tight">Roadmap</div>
              <div className="text-xs text-slate-400">Public view</div>
            </div>
          </div>
          <button type="button" onClick={() => setMobileMenuOpen(false)} className="inline-flex h-9 w-9 items-center justify-center rounded-xl border border-slate-700/80 bg-white/[0.04] text-slate-200 lg:hidden" aria-label="Close navigation">
            ×
          </button>
        </div>
      </div>

      <div className="px-4 py-3 text-xs font-semibold uppercase tracking-[0.22em] text-slate-500">Projekty</div>
      <div className="min-h-0 flex-1 overflow-y-auto px-3 pb-4 space-y-2">
        {projects.map((project) => (<button key={project.id} onClick={() => {
                setSelectedProject(project);
                setMobileMenuOpen(false);
            }} className={`group flex w-full items-center gap-3 rounded-xl border px-3 py-2.5 text-left transition ${selectedProject?.id === project.id
                ? 'border-violet-400/45 bg-violet-500/15 text-white shadow-[0_0_0_1px_rgba(139,92,246,0.18)]'
                : 'border-transparent text-slate-300 hover:border-slate-700/80 hover:bg-white/5'}`}>
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-white/8 text-lg flex-shrink-0">
              {(0, icons_1.renderProjectIcon)(project.icon)}
            </span>
            <span className="truncate text-sm font-medium">{project.name}</span>
          </button>))}
      </div>

      <div className="mt-auto p-3 lg:p-4">
        <div className="rounded-2xl border border-slate-800/80 bg-[#0f141b] p-3 lg:p-4 shadow-[0_0_0_1px_rgba(15,23,42,0.7)]">
          <div className="text-[11px] font-semibold uppercase tracking-[0.18em] text-slate-500">Nightly Release</div>
          <div className="mt-1 text-sm font-medium text-white">{getBuildDate()}</div>
          <div className="mt-1 text-xs leading-5 text-slate-400">Latest build deployed to the public view</div>
        </div>
      </div>
    </>);
    return (<div className="min-h-screen bg-[#0a0d12] text-slate-100 flex flex-col lg:flex-row">
      {/* Sidebar */}
      <aside className="hidden lg:flex w-72 flex-shrink-0 flex-col border-r border-slate-800/80 bg-[#0b1118] lg:sticky lg:top-0 lg:h-screen lg:overflow-hidden">
        {sidebarContent}
      </aside>

      {mobileMenuOpen && (<div className="fixed inset-0 z-50 lg:hidden">
          <button type="button" className="absolute inset-0 bg-black/65" onClick={() => setMobileMenuOpen(false)} aria-label="Close navigation backdrop"/>
          <aside className="absolute inset-y-0 left-0 flex h-full w-[86vw] max-w-sm flex-col border-r border-slate-800/80 bg-[#0b1118] shadow-2xl shadow-black/60">
            {sidebarContent}
          </aside>
        </div>)}

      {/* Main Content */}
      <main className="flex-1 overflow-y-auto">
        <div className="mx-auto w-full max-w-4xl px-4 py-4 sm:px-6 lg:px-8 lg:py-8">
          <div className="mb-4 flex items-start justify-between gap-3 lg:hidden">
            <button type="button" onClick={() => setMobileMenuOpen(true)} className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/80 bg-white/[0.04] text-slate-100 flex-shrink-0" aria-label="Open navigation">
              <fa_1.FaBars />
            </button>
            <div className="flex flex-row items-center gap-2">
              <div className="min-w-0 text-right flex-1">
                <div className="truncate text-sm font-semibold text-white">{selectedProject?.name}</div>
              </div>
              <a href="/auth/login" className="inline-flex h-11 w-11 items-center justify-center rounded-xl border border-slate-700/80 bg-white/[0.04] text-slate-100 flex-shrink-0" aria-label="GitHub login">
                <fa_1.FaExternalLinkAlt className="text-sm"/>
              </a>
            </div>
          </div>

          {/* Header */}
          <div className="mb-6 hidden flex-col gap-4 sm:flex-row sm:items-center sm:justify-between lg:flex">
            <div>
              <h1 className="text-2xl font-semibold tracking-tight sm:text-3xl">Roadmapa</h1>
              <p className="mt-1 text-sm text-slate-400">Śledź postęp dla tego projektu</p>
            </div>
            <a href="/auth/login" className="inline-flex w-fit items-center gap-2 rounded-xl border border-white/6 bg-white/[0.04] px-4 py-2 text-sm text-slate-300 hover:bg-white/[0.06]">
              <span>GitHub</span>
              <fa_1.FaExternalLinkAlt className="text-sm"/>
            </a>
          </div>

          {/* Project Selector Mobile */}
          

          {/* Tabs */}
          <div className="mb-6 flex items-center gap-6 border-b border-white/6 text-sm">
            <button onClick={() => setActiveTab('roadmap')} className={`relative pb-3 font-medium transition ${activeTab === 'roadmap'
            ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
            : 'text-slate-400 hover:text-slate-300'}`}>
              Roadmapa
            </button>
            <button onClick={() => setActiveTab('details')} className={`relative pb-3 font-medium transition ${activeTab === 'details'
            ? 'text-violet-300 after:absolute after:inset-x-0 after:bottom-[-1px] after:h-[2px] after:rounded-full after:bg-violet-400'
            : 'text-slate-400 hover:text-slate-300'}`}>
              Szczegóły
            </button>
          </div>

          {/* Content */}
          {selectedProject ? (activeTab === 'roadmap' ? (<RoadmapContent project={selectedProject}/>) : (<DetailsContent project={selectedProject}/>)) : (<div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-800/80 bg-white/[0.03]">
              <p className="text-slate-400">Wybierz projekt z menu</p>
            </div>)}
        </div>
      </main>
    </div>);
}
function RoadmapContent({ project }) {
    const [stages, setStages] = (0, react_1.useState)([]);
    const [loading, setLoading] = (0, react_1.useState)(true);
    (0, react_1.useEffect)(() => {
        const loadStages = async () => {
            try {
                try {
                  const liveStages = await endpoints_1.stagesApi.getByProjectId(project.id);
                  if (liveStages && liveStages.length > 0) {
                    setStages(liveStages.sort((a, b) => a.order - b.order));
                    return;
                  }
                  console.warn('No stages returned from API, falling back to sample data');
                }
                catch (err) {
                  console.warn('Failed to load live stages, falling back to sample', err);
                }
                // Fallback to sample data
                const sampleStages = SAMPLE_STAGES.filter(s => s.projectId === project.id);
                setStages(sampleStages.sort((a, b) => a.order - b.order));
            }
            catch (error) {
                console.error('Failed to load stages:', error);
            }
            finally {
                setLoading(false);
            }
        };
        loadStages();
    }, [project.id]);
    if (loading) {
        return (<div className="p-8">
        <div className="text-center">
          <div className="w-8 h-8 border-4 border-slate-700 border-t-blue-500 rounded-full animate-spin mx-auto mb-4"></div>
        </div>
      </div>);
    }
    if (stages.length === 0) {
        return (<div className="flex min-h-96 items-center justify-center rounded-3xl border border-slate-800/80 bg-white/[0.03]">
        <p className="text-slate-400">Brak etapów dla tego projektu</p>
      </div>);
    }
    return (<div className="space-y-6 pb-10">
      {/* Roadmap Timeline */}
      <div className="space-y-4">
        {stages.map((stage, index) => (<div key={stage.id}>
            <div className="flex gap-4">
              {/* Timeline dot */}
              <div className="flex flex-col items-center">
                <div className={`grid h-12 w-12 place-items-center rounded-full text-lg font-semibold ring-1 ring-white/10 ${stage.status === 'completed' ? 'bg-green-600 text-white' :
                stage.status === 'in-progress' ? 'bg-amber-600 text-white' :
                    stage.status === 'blocked' ? 'bg-orange-500 text-white' :
                        'bg-slate-700 text-slate-400'}`}>
                  {stage.status === 'completed' ? (<fa_1.FaCheckCircle />) : stage.status === 'in-progress' ? (<fa_1.FaCircle />) : stage.status === 'blocked' ? (<fa_1.FaExclamationTriangle />) : (
            // fallback: show stage.icon if it's a short string/number, otherwise a generic icon
            (typeof stage.icon === 'string' && stage.icon.length <= 2) ? stage.icon : <fa_1.FaBullseye />)}
                </div>
                {index < stages.length - 1 && (<div className="w-px h-12 bg-gradient-to-b from-white/25 to-white/5 my-2"></div>)}
              </div>

              {/* Stage card */}
              <div className="flex-1 pb-4">
                <div className="rounded-2xl border-1 border-slate-800/80 bg-[#0f141b] p-4 shadow-[0_12px_28px_rgba(0,0,0,0.18)] transition hover:border-slate-700/80">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <h3 className="text-lg font-semibold mb-1">{stage.name}</h3>
                      <p className="text-slate-400 text-sm mb-2">{stage.description}</p>
                      {stage.links && stage.links.length > 0 && (<div className="mb-2">
                          <div className="flex flex-wrap gap-2">
                            {stage.links.map((link) => (<a key={link.id} href={link.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1.5 px-2 py-1 rounded-lg bg-slate-800/50 text-slate-300 text-xs font-medium hover:bg-slate-700/50 transition" title={link.description || link.title}>
                                <fa_1.FaExternalLinkAlt className="text-xs"/>
                                {link.title}
                              </a>))}
                          </div>
                        </div>)}
                    </div>
                    <div className="ml-4 text-right">
                      <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${stage.status === 'completed' ? 'bg-green-900 text-green-200' :
                stage.status === 'in-progress' ? 'bg-amber-900 text-amber-200' :
                    stage.status === 'blocked' ? 'bg-orange-900 text-orange-200' :
                        'bg-slate-800 text-slate-300'}`}>
                        {stage.status === 'completed' && 'Zakończone'}
                        {stage.status === 'in-progress' && 'W trakcie'}
                        {stage.status === 'blocked' && 'W trakcie'}
                        {stage.status === 'pending' && 'Oczekujące'}
                      </span>
                      {stage.status === 'in-progress' && stage.progress && (<p className="text-slate-400 text-xs mt-1">Postęp: {stage.progress}%</p>)}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>))}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-center gap-2 text-slate-500 text-sm mt-12 pt-6 border-t border-white/6">
        <fa_1.FaGlobe />
        <span>Każdy może przeglądać postępy</span>
      </div>
    </div>);
}
function DetailsContent({ project }) {
    const getStatusLabel = (status) => {
        switch (status) {
            case 'active':
                return { label: 'Aktywny', color: 'text-green-400 bg-green-900/30' };
            case 'completed':
                return { label: 'Ukończony', color: 'text-blue-400 bg-blue-900/30' };
            case 'archived':
                return { label: 'Zarchiwizowany', color: 'text-slate-400 bg-slate-800/30' };
            default:
                return { label: 'Nieznany', color: 'text-slate-400 bg-slate-800/30' };
        }
    };
    const getPriorityLabel = (priority) => {
        switch (priority) {
            case 'high':
                return { label: 'Wysoki', color: 'text-red-400 bg-red-900/30' };
            case 'medium':
                return { label: 'Średni', color: 'text-yellow-400 bg-yellow-900/30' };
            case 'low':
                return { label: 'Niski', color: 'text-green-400 bg-green-900/30' };
            default:
                return { label: 'Nieznany', color: 'text-slate-400 bg-slate-800/30' };
        }
    };
    const statusStyle = getStatusLabel(project.status);
    const priorityStyle = getPriorityLabel(project.priority);
    return (<div className="space-y-6 pb-10">
      <section className="rounded-3xl bg-[#0f141b] p-6 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-8">
        <div className="flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
          <div className="max-w-2xl">
            <div className="mb-3 inline-flex items-center gap-2 rounded-full bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
              <fa_1.FaFileAlt />
              <span>Opis projektu</span>
            </div>
            <h3 className="text-2xl font-semibold tracking-tight text-white">{project.name}</h3>
            <p className="mt-3 text-sm leading-6 text-slate-300 lg:text-base">{project.description}</p>
          </div>

          <div className={`inline-flex w-fit items-center gap-2 rounded-full px-3 py-1.5 text-sm font-medium ${statusStyle.color}`}>
            <fa_1.FaCheckCircle />
            <span>{statusStyle.label}</span>
          </div>
        </div>
      </section>

      <div className="grid gap-4 xl:grid-cols-5">
        <div className="space-y-4 xl:col-span-3">
          <section className="rounded-3xl bg-[#0f141b] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                <fa_1.FaChartBar />
              </span>
              <div>
                <div className="text-sm font-medium text-white">Postęp ogólny</div>
                <div className="text-xs text-slate-500">Aktualny stan projektu</div>
              </div>
            </div>

            <div className="flex items-end justify-between gap-4">
              <div>
                <div className="text-4xl font-semibold tracking-tight text-white">{project.progress}%</div>
                <p className="mt-1 text-sm text-slate-400">Wykonane względem planu</p>
              </div>
              <div className="rounded-2xl bg-white/5 px-3 py-2 text-xs text-slate-400">
                Start: {new Date(project.startDate).toLocaleDateString('pl-PL')}
              </div>
            </div>

            <div className="mt-4 h-2 overflow-hidden rounded-full bg-slate-800">
              <div className="h-full rounded-full bg-gradient-to-r from-violet-500 to-indigo-500 transition-all" style={{ width: `${project.progress}%` }}/>
            </div>
          </section>

          <section className="rounded-3xl bg-[#0f141b] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                {(0, icons_1.renderProjectIcon)(project.icon)}
              </span>
              <div>
                <div className="text-sm font-medium text-white">Technologie</div>
                <div className="text-xs text-slate-500">Stos używany w projekcie</div>
              </div>
            </div>

            {project.technologies && project.technologies.length > 0 ? (<div className="flex flex-wrap gap-2">
                {project.technologies.map((tech) => (<span key={tech} className="rounded-full border border-slate-800/80 bg-white/5 px-3 py-1 text-xs font-medium text-slate-300">
                    {tech}
                  </span>))}
              </div>) : (<p className="text-sm text-slate-400">Brak przypisanych technologii.</p>)}
          </section>

          {project.goals && project.goals.length > 0 && (<section className="rounded-3xl bg-[#0f141b] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-6">
              <div className="mb-4 flex items-center gap-3">
                <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                  <fa_1.FaBullseye />
                </span>
                <div>
                  <div className="text-sm font-medium text-white">Cele projektu</div>
                  <div className="text-xs text-slate-500">Najważniejsze założenia</div>
                </div>
              </div>

              <ul className="grid gap-3">
                {project.goals.map((goal, index) => (<li key={index} className="flex items-start gap-3 rounded-2xl bg-white/[0.02] p-3 text-slate-300">
                    <span className="mt-0.5 flex h-5 w-5 flex-shrink-0 items-center justify-center rounded-full bg-slate-800 text-[11px] font-semibold text-slate-300">
                      {index + 1}
                    </span>
                    <span className="leading-6">{goal}</span>
                  </li>))}
              </ul>
            </section>)}
        </div>

        <aside className="grid gap-4 xl:col-span-2">
          <section className="rounded-3xl bg-[#0f141b] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                <fa_1.FaClock />
              </span>
              <div>
                <div className="text-sm font-medium text-white">Ostatnia aktualizacja</div>
                <div className="text-xs text-slate-500">Kiedy projekt był ostatnio zmieniany</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-xl font-semibold text-white">{new Date(project.lastUpdate).toLocaleDateString('pl-PL')}</div>
              <p className="mt-1 text-sm text-slate-400">
                {new Date(project.lastUpdate).toLocaleTimeString('pl-PL', { hour: '2-digit', minute: '2-digit' })}
              </p>
            </div>
          </section>

          <section className="rounded-3xl bg-[#0f141b] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                <fa_1.FaUsers />
              </span>
              <div>
                <div className="text-sm font-medium text-white">Zespół</div>
                <div className="text-xs text-slate-500">Liczba osób w projekcie</div>
              </div>
            </div>
            <div className="rounded-2xl bg-white/[0.03] p-4">
              <div className="text-3xl font-semibold tracking-tight text-white">{project.teamSize}</div>
              <p className="mt-1 text-sm text-slate-400">członków zespołu</p>
            </div>
          </section>

          <section className="rounded-3xl bg-[#0f141b] p-5 shadow-[0_0_0_1px_rgba(15,23,42,0.75)] lg:p-6">
            <div className="mb-4 flex items-center gap-3">
              <span className="inline-flex h-9 w-9 items-center justify-center rounded-xl bg-white/5 text-slate-200">
                <fa_1.FaBolt />
              </span>
              <div>
                <div className="text-sm font-medium text-white">Priorytet</div>
                <div className="text-xs text-slate-500">Jak pilny jest ten projekt</div>
              </div>
            </div>
            <div className={`inline-flex rounded-full px-3 py-1.5 text-sm font-medium ${priorityStyle.color}`}>
              {priorityStyle.label}
            </div>
          </section>
        </aside>
      </div>

      <div className="flex items-center justify-center gap-2 pt-6 text-sm text-slate-500">
        <fa_1.FaGlobe />
        <span>Każdy może przeglądać postępy</span>
      </div>
    </div>);
}
