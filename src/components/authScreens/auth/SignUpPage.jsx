
import AuthWrapper from './AuthWrapper';
import SignUp from './Register';

export default function SignUpPage() {
  return (
    <AuthWrapper>
      <SignUp />
    </AuthWrapper>
  );    
}