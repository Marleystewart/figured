import { useEffect, useState } from 'react'
import {
  Bell,
  CalendarDays,
  Check,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  FileText,
  FolderOpen,
  HeartHandshake,
  Home,
  Eye,
  ListPlus,
  Lock,
  Mail,
  MessageSquarePlus,
  NotebookTabs,
  Pill,
  Plus,
  Settings2,
  ShieldCheck,
  Smile,
  Sparkles,
  Users,
} from 'lucide-react'

const navItems = [
  { label: 'Home', icon: Home },
  { label: 'Calendar', icon: CalendarDays },
  { label: 'Medications', icon: Pill },
  { label: 'Notes & Logs', icon: NotebookTabs },
  { label: 'Care Team', icon: Users },
  { label: 'Documents', icon: FolderOpen },
  { label: 'Reports', icon: ClipboardList },
]

const tabFromHash = () => {
  const hash = window.location.hash.replace('#', '')
  return navItems.find((item) => item.label.toLowerCase().replace(/[^a-z0-9]+/g, '-') === hash)?.label || 'Home'
}

const stats = [
  {
    label: 'Next Appointment',
    value: 'Today, 2:30 PM',
    detail: 'Speech Therapy',
    icon: CalendarDays,
    tone: 'bg-violet-100 text-violet',
  },
  {
    label: 'Medications',
    value: '2 due today',
    detail: 'See schedule',
    icon: Pill,
    tone: 'bg-emerald-100 text-emerald-600',
  },
  {
    label: 'Logs This Week',
    value: '4 entries',
    detail: 'View timeline',
    icon: FileText,
    tone: 'bg-amber-100 text-amber-500',
  },
  {
    label: 'IEP Meeting',
    value: 'May 22, 10:00 AM',
    detail: 'Prep in progress',
    icon: Users,
    tone: 'bg-indigo-100 text-indigo-600',
  },
]

const schedule = [
  { time: '9:00 AM', title: 'Occupational Therapy', place: 'Bright Kids Therapy Center', color: 'bg-emerald-400', done: true },
  { time: '2:30 PM', title: 'Speech Therapy', place: 'Bright Kids Therapy Center', color: 'bg-violet-300' },
  { time: '4:15 PM', title: 'Pick up Medication', place: 'CVS Pharmacy', color: 'bg-amber-300' },
  { time: '7:00 PM', title: 'ABA Session', place: 'At Home', color: 'bg-sky-300' },
]

const medications = [
  { name: 'Risperidone', dose: '0.25 mg', timing: 'Morning', status: 'Taken', time: '7:30 AM', done: true, visibility: 'Parents only', author: 'Mom' },
  { name: 'Omega 3', dose: '1 capsule', timing: 'With lunch', status: 'Due', time: '12:00 PM', visibility: 'Care Team', author: 'Dad' },
  { name: 'Melatonin', dose: '1 mg', timing: 'At bedtime', status: 'Due', time: '8:30 PM', visibility: 'Parents only', author: 'Mom' },
]

const logs = [
  {
    date: 'May 13',
    time: '7:45 PM',
    by: 'Mom',
    icon: Smile,
    iconTone: 'border-emerald-200 bg-emerald-50 text-emerald-600',
    note: 'Great day! Alex stayed calm during transitions and completed homework with minimal reminders.',
    tag: 'Behavior',
    tagTone: 'bg-emerald-50 text-emerald-700',
  },
  {
    date: 'May 12',
    time: '3:10 PM',
    by: 'Ms. Taylor',
    icon: MessageSquarePlus,
    iconTone: 'border-amber-200 bg-amber-50 text-amber-600',
    note: "Working on /r/ blends. Great progress with 'br' and 'gr' sounds.",
    tag: 'Therapy Note',
    tagTone: 'bg-violet-50 text-violet',
  },
  {
    date: 'May 11',
    time: '9:05 PM',
    by: 'Dad',
    icon: FileText,
    iconTone: 'border-sky-200 bg-sky-50 text-sky-600',
    note: 'Had a tough evening. Meltdown during dinner. Seemed overstimulated after a noisy afternoon.',
    tag: 'Behavior',
    tagTone: 'bg-sky-50 text-sky-700',
  },
]

