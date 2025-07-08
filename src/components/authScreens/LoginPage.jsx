
import AuthWrapper from './auth/AuthWrapper';
import Login from './auth/Login';

export default function LoginPage() {
  return (
    <div className="w-full h-full">
      <AuthWrapper>
        <Login />
      </AuthWrapper>
    </div>
  );
}