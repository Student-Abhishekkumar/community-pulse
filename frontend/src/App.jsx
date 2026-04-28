import { useState } from 'react';
import Header from './components/Header';
import SubmitForm from './components/SubmitForm';
import ViewNeeds from './components/ViewNeeds';
import NeedDetail from './components/NeedDetail';
import VolunteerForm from './components/VolunteerForm';

export default function App() {
  const [activeView, setActiveView] = useState('needs');
  const [selectedNeedId, setSelectedNeedId] = useState(null);

  const handleViewChange = (view) => {
    setActiveView(view);
    if (view !== 'detail') setSelectedNeedId(null);
  };

  const handleSelectNeed = (needId) => {
    setSelectedNeedId(needId);
    setActiveView('detail');
  };

  return (
    <div>
      <Header activeView={activeView} onViewChange={handleViewChange} />
      <main className="main-container">
        {activeView === 'submit' && <SubmitForm />}
        {activeView === 'needs' && <ViewNeeds onSelectNeed={handleSelectNeed} />}
        {activeView === 'detail' && <NeedDetail needId={selectedNeedId} onBack={() => handleViewChange('needs')} />}
        {activeView === 'volunteer' && <VolunteerForm />}
      </main>
    </div>
  );
}