
import AuthWrapper from './AuthWrapper';
import Login from './Login';

export default function LoginPage() {
  return (
    <div className="w-full">
      <AuthWrapper>
        <Login />
      </AuthWrapper>
    </div>
  );
}