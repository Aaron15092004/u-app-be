import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';

// CRUD pages — implemented in Plan 04
// Imported lazily here so Plan 03 compiles without them
import { lazy, Suspense } from 'react';
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage })));
const FoodItemsPage = lazy(() => import('@/pages/FoodItemsPage').then((m) => ({ default: m.FoodItemsPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));

export default function App() {
  return (
    <QueryProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/exercises" replace />} />
              <Route
                path="exercises"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <ExercisesPage />
                  </Suspense>
                }
              />
              <Route
                path="food-items"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <FoodItemsPage />
                  </Suspense>
                }
              />
              <Route
                path="users"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <UsersPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </BrowserRouter>
    </QueryProvider>
  );
}