const moods = [
  { label: 'Great', face: '☺', tone: 'text-emerald-500' },
  { label: 'Good', face: '🙂', tone: 'text-teal-500' },
  { label: 'Okay', face: '😐', tone: 'text-amber-500' },
  { label: 'Hard', face: '☹', tone: 'text-orange-500' },
  { label: 'Really hard', face: '☹', tone: 'text-rose-500' },
]

const careTeam = [
  { name: 'Mom', role: 'Parent/Guardian', access: 'Full access', image: 'MJ', color: 'from-rose-300 to-orange-200' },
  { name: 'Dad', role: 'Parent/Guardian', access: 'Full access', image: 'DJ', color: 'from-sky-300 to-indigo-300' },
  { name: 'Ms. Taylor', role: 'Therapist/Provider', access: 'Session notes only', image: 'MT', color: 'from-emerald-300 to-teal-200' },
  { name: 'Mrs. Bennett', role: 'Family/Aide', access: 'Custom view', image: 'MB', color: 'from-violet-300 to-fuchsia-200' },
]

const roles = [
  { title: 'Parent/Guardian', description: 'Full access to meds, documents, reports, logs, invites, and permissions.', tone: 'bg-indigo-50 text-indigo-700' },
  { title: 'Therapist/Provider', description: 'Can view and add session notes. Medication history requires parent approval.', tone: 'bg-emerald-50 text-emerald-700' },
  { title: 'Family/Aide', description: 'Configurable access. Parent decides which schedules, logs, and notes are visible.', tone: 'bg-amber-50 text-amber-700' },
]

const activity = [
  { actor: 'Ms. Taylor', action: 'added a speech therapy note', item: '/r/ blends progress', time: 'May 12, 3:10 PM', visibility: 'Care Team' },
  { actor: 'Mom', action: 'marked Risperidone as taken', item: 'Morning medication', time: 'May 13, 7:30 AM', visibility: 'Parents only' },
  { actor: 'Dad', action: 'added a behavior log', item: 'Dinner transition support', time: 'May 11, 9:05 PM', visibility: 'Parents + Providers' },
]

const documents = [
  { title: 'IEP Draft Summary', type: 'Report', owner: 'Mom', visibility: 'Parents + Case Manager', updated: 'May 13' },
  { title: 'Speech Therapy Plan', type: 'Therapy', owner: 'Ms. Taylor', visibility: 'Care Team', updated: 'May 12' },
  { title: 'Medication Authorization Form', type: 'Medical', owner: 'Mom', visibility: 'Parents only', updated: 'May 8' },
]

const reports = [
  { label: 'Behavior trend', value: '3 calm transitions', detail: 'Up from 1 last week', tone: 'bg-emerald-50 text-emerald-700' },
  { label: 'Therapy notes', value: '6 new skills', detail: 'Speech and OT combined', tone: 'bg-violet-50 text-violet' },
  { label: 'Medication adherence', value: '92%', detail: 'Last 30 days', tone: 'bg-indigo-50 text-indigo-700' },
]

function Card({ children, className = '' }) {
  return (
    <section className={`rounded-[1.15rem] border border-[#e8ecf6] bg-white shadow-[0_14px_38px_rgba(80,91,145,0.08)] ${className}`}>
      {children}
    </section>
  )
}

