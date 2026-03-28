import { createElement } from 'react';
import { BarChart3, ShieldCheck, Users } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Mentor() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="min-h-screen pt-24 pb-12 px-6">
      <div className="max-w-6xl mx-auto flex flex-col gap-6">
        <section className="glass-card p-8 lg:p-10">
          <p className="text-sm uppercase tracking-[0.25em] text-dark-300">Mentor Console</p>
          <h1 className="text-4xl font-black text-white mt-3">Coach workspace for {user?.name || 'mentor'}</h1>
          <p className="text-dark-200 mt-4 max-w-2xl">
            The mentor route is protected separately so coaching and trainee workflows can evolve independently without
            weakening authentication boundaries.
          </p>
        </section>

        <section className="grid md:grid-cols-3 gap-4">
          <MentorCard icon={Users} title="Athlete Oversight" copy="Use this route for future trainee rosters, session review, and intervention workflows." />
          <MentorCard icon={BarChart3} title="Report Review" copy="Firestore session summaries can be queried here without exposing mentor-only views to trainees." />
          <MentorCard icon={ShieldCheck} title="Role Isolation" copy="Protected routing enforces mentor-only access after Firebase-backed role resolution." />
        </section>
      </div>
    </div>
  );
}

function MentorCard({ icon, title, copy }) {
  return (
    <div className="glass-card p-6">
      {createElement(icon, { className: 'w-5 h-5 text-accent-primary' })}
      <h3 className="text-lg font-bold text-white mt-4">{title}</h3>
      <p className="text-dark-200 text-sm mt-3">{copy}</p>
    </div>
  );
}
