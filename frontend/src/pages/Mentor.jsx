import { createElement } from 'react';
import { BarChart3, ShieldCheck, Users } from 'lucide-react';
import useAuthStore from '../store/useAuthStore';

export default function Mentor() {
  const user = useAuthStore((state) => state.user);

  return (
    <div className="page mentor-page">
      <div className="container mentor-layout">
        <aside className="mentor-sidebar" aria-label="Conversations">
          <p className="section-label">Mentor Console</p>
          <h2 className="mentor-sidebar-title">Inbox</h2>
          <ul className="mentor-thread-list">
            <li>
              <div className="mentor-thread mentor-thread--active">
                <span className="mentor-thread-title">Workspace</span>
                <span className="mentor-thread-meta">Active</span>
              </div>
            </li>
            <li>
              <div className="mentor-thread">
                <span className="mentor-thread-title">Session reviews</span>
                <span className="mentor-thread-meta">Soon</span>
              </div>
            </li>
          </ul>
          <p className="text-secondary mentor-sidebar-note">
            The mentor route is protected separately so coaching and trainee workflows can evolve independently without
            weakening authentication boundaries.
          </p>
        </aside>

        <section className="mentor-main mentor-chat-area">
          <header className="mentor-chat-header">
            <p className="section-label">Coach workspace</p>
            <h1 className="page-title">Coach workspace for {user?.name || 'mentor'}</h1>
          </header>
          <div className="mentor-chat">
            <MentorCard role="user" icon={Users} title="Athlete Oversight" copy="Use this route for future trainee rosters, session review, and intervention workflows." />
            <MentorCard role="assistant" icon={BarChart3} title="Report Review" copy="Firestore session summaries can be queried here without exposing mentor-only views to trainees." />
            <MentorCard role="assistant" icon={ShieldCheck} title="Role Isolation" copy="Protected routing enforces mentor-only access after Firebase-backed role resolution." />
          </div>
          <div className="mentor-input-bar">
            <input type="text" className="input-field" placeholder="Mentor messaging coming soon" readOnly aria-readonly="true" />
            <button type="button" className="btn-primary mentor-send-btn" disabled>
              Send
            </button>
          </div>
        </section>
      </div>
    </div>
  );
}

function MentorCard({ icon, title, copy, role = 'assistant' }) {
  return (
    <div className={`chat-bubble chat-bubble--${role}`}>
      {createElement(icon, { className: 'icon-sm text-accent' })}
      <h3 className="card-title">{title}</h3>
      <p className="text-secondary">{copy}</p>
    </div>
  );
}