function Sidebar({ activeTab, onTabChange }) {
  return (
    <aside className="flex flex-col gap-4 border-[#e8ecf6] bg-white/78 p-4 backdrop-blur-xl lg:w-[250px] lg:rounded-l-[2rem] lg:border-r">
      <div className="flex items-center gap-3 px-1">
        <div className="relative grid h-11 w-11 place-items-center rounded-2xl bg-gradient-to-br from-indigo-500 via-violet to-indigo-400 text-white shadow-soft">
          <HeartHandshake className="h-6 w-6" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 h-3 w-3 rounded-full bg-emerald-300 ring-2 ring-white" />
        </div>
        <div>
          <p className="text-[1.35rem] font-extrabold leading-6 tracking-tight text-ink">CareHub</p>
          <p className="text-xs font-bold text-muted">For Families</p>
        </div>
      </div>

      <button className="flex items-center justify-between rounded-2xl border border-[#e8ecf6] bg-white p-3 text-left shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft">
        <span className="flex items-center gap-3">
          <span className="grid h-12 w-12 place-items-center overflow-hidden rounded-full bg-[radial-gradient(circle_at_40%_30%,#fff_0_12%,#bfdbfe_13%_42%,#c4b5fd_43%_100%)] text-base font-black text-indigo-700">
            AJ
          </span>
          <span>
            <span className="block text-sm font-extrabold text-ink">Alex Johnson</span>
            <span className="block text-xs font-bold text-muted">Age 9 • Autism</span>
          </span>
        </span>
        <ChevronDown className="h-4 w-4 text-slate-500" aria-hidden="true" />
      </button>

      <nav className="grid grid-cols-2 gap-1.5 sm:grid-cols-4 lg:grid-cols-1" aria-label="Main navigation">
        {navItems.map((item) => (
          <button
            key={item.label}
            type="button"
            onClick={() => onTabChange(item.label)}
            aria-current={activeTab === item.label ? 'page' : undefined}
            className={`flex items-center gap-3 rounded-xl px-3 py-2.5 text-left text-sm font-extrabold transition ${
              activeTab === item.label
                ? 'bg-gradient-to-r from-indigo-700 to-violet text-white shadow-soft'
                : 'text-slate-600 hover:bg-indigo-50 hover:text-indigo-700'
            }`}
          >
            <span className={`grid h-7 w-7 place-items-center rounded-lg ${activeTab === item.label ? 'bg-white/15' : 'bg-slate-100'}`}>
              <item.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            {item.label}
          </button>
        ))}
      </nav>

      <Card className="hidden p-3.5 lg:mt-auto lg:block">
        <div className="mb-3 flex items-center justify-between">
          <h2 className="text-sm font-extrabold text-ink">Care Team</h2>
          <Users className="h-4 w-4 text-muted" aria-hidden="true" />
        </div>
        <div className="grid gap-2.5">
          {careTeam.map((person) => (
            <div key={person.name} className="flex items-center gap-2.5">
              <div className={`grid h-9 w-9 place-items-center rounded-full bg-gradient-to-br ${person.color} text-[0.68rem] font-black text-white shadow-sm`}>
                {person.image}
              </div>
              <div>
                <p className="text-xs font-extrabold text-ink">{person.name}</p>
                <p className="text-[0.68rem] font-bold text-muted">{person.role}</p>
                <p className="text-[0.63rem] font-black text-violet">{person.access}</p>
              </div>
            </div>
          ))}
        </div>
        <button className="mt-3 flex items-center gap-2 text-xs font-extrabold text-violet transition hover:text-indigo-800">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Invite Someone
        </button>
      </Card>
    </aside>
  )
}

function TopBar() {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">Good morning, Mom ☀</h1>
        <p className="mt-1 text-sm font-semibold text-muted">Here's what's happening with Alex today.</p>
      </div>
      <div className="flex items-center gap-3">
        <button className="relative grid h-11 w-11 place-items-center rounded-2xl border border-[#e8ecf6] bg-white text-ink shadow-sm transition hover:-translate-y-0.5 hover:shadow-soft" aria-label="Notifications">
          <Bell className="h-5 w-5" aria-hidden="true" />
          <span className="absolute -right-1 -top-1 grid h-5 w-5 place-items-center rounded-full bg-rose-500 text-[0.65rem] font-black text-white ring-2 ring-white">3</span>
        </button>
        <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-700 to-violet px-5 py-3 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5">
          <Plus className="h-4 w-4" aria-hidden="true" />
          Add
        </button>
      </div>
    </header>
  )
}

function Stats() {
  return (
    <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
      {stats.map((stat) => (
        <Card key={stat.label} className="group p-3.5">
          <div className="flex items-center gap-3">
            <div className={`grid h-12 w-12 shrink-0 place-items-center rounded-2xl ${stat.tone}`}>
              <stat.icon className="h-6 w-6" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-[0.66rem] font-black uppercase tracking-[0.08em] text-muted">{stat.label}</p>
              <p className="truncate text-sm font-black text-ink">{stat.value}</p>
              <p className="truncate text-xs font-bold text-muted">{stat.detail}</p>
            </div>
            <ChevronRight className="h-4 w-4 text-slate-400 transition group-hover:translate-x-0.5 group-hover:text-violet" aria-hidden="true" />
          </div>
        </Card>
      ))}
    </div>
  )
}

