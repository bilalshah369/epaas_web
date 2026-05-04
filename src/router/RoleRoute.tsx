import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '@/store/authStore';

interface Props {
  // One or more allowed role codes (e.g. 'NodalOfficerA')
  roles: string[];
}

export default function RoleRoute({ roles }: Props) {
  const { user } = useAuthStore();

  if (!user || !roles.includes(user.roleCode)) {
    return <Navigate to="/unauthorized" replace />;
  }
  return <Outlet />;
}
