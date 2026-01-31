import { IonApp, IonRouterOutlet, setupIonicReact } from '@ionic/react';
import { IonReactRouter } from '@ionic/react-router';
import { Route, Redirect } from 'react-router-dom';

/* Core CSS */
import '@ionic/react/css/core.css';
import '@ionic/react/css/normalize.css';
import '@ionic/react/css/structure.css';
import '@ionic/react/css/typography.css';
import '@ionic/react/css/padding.css';
import '@ionic/react/css/float-elements.css';
import '@ionic/react/css/text-alignment.css';
import '@ionic/react/css/text-transformation.css';
import '@ionic/react/css/flex-utils.css';
import '@ionic/react/css/display.css';

import './theme/variables.css';
import './theme/global.css';

import MainPage from './pages/MainPage';
import LoginPage from './pages/LoginPage';
import SignalementCreatePage from './pages/SignalementCreatePage';
import SignalementDetailPage from './pages/SignalementDetailPage';
import AdminDashboardPage from './pages/AdminDashboardPage';
import BlockedUsersPage from './pages/BlockedUsersPage';
import ProtectedRoute from './components/ProtectedRoute';

setupIonicReact();

const App: React.FC = () => (
  <IonApp>
    <IonReactRouter>
      <IonRouterOutlet>
        {/* Page principale - accessible à tous */}
        <Route exact path="/" component={MainPage} />
        
        {/* Auth - seulement connexion sur mobile */}
        <Route exact path="/login" component={LoginPage} />

        {/* Routes protégées - User */}
        <ProtectedRoute exact path="/signalement/new" component={SignalementCreatePage} />
        <ProtectedRoute exact path="/signalement/:id" component={SignalementDetailPage} />

        {/* Routes Admin */}
        <ProtectedRoute exact path="/admin" component={AdminDashboardPage} allowedRoles={['ADMIN', 'MANAGER']} />
        <ProtectedRoute exact path="/admin/blocked-users" component={BlockedUsersPage} allowedRoles={['ADMIN', 'MANAGER']} />
        
        <Route render={() => <Redirect to="/" />} />
      </IonRouterOutlet>
    </IonReactRouter>
  </IonApp>
);

export default App;