function CardTitle({ icon: Icon, title, action, children }) {
  return (
    <div className="mb-3 flex items-start justify-between gap-3">
      <div>
        <div className="flex items-center gap-2">
          <Icon className="h-4 w-4 text-violet" aria-hidden="true" />
          <h2 className="text-sm font-black text-ink">{title}</h2>
        </div>
        {children}
      </div>
      {action ? <button className="text-xs font-black text-violet hover:text-indigo-800">{action}</button> : null}
    </div>
  )
}

function ScheduleCard() {
  return (
    <Card className="p-3.5">
      <CardTitle icon={CalendarDays} title="Today's Schedule">
        <p className="mt-2 text-xs font-bold text-muted">May 14, Wednesday</p>
      </CardTitle>
      <div className="mb-2 flex justify-end gap-2 text-violet">
        <ChevronLeft className="h-4 w-4" aria-hidden="true" />
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </div>
      <div className="grid gap-2">
        {schedule.map((item) => (
          <button key={item.title} className="flex w-full items-center gap-3 rounded-xl border border-transparent bg-slate-50/80 p-2.5 text-left transition hover:border-indigo-100 hover:bg-white hover:shadow-sm">
            <span className={`h-11 w-1 rounded-full ${item.color}`} />
            <span className="w-[58px] shrink-0 text-xs font-black text-muted">{item.time}</span>
            <span className="min-w-0 flex-1">
              <span className="block truncate text-xs font-black text-ink">{item.title}</span>
              <span className="block truncate text-[0.68rem] font-bold text-muted">{item.place}</span>
            </span>
            <span className={`grid h-5 w-5 place-items-center rounded-full border ${item.done ? 'border-emerald-200 bg-emerald-50 text-emerald-500' : 'border-indigo-200 text-indigo-300'}`}>
              {item.done ? <Check className="h-3 w-3" aria-hidden="true" /> : null}
            </span>
          </button>
        ))}
      </div>
      <button className="mt-3 flex w-full items-center justify-between text-xs font-black text-violet">
        View full calendar
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </Card>
  )
}

function MedicationsCard() {
  return (
    <Card className="p-3.5">
      <CardTitle icon={Pill} title="Medications" action="Manage visibility">
        <span className="mt-2 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[0.63rem] font-black text-indigo-700">
          <Eye className="h-3 w-3" aria-hidden="true" />
          Sensitive data
        </span>
      </CardTitle>
      <div className="divide-y divide-[#edf0f7]">
        {medications.map((med) => (
          <div key={med.name} className="flex items-center gap-2.5 py-3 first:pt-0">
            <div className={`grid h-9 w-9 shrink-0 place-items-center rounded-xl ${med.done ? 'bg-emerald-50 text-emerald-600' : 'bg-amber-50 text-amber-500'}`}>
              {med.done ? <Check className="h-4 w-4" aria-hidden="true" /> : <Pill className="h-4 w-4" aria-hidden="true" />}
            </div>
            <div className="min-w-0 flex-1">
              <p className="truncate text-xs font-black text-ink">{med.name}</p>
              <p className="truncate text-[0.68rem] font-bold text-muted">{med.dose} • {med.timing}</p>
              <p className="mt-1 inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-0.5 text-[0.62rem] font-black text-slate-600">
                <Lock className="h-3 w-3" aria-hidden="true" />
                Visible to: {med.visibility}
              </p>
            </div>
            <div className="text-right">
              <p className={`text-[0.68rem] font-black ${med.done ? 'text-emerald-600' : 'text-amber-500'}`}>{med.status}</p>
              <p className="text-[0.68rem] font-bold text-muted">{med.time}</p>
              <p className="text-[0.62rem] font-bold text-muted">by {med.author}</p>
            </div>
          </div>
        ))}
      </div>
      <button className="mt-2 flex w-full items-center justify-between text-xs font-black text-violet">
        View medication schedule
        <ChevronRight className="h-4 w-4" aria-hidden="true" />
      </button>
    </Card>
  )
}

