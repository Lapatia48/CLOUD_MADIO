import React from 'react';
import { Route, Redirect, RouteProps } from 'react-router-dom';
import { getUser } from '../services/storage';

interface ProtectedRouteProps extends RouteProps {
  component: React.ComponentType<any>;
  allowedRoles?: string[];
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ 
  component: Component, 
  allowedRoles,
  ...rest 
}) => {
  const user = getUser();

  return (
    <Route
      {...rest}
      render={(props) => {
        if (!user) {
          return <Redirect to="/login" />;
        }
        if (allowedRoles && !allowedRoles.includes(user.role)) {
          return <Redirect to="/" />;
        }
        return <Component {...props} />;
      }}
    />
  );
};

export default ProtectedRoute;
