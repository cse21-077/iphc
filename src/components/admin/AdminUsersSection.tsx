import React, { useMemo, useState } from 'react';
import { AdminUser, RegistrationPayload } from '../../api';
import { UserPlus, X, Phone, Mail, MapPin, CalendarDays, ShieldCheck } from 'lucide-react';
import { SearchInput, ViewToggle } from './ViewControls';

interface AdminUsersSectionProps {
  users: AdminUser[];
  onCreateUser: (payload: RegistrationPayload) => Promise<void>;
}

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F76C5]/40';

const initialsOf = (name: string) =>
  name
    .split(' ')
    .filter(Boolean)
    .map((word) => word[0])
    .slice(0, 2)
    .join('')
    .toUpperCase() || '?';

export const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({ users, onCreateUser }) => {
  const [query, setQuery] = useState('');
  const [view, setView] = useState<'list' | 'grid'>('list');
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState('');
  const [form, setForm] = useState({
    fullName: '',
    title: 'Member',
    phone: '',
    email: '',
    password: '',
    branch: '',
    section: 'BaPriest',
  });

  const filteredUsers = useMemo(() => {
    const search = query.trim().toLowerCase();
    if (!search) return users;
    return users.filter((user) =>
      [user.member?.name, user.phone, user.email, user.member?.branch, user.role]
        .filter(Boolean)
        .some((value) => String(value).toLowerCase().includes(search))
    );
  }, [query, users]);

  const submit = async (event: React.FormEvent) => {
    event.preventDefault();
    setError('');
    setIsSaving(true);
    try {
      await onCreateUser({
        ...form,
        email: form.email.trim() || undefined,
        familyMembers: [],
      });
      setForm({ fullName: '', title: 'Member', phone: '', email: '', password: '', branch: '', section: 'BaPriest' });
      setIsFormOpen(false);
    } catch (createError) {
      setError(createError instanceof Error ? createError.message : 'Could not create the account.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <section>
      <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
        <div>
          <h2 className="text-lg font-extrabold tracking-tight">User Accounts</h2>
          <p className="text-xs font-semibold text-slate-400 mt-0.5">{users.length} accounts in the shared IPHC database</p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <SearchInput
            value={query}
            onChange={setQuery}
            placeholder="Search name, phone, email, branch"
            className="flex-1 md:w-72"
          />
          <ViewToggle view={view} onChange={setView} />
          <button
            type="button"
            onClick={() => setIsFormOpen((open) => !open)}
            className="inline-flex items-center gap-2 rounded-lg bg-[#0A2A52] px-3.5 py-2.5 text-xs font-bold text-white hover:bg-[#123d71]"
          >
            {isFormOpen ? <X className="w-4 h-4" /> : <UserPlus className="w-4 h-4" />}
            {isFormOpen ? 'Close' : 'Create user'}
          </button>
        </div>
      </div>

      {isFormOpen && (
        <form onSubmit={submit} className="mb-4 rounded-xl border border-slate-200 bg-white p-4">
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3">
            <input required value={form.fullName} onChange={(event) => setForm({ ...form, fullName: event.target.value })} placeholder="Full name" className={fieldClass} />
            <input required type="tel" value={form.phone} onChange={(event) => setForm({ ...form, phone: event.target.value })} placeholder="Phone with country code" className={fieldClass} />
            <input type="email" value={form.email} onChange={(event) => setForm({ ...form, email: event.target.value })} placeholder="Email (optional)" className={fieldClass} />
            <input required minLength={8} type="password" value={form.password} onChange={(event) => setForm({ ...form, password: event.target.value })} placeholder="Temporary password" className={fieldClass} />
            <input required value={form.branch} onChange={(event) => setForm({ ...form, branch: event.target.value })} placeholder="Branch" className={fieldClass} />
            <input required value={form.section} onChange={(event) => setForm({ ...form, section: event.target.value })} placeholder="Section" className={fieldClass} />
          </div>
          {error && <p className="text-xs font-semibold text-red-600 mt-3">{error}</p>}
          <div className="flex justify-end mt-3">
            <button disabled={isSaving} className="rounded-lg bg-emerald-700 px-4 py-2.5 text-xs font-bold text-white disabled:opacity-50">
              {isSaving ? 'Creating…' : 'Create account'}
            </button>
          </div>
        </form>
      )}

      {view === 'list' ? (
        <div className="bg-white rounded-xl border border-slate-100 overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full text-xs min-w-[720px]">
              <thead>
                <tr className="text-left text-slate-400 font-bold border-b border-slate-100 bg-slate-50/60">
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-3">Phone</th>
                  <th className="py-3 px-3">Email</th>
                  <th className="py-3 px-3">Branch</th>
                  <th className="py-3 px-3">Created</th>
                  <th className="py-3 px-4 text-right">Role / Status</th>
                </tr>
              </thead>
              <tbody>
                {filteredUsers.map((user) => (
                  <tr key={user.id} className="border-b border-slate-50 last:border-0 hover:bg-slate-50/60">
                    <td className="py-3 px-4 font-bold text-slate-800">{user.member?.name ?? 'Profile not submitted'}</td>
                    <td className="py-3 px-3 font-mono font-semibold text-slate-600">{user.phone}</td>
                    <td className="py-3 px-3 text-slate-500">{user.email ?? '—'}</td>
                    <td className="py-3 px-3 text-slate-500">{user.member?.branch ?? '—'}</td>
                    <td className="py-3 px-3 text-slate-500 whitespace-nowrap">{new Date(user.createdAt).toLocaleDateString()}</td>
                    <td className="py-3 px-4 text-right whitespace-nowrap">
                      <span className="font-extrabold text-slate-700">{user.role}</span>
                      <span className={`ml-2 inline-block rounded-full px-2 py-1 text-[9px] font-extrabold ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                        {user.status}
                      </span>
                    </td>
                  </tr>
                ))}
                {filteredUsers.length === 0 && (
                  <tr><td colSpan={6} className="py-10 text-center text-slate-400 font-semibold">No accounts match this search.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {filteredUsers.map((user) => (
            <div key={user.id} className="bg-white rounded-2xl border border-slate-100 shadow-[0_4px_16px_rgba(15,42,82,0.05)] p-5">
              <div className="flex items-start gap-3">
                <div className="w-11 h-11 rounded-2xl bg-[#0A2A52] text-white flex items-center justify-center font-extrabold text-sm shrink-0">
                  {initialsOf(user.member?.name ?? user.email ?? '?')}
                </div>
                <div className="min-w-0 flex-1">
                  <h3 className="text-sm font-extrabold text-slate-900 truncate">{user.member?.name ?? 'Profile not submitted'}</h3>
                  <p className="text-[11px] font-bold text-slate-400 truncate">{user.email ?? user.phone}</p>
                </div>
                <span className={`shrink-0 inline-flex items-center gap-1 rounded-full px-2 py-1 text-[9px] font-extrabold ${user.status === 'ACTIVE' ? 'bg-emerald-50 text-emerald-700' : 'bg-slate-100 text-slate-500'}`}>
                  {user.status === 'ACTIVE' && <ShieldCheck className="w-2.5 h-2.5" />}
                  {user.status}
                </span>
              </div>
              <div className="mt-4 pt-3 border-t border-slate-50 space-y-1.5 text-[11px] font-semibold text-slate-500">
                <p className="flex items-center gap-2"><Phone className="w-3.5 h-3.5 text-[#3F76C5]" />{user.phone}</p>
                <p className="flex items-center gap-2 truncate"><Mail className="w-3.5 h-3.5 text-[#3F76C5] shrink-0" /><span className="truncate">{user.email ?? '—'}</span></p>
                <p className="flex items-center gap-2"><MapPin className="w-3.5 h-3.5 text-[#3F76C5]" />{user.member?.branch ?? '—'}</p>
                <p className="flex items-center gap-2"><CalendarDays className="w-3.5 h-3.5 text-[#3F76C5]" />Joined {new Date(user.createdAt).toLocaleDateString()}</p>
              </div>
              <div className="mt-3 pt-3 border-t border-slate-50 flex items-center justify-between">
                <span className="text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">Role</span>
                <span className="text-[10px] font-extrabold text-[#0A2A52] bg-blue-50 rounded-full px-2.5 py-1">{user.role}</span>
              </div>
            </div>
          ))}
          {filteredUsers.length === 0 && (
            <div className="sm:col-span-2 xl:col-span-3 bg-white rounded-2xl border border-slate-100 py-10 text-center text-slate-400 text-xs font-semibold">
              No accounts match this search.
            </div>
          )}
        </div>
      )}
    </section>
  );
};