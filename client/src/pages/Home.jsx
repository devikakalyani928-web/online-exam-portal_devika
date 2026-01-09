import { Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

const Home = () => {
  const { user } = useAuth();

  return (
    <div>
      <h1>Frontend Running</h1>
      <p>Welcome to the Online Exam Portal demo.</p>
      {!user && (
        <div style={{ display: 'flex', gap: '1rem' }}>
          <Link to="/login">Login</Link>
          <Link to="/register">Register</Link>
        </div>
      )}
    </div>
  );
};

export default Home;

