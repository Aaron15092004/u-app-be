import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import { Toaster } from '@/components/ui/sonner';
import { QueryProvider } from '@/providers/QueryProvider';
import { ProtectedRoute } from '@/components/layout/ProtectedRoute';
import { AppShell } from '@/components/layout/AppShell';
import { LoginPage } from '@/pages/LoginPage';

// CRUD pages — implemented in Plan 04
// Imported lazily here so Plan 03 compiles without them
import { lazy, Suspense } from 'react';
const DashboardPage = lazy(() => import('@/pages/DashboardPage').then((m) => ({ default: m.DashboardPage })));
const ExercisesPage = lazy(() => import('@/pages/ExercisesPage').then((m) => ({ default: m.ExercisesPage })));
const FoodItemsPage = lazy(() => import('@/pages/FoodItemsPage').then((m) => ({ default: m.FoodItemsPage })));
const UsersPage = lazy(() => import('@/pages/UsersPage').then((m) => ({ default: m.UsersPage })));
const ProgramsPage = lazy(() => import('@/pages/ProgramsPage').then((m) => ({ default: m.ProgramsPage })));
const CampaignsPage = lazy(() => import('@/pages/CampaignsPage').then((m) => ({ default: m.CampaignsPage })));
const RatingsPage = lazy(() => import('@/pages/RatingsPage').then((m) => ({ default: m.RatingsPage })));
const MilkContentPage = lazy(() => import('@/pages/MilkContentPage').then((m) => ({ default: m.MilkContentPage })));

export default function App() {
  return (
    <QueryProvider>
      <HashRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route index element={<Navigate to="/dashboard" replace />} />
              <Route
                path="dashboard"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <DashboardPage />
                  </Suspense>
                }
              />
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
              <Route
                path="programs"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <ProgramsPage />
                  </Suspense>
                }
              />
              <Route
                path="campaigns"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <CampaignsPage />
                  </Suspense>
                }
              />
              <Route
                path="ratings"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <RatingsPage />
                  </Suspense>
                }
              />
              <Route
                path="milk-content"
                element={
                  <Suspense fallback={<div className="p-8 text-muted-foreground">Đang tải...</div>}>
                    <MilkContentPage />
                  </Suspense>
                }
              />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
        <Toaster />
      </HashRouter>
    </QueryProvider>
  );
}
