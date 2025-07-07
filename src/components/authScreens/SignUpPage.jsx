
import AuthWrapper from './auth/AuthWrapper';
import SignUp from './auth/Register';

export default function SignUpPage() {
  return (
    <AuthWrapper>
      <SignUp />
    </AuthWrapper>
  );    
}