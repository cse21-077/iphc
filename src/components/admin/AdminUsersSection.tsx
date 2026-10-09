import React, { useMemo, useState } from 'react';
import { AdminUser, RegistrationPayload } from '../../api';
import { Search, UserPlus, X } from 'lucide-react';

interface AdminUsersSectionProps {
  users: AdminUser[];
  onCreateUser: (payload: RegistrationPayload) => Promise<void>;
}

const fieldClass = 'w-full rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-[#3F76C5]/40';

export const AdminUsersSection: React.FC<AdminUsersSectionProps> = ({ users, onCreateUser }) => {
  const [query, setQuery] = useState('');
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
        <div className="flex gap-2">
          <label className="relative flex-1 md:w-72">
            <Search className="w-4 h-4 text-slate-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
            <input
              value={query}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search name, phone, email, branch"
              className="w-full pl-10 pr-3 py-2.5 rounded-lg bg-white border border-slate-200 text-xs font-semibold focus:outline-none focus:ring-2 focus:ring-[#3F76C5]/40"
            />
          </label>
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
    </section>
  );
};