function IepPrepCard() {
  return (
    <Card className="relative overflow-hidden p-4 text-center">
      <div className="absolute inset-0 bg-gradient-to-br from-indigo-50 via-white to-violet-50" />
      <div className="relative">
        <div className="mx-auto grid h-11 w-11 place-items-center rounded-2xl bg-white text-violet shadow-soft">
          <Sparkles className="h-6 w-6" aria-hidden="true" />
        </div>
        <h2 className="mt-3 text-xl font-black tracking-tight text-ink">IEP Meeting Prep</h2>
        <p className="mx-auto mt-2 max-w-[17rem] text-xs font-extrabold leading-5 text-slate-700">
          We've started your draft summary based on logs from Feb 14 - May 13.
        </p>
        <div className="mx-auto my-4 max-w-[15.5rem] rounded-2xl bg-white/85 p-4 shadow-sm">
          <div className="grid grid-cols-[1fr_46px] gap-3">
            <div className="grid gap-2">
              <span className="h-2.5 w-24 rounded-full bg-slate-200" />
              <span className="h-2.5 w-16 rounded-full bg-emerald-100" />
              <span className="h-2.5 w-28 rounded-full bg-rose-100" />
              <span className="h-2.5 w-24 rounded-full bg-amber-100" />
            </div>
            <div className="grid h-12 w-12 place-items-center rounded-full bg-[conic-gradient(#c4b5fd_0_28%,#bae6fd_28%_50%,#fed7aa_50%_72%,#bbf7d0_72%_100%)]">
              <span className="h-5 w-5 rounded-full bg-white" />
            </div>
          </div>
        </div>
        <div className="grid gap-2">
          <button className="rounded-xl bg-gradient-to-r from-indigo-700 to-violet px-4 py-3 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5">
            View IEP Summary
          </button>
          <button className="rounded-xl border border-indigo-100 bg-white/75 px-4 py-2.5 text-xs font-black text-violet transition hover:bg-white">
            Share with team
          </button>
        </div>
      </div>
    </Card>
  )
}

function LogsCard() {
  return (
    <Card className="p-3.5">
      <CardTitle icon={NotebookTabs} title="Recent Logs & Notes" action="View timeline" />
      <div className="relative grid gap-2.5">
        <span className="absolute bottom-7 left-[14px] top-7 w-px bg-[#e8ecf6]" />
        {logs.map((log) => (
          <article key={log.note} className="relative flex gap-3 rounded-xl border border-transparent bg-white p-2.5 transition hover:border-indigo-100 hover:bg-slate-50">
            <div className={`z-10 grid h-7 w-7 shrink-0 place-items-center rounded-full border ${log.iconTone}`}>
              <log.icon className="h-4 w-4" aria-hidden="true" />
            </div>
            <div className="min-w-0 flex-1">
              <div className="mb-1 flex items-center justify-between gap-3">
                <p className="text-[0.65rem] font-black uppercase tracking-[0.08em] text-muted">{log.date} • {log.time} • {log.by}</p>
                <span className={`rounded-lg px-2 py-1 text-[0.65rem] font-black ${log.tagTone}`}>{log.tag}</span>
              </div>
              <p className="text-xs font-bold leading-5 text-slate-700">{log.note}</p>
            </div>
          </article>
        ))}
      </div>
    </Card>
  )
}

function QuickLogCard() {
  const actions = [
    { label: 'Add a note', icon: MessageSquarePlus },
    { label: 'Log a medication', icon: Pill },
    { label: 'Add an appointment', icon: CalendarDays },
  ]

  return (
    <Card className="p-3.5">
      <CardTitle icon={ListPlus} title="Quick Log" />
      <p className="mb-3 text-base font-black text-ink">How did today go?</p>
      <div className="mb-4 grid grid-cols-5 gap-2">
        {moods.map((mood) => (
          <button key={mood.label} className="rounded-xl border border-transparent bg-white py-2 text-center transition hover:-translate-y-0.5 hover:border-indigo-100 hover:bg-slate-50 hover:shadow-sm">
            <span className={`block text-2xl leading-6 ${mood.tone}`}>{mood.face}</span>
            <span className="mt-1 block text-[0.66rem] font-black text-slate-700">{mood.label}</span>
          </button>
        ))}
      </div>
      <div className="grid gap-2">
        {actions.map((action) => (
          <button key={action.label} className="flex items-center gap-3 rounded-xl border border-[#e8ecf6] bg-white px-3 py-2.5 text-left text-xs font-black text-ink transition hover:border-indigo-100 hover:bg-indigo-50">
            <span className="grid h-8 w-8 place-items-center rounded-lg bg-indigo-50 text-violet">
              <action.icon className="h-4 w-4" aria-hidden="true" />
            </span>
            <span className="flex-1">{action.label}</span>
            <ChevronRight className="h-4 w-4 text-slate-500" aria-hidden="true" />
          </button>
        ))}
      </div>
    </Card>
  )
}

