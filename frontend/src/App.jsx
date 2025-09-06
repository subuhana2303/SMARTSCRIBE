const { BrowserRouter, Routes, Route } = ReactRouterDOM;

function App() {
  // Get components from window (loaded by previous scripts)
  const { ThemeProvider } = window.ThemeContext;
  const { AuthProvider } = window.useAuth;
  const { Landing } = window.Landing;
  const { Auth } = window.Auth;
  const { Dashboard } = window.Dashboard;
  const { Upload } = window.Upload;
  const { Content } = window.Content;
  const { Quiz } = window.Quiz;
  const { Analytics } = window.Analytics;
  const { Layout } = window.Layout;
  const { ProtectedRoute } = window.ProtectedRoute;

  return (
    <ThemeProvider>
      <AuthProvider>
        <BrowserRouter>
          <div className="min-h-screen bg-white dark:bg-gray-900 transition-colors">
            <Routes>
              <Route path="/" element={<Landing />} />
              <Route path="/auth" element={<Auth />} />
              <Route path="/app" element={
                <ProtectedRoute>
                  <Layout>
                    <Dashboard />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/upload" element={
                <ProtectedRoute>
                  <Layout>
                    <Upload />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/content/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Content />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/quiz/:id" element={
                <ProtectedRoute>
                  <Layout>
                    <Quiz />
                  </Layout>
                </ProtectedRoute>
              } />
              <Route path="/analytics" element={
                <ProtectedRoute>
                  <Layout>
                    <Analytics />
                  </Layout>
                </ProtectedRoute>
              } />
            </Routes>
          </div>
        </BrowserRouter>
      </AuthProvider>
    </ThemeProvider>
  );
}

window.App = App;
