// Map user roles to their dashboard routes
export const getDashboardRoute = (role) => {
  const roleRoutes = {
    'System Admin': '/admin',
    'Exam Manager': '/exam-manager',
    'Question Manager': '/question-manager',
    'Result Manager': '/result-manager',
    'Student': '/student',
  };
  return roleRoutes[role] || '/';
};