function AccessOverviewCard() {
  return (
    <Card className="p-3.5">
      <CardTitle icon={ShieldCheck} title="Role-Based Access" action="Edit roles" />
      <div className="grid gap-2">
        {roles.map((role) => (
          <div key={role.title} className="rounded-xl border border-[#edf0f7] bg-white p-3">
            <div className="mb-1 flex items-center justify-between gap-2">
              <p className="text-xs font-black text-ink">{role.title}</p>
              <span className={`rounded-full px-2 py-1 text-[0.62rem] font-black ${role.tone}`}>Role</span>
            </div>
            <p className="text-[0.68rem] font-bold leading-4 text-muted">{role.description}</p>
          </div>
        ))}
      </div>
    </Card>
  )
}

function InviteCard() {
  return (
    <Card className="p-3.5">
      <CardTitle icon={Mail} title="Invite Care Team" action="Preview invite" />
      <div className="grid gap-2">
        <label className="grid gap-1">
          <span className="text-[0.66rem] font-black uppercase tracking-[0.08em] text-muted">Email or phone</span>
          <input
            className="rounded-xl border border-[#e8ecf6] bg-slate-50 px-3 py-2.5 text-xs font-bold text-ink outline-none transition placeholder:text-slate-400 focus:border-indigo-300 focus:bg-white"
            placeholder="mstaylor@example.com"
          />
        </label>
        <label className="grid gap-1">
          <span className="text-[0.66rem] font-black uppercase tracking-[0.08em] text-muted">Role</span>
          <select className="rounded-xl border border-[#e8ecf6] bg-slate-50 px-3 py-2.5 text-xs font-bold text-ink outline-none transition focus:border-indigo-300 focus:bg-white">
            <option>Therapist/Provider</option>
            <option>Parent/Guardian</option>
            <option>Family/Aide</option>
          </select>
        </label>
        <div className="rounded-xl bg-indigo-50 p-3">
          <div className="flex items-center gap-2 text-xs font-black text-indigo-700">
            <Settings2 className="h-4 w-4" aria-hidden="true" />
            Parent controls visibility
          </div>
          <p className="mt-1 text-[0.68rem] font-bold leading-4 text-indigo-700/80">
            Suggested: notes and appointments visible, medications hidden until granted.
          </p>
        </div>
        <button className="mt-1 rounded-xl bg-gradient-to-r from-indigo-700 to-violet px-4 py-2.5 text-xs font-black text-white shadow-soft transition hover:-translate-y-0.5">
          Send Invite
        </button>
      </div>
    </Card>
  )
}

function ActivityLogCard() {
  return (
    <Card className="p-3.5">
      <CardTitle icon={ClipboardList} title="Activity Log" action="View all" />
      <div className="grid gap-2.5">
        {activity.map((entry) => (
          <div key={`${entry.actor}-${entry.time}`} className="rounded-xl border border-[#edf0f7] bg-white p-3">
            <p className="text-xs font-bold leading-5 text-slate-700">
              <span className="font-black text-ink">{entry.actor}</span> {entry.action}
            </p>
            <div className="mt-2 flex flex-wrap items-center justify-between gap-2">
              <p className="text-[0.68rem] font-bold text-muted">{entry.item} • {entry.time}</p>
              <span className="inline-flex items-center gap-1 rounded-full bg-slate-100 px-2 py-1 text-[0.62rem] font-black text-slate-600">
                <Eye className="h-3 w-3" aria-hidden="true" />
                {entry.visibility}
              </span>
            </div>
          </div>
        ))}
      </div>
    </Card>
  )
}

