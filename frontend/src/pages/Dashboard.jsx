import { useAuth } from '../AuthContext';
import PendingApproval from './PendingApproval';
import AdminDashboard from './AdminDashboard';
import OrgDashboard from './OrgDashboard';
import VolunteerDashboard from './VolunteerDashboard';

export default function Dashboard() {
  const { profile, loading, user } = useAuth();

  if (loading) return <div className="status-message">Loading...</div>;

  if (!user) {
    return (
      <div className="welcome-screen">
        <h1>Welcome to CommunityPulse</h1>
        <p>Connect with local volunteers and organisations to address urgent needs.</p>
        <p>Please <strong>login or register</strong> to get started.</p>
      </div>
    );
  }

  if (!profile) return <div className="status-message">No profile data.</div>;

  if (profile.status !== 'approved') {
    return <PendingApproval />;
  }

  switch (profile.role) {
    case 'admin': return <AdminDashboard />;
    case 'organization': return <OrgDashboard />;
    case 'volunteer': return <VolunteerDashboard />;
    default: return <div>Unknown role</div>;
  }
}