function PageHeader({ title, subtitle, action = 'Add' }) {
  return (
    <header className="flex items-start justify-between gap-4">
      <div>
        <h1 className="text-2xl font-black tracking-tight text-ink">{title}</h1>
        <p className="mt-1 text-sm font-semibold text-muted">{subtitle}</p>
      </div>
      <button className="flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-700 to-violet px-5 py-3 text-sm font-black text-white shadow-soft transition hover:-translate-y-0.5">
        <Plus className="h-4 w-4" aria-hidden="true" />
        {action}
      </button>
    </header>
  )
}

function HomeView() {
  return (
    <>
      <TopBar />
      <div className="mt-5">
        <Stats />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1.12fr]">
        <ScheduleCard />
        <MedicationsCard />
        <IepPrepCard />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1.35fr_1fr]">
        <LogsCard />
        <QuickLogCard />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr_1fr]">
        <AccessOverviewCard />
        <InviteCard />
        <ActivityLogCard />
      </div>
    </>
  )
}

function CalendarView() {
  return (
    <>
      <PageHeader title="Calendar" subtitle="All upcoming appointments, sessions, school meetings, and reminders." action="Add event" />
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.15fr_0.85fr]">
        <Card className="p-4">
          <CardTitle icon={CalendarDays} title="May 2026" action="Sync calendar" />
          <div className="grid grid-cols-7 gap-2 text-center">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-[0.66rem] font-black uppercase tracking-[0.08em] text-muted">{day}</div>
            ))}
            {Array.from({ length: 35 }, (_, index) => {
              const date = index - 2
              const hasEvent = [14, 22, 28].includes(date)
              return (
                <button key={index} className={`min-h-16 rounded-xl border p-2 text-left text-xs font-black transition hover:-translate-y-0.5 hover:shadow-sm ${hasEvent ? 'border-indigo-100 bg-indigo-50 text-indigo-700' : 'border-[#edf0f7] bg-white text-slate-500'}`}>
                  {date > 0 && date <= 31 ? date : ''}
                  {hasEvent ? <span className="mt-2 block h-1.5 w-8 rounded-full bg-violet" /> : null}
                </button>
              )
            })}
          </div>
        </Card>
        <ScheduleCard />
      </div>
    </>
  )
}

function MedicationsView() {
  return (
    <>
      <PageHeader title="Medications" subtitle="Track doses, authors, and exactly who can view sensitive medication details." action="Add medication" />
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.1fr_0.9fr]">
        <MedicationsCard />
        <ActivityLogCard />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-3">
        {medications.map((med) => (
          <Card key={med.name} className="p-4">
            <div className="mb-3 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-emerald-50 text-emerald-600">
                <Pill className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.62rem] font-black text-slate-600">Visible to: {med.visibility}</span>
            </div>
            <h2 className="font-black text-ink">{med.name}</h2>
            <p className="mt-1 text-sm font-bold text-muted">{med.dose} • {med.timing}</p>
            <p className="mt-3 text-xs font-bold text-muted">Logged by {med.author} • {med.time}</p>
          </Card>
        ))}
      </div>
    </>
  )
}

function NotesView() {
  return (
    <>
      <PageHeader title="Notes & Logs" subtitle="A shared timeline of therapy notes, behavior observations, and caregiver updates." action="Add note" />
      <div className="mt-5 grid gap-4 xl:grid-cols-[1.25fr_0.75fr]">
        <LogsCard />
        <QuickLogCard />
      </div>
      <div className="mt-4">
        <ActivityLogCard />
      </div>
    </>
  )
}

function CareTeamView() {
  return (
    <>
      <PageHeader title="Care Team" subtitle="Invite collaborators, assign roles, and tune visibility for each person." action="Invite" />
      <div className="mt-5 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <Card className="p-4">
          <CardTitle icon={Users} title="People with access" action="Manage" />
          <div className="grid gap-3">
            {careTeam.map((person) => (
              <div key={person.name} className="flex items-center justify-between gap-3 rounded-xl border border-[#edf0f7] bg-white p-3">
                <div className="flex items-center gap-3">
                  <div className={`grid h-11 w-11 place-items-center rounded-full bg-gradient-to-br ${person.color} text-xs font-black text-white`}>{person.image}</div>
                  <div>
                    <p className="text-sm font-black text-ink">{person.name}</p>
                    <p className="text-xs font-bold text-muted">{person.role}</p>
                  </div>
                </div>
                <span className="rounded-full bg-indigo-50 px-2 py-1 text-[0.65rem] font-black text-indigo-700">{person.access}</span>
              </div>
            ))}
          </div>
        </Card>
        <InviteCard />
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <AccessOverviewCard />
        <ActivityLogCard />
      </div>
    </>
  )
}

function DocumentsView() {
  return (
    <>
      <PageHeader title="Documents" subtitle="IEP drafts, school files, forms, and shared care documents." action="Upload" />
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {documents.map((doc) => (
          <Card key={doc.title} className="p-4">
            <div className="mb-4 flex items-center justify-between">
              <div className="grid h-10 w-10 place-items-center rounded-xl bg-indigo-50 text-violet">
                <FolderOpen className="h-5 w-5" aria-hidden="true" />
              </div>
              <span className="rounded-full bg-slate-100 px-2 py-1 text-[0.62rem] font-black text-slate-600">{doc.type}</span>
            </div>
            <h2 className="font-black text-ink">{doc.title}</h2>
            <p className="mt-2 text-xs font-bold text-muted">Owner: {doc.owner}</p>
            <p className="mt-1 text-xs font-bold text-muted">Updated: {doc.updated}</p>
            <p className="mt-3 inline-flex items-center gap-1 rounded-full bg-indigo-50 px-2 py-1 text-[0.63rem] font-black text-indigo-700">
              <Eye className="h-3 w-3" aria-hidden="true" />
              {doc.visibility}
            </p>
          </Card>
        ))}
      </div>
    </>
  )
}

function ReportsView() {
  return (
    <>
      <PageHeader title="Reports" subtitle="Prep summaries, trends, and care-team activity for meetings." action="Generate report" />
      <div className="mt-5 grid gap-4 xl:grid-cols-3">
        {reports.map((report) => (
          <Card key={report.label} className="p-4">
            <span className={`rounded-full px-2 py-1 text-[0.62rem] font-black ${report.tone}`}>{report.label}</span>
            <p className="mt-4 text-2xl font-black text-ink">{report.value}</p>
            <p className="mt-1 text-xs font-bold text-muted">{report.detail}</p>
          </Card>
        ))}
      </div>
      <div className="mt-4 grid gap-4 xl:grid-cols-[1fr_1fr]">
        <IepPrepCard />
        <ActivityLogCard />
      </div>
    </>
  )
}

function ActiveView({ activeTab }) {
  if (activeTab === 'Calendar') return <CalendarView />
  if (activeTab === 'Medications') return <MedicationsView />
  if (activeTab === 'Notes & Logs') return <NotesView />
  if (activeTab === 'Care Team') return <CareTeamView />
  if (activeTab === 'Documents') return <DocumentsView />
  if (activeTab === 'Reports') return <ReportsView />
  return <HomeView />
}

function App() {
  const [activeTab, setActiveTab] = useState(tabFromHash)

  useEffect(() => {
    const handleHashChange = () => setActiveTab(tabFromHash())
    window.addEventListener('hashchange', handleHashChange)
    return () => window.removeEventListener('hashchange', handleHashChange)
  }, [])

  const handleTabChange = (tab) => {
    setActiveTab(tab)
    window.location.hash = tab.toLowerCase().replace(/[^a-z0-9]+/g, '-')
  }

  return (
    <div className="min-h-screen bg-[radial-gradient(circle_at_10%_0%,rgba(99,102,241,0.13),transparent_34rem),linear-gradient(135deg,#fbfcff_0%,#f5f8ff_48%,#f8fbff_100%)] p-3 text-ink sm:p-5">
      <div className="mx-auto min-h-[calc(100vh-2.5rem)] max-w-[1320px] overflow-hidden rounded-[2rem] border border-white bg-white/55 shadow-[0_24px_80px_rgba(55,65,120,0.16)] backdrop-blur-xl lg:flex">
        <Sidebar activeTab={activeTab} onTabChange={handleTabChange} />
        <main className="min-w-0 flex-1 p-4 lg:p-5">
          <ActiveView activeTab={activeTab} />
          <footer className="mt-4 flex items-center gap-2 text-xs font-bold text-muted">
            <Lock className="h-4 w-4" aria-hidden="true" />
            Private and secure. Only people you invite can see Alex's information.
          </footer>
        </main>
      </div>
    </div>
  )
}

export default App
