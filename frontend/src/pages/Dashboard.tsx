import { BookOpen, FileText, Loader2, Plus, Sparkles, TrendingUp, Youtube } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { UpgradeBanner } from "@/components/UpgradeBanner"
import { UploadModal } from "@/components/UploadModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCardStats } from "@/hooks/useCards"
import { useMaterials } from "@/hooks/useMaterials"
import { useSubscription } from "@/hooks/useSubscription"
import type { Material } from "@/lib/api"
import { cn } from "@/lib/utils"

function StatCard({
  label,
  value,
  icon: Icon,
  color,
  delay,
}: {
  label: string
  value: number | string
  icon: React.ElementType
  color: string
  delay: number
}) {
  return (
    <Card
      className="card-interactive overflow-hidden"
      style={{ animationDelay: `${delay}ms` }}
    >
      <CardHeader className="pb-2">
        <div className="flex items-center justify-between">
          <CardDescription className="text-sm font-medium">{label}</CardDescription>
          <div className={cn("p-2 rounded-lg", color)}>
            <Icon className="h-4 w-4" />
          </div>
        </div>
        <CardTitle className="text-3xl font-bold tracking-tight">{value}</CardTitle>
      </CardHeader>
    </Card>
  )
}

function MaterialCard({ material, index }: { material: Material; index: number }) {
  const statusConfig = {
    pending: { badge: "badge badge-warning", label: "Pending" },
    processing: { badge: "badge badge-info", label: "Processing..." },
    completed: { badge: "badge badge-success", label: "Ready" },
    failed: { badge: "badge badge-destructive", label: "Failed" },
  }

  const config = statusConfig[material.processing_status]

  return (
    <Link
      to={`/material/${material.id}`}
      className="block"
      style={{ animationDelay: `${index * 60}ms` }}
    >
      <Card className="card-interactive h-full">
        <CardHeader className="pb-3">
          <div className="flex items-start justify-between gap-3">
            <div className="flex items-center gap-3 min-w-0">
              <div
                className={cn(
                  "flex-shrink-0 p-2 rounded-lg",
                  material.source_type === "youtube"
                    ? "bg-red-50 dark:bg-red-950"
                    : "bg-indigo-50 dark:bg-indigo-950"
                )}
              >
                {material.source_type === "youtube" ? (
                  <Youtube className="h-4 w-4 text-red-500" />
                ) : (
                  <FileText className="h-4 w-4 text-indigo-500" />
                )}
              </div>
              <CardTitle className="text-base font-semibold line-clamp-2 leading-tight">
                {material.title}
              </CardTitle>
            </div>
          </div>
        </CardHeader>
        <CardContent className="pt-0">
          <div className="flex items-center justify-between">
            <CardDescription className="text-xs">
              {new Date(material.created_at).toLocaleDateString(undefined, {
                month: "short",
                day: "numeric",
                year: "numeric",
              })}
            </CardDescription>
            <span className={config.badge}>{config.label}</span>
          </div>
        </CardContent>
      </Card>
    </Link>
  )
}

export function Dashboard() {
  const [showUpload, setShowUpload] = useState(false)
  const { data: materials, isLoading: materialsLoading } = useMaterials()
  const { data: stats, isLoading: statsLoading } = useCardStats()
  const { data: subscription } = useSubscription()

  const isAtUploadLimit =
    subscription &&
    subscription.tier === "free" &&
    subscription.uploads_this_week >= subscription.upload_limit

  return (
    <Layout>
      <div className="space-y-8">
        {/* Page Header */}
        <div className="animate-fade-up">
          <h1 className="page-title">Dashboard</h1>
          <p className="page-subtitle">Track your learning progress</p>
        </div>

      <div className="space-y-6">
        {/* Upgrade Banner */}
        {isAtUploadLimit && <UpgradeBanner variant="upload" />}

        {/* Stats Section */}
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4 stagger-children">
          {statCards.map((stat, index) => (
            <StatCard
              key={stat.label}
              label={stat.label}
              value={stat.value}
              icon={stat.icon}
              color={stat.color}
              delay={index * 60}
            />
          ))}
        </div>

        {/* Quick Actions */}
        <div
          className="flex flex-wrap gap-3 animate-fade-up"
          style={{ animationDelay: "200ms" }}
        >
          <Button onClick={() => setShowUpload(true)} className="hover-scale">
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
          {stats && stats.due_for_review > 0 && (
            <Link to="/study">
              <Button variant="secondary" className="hover-scale">
                <BookOpen className="h-4 w-4 mr-2" />
                Study ({stats.due_for_review} cards)
              </Button>
            </Link>
          )}
        </div>

        {/* Materials List */}
        <div
          className="animate-fade-up"
          style={{ animationDelay: "300ms" }}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className="text-xl font-semibold tracking-tight">Recent Content</h2>
            {materials && materials.length > 0 && (
              <Link
                to="/library"
                className="text-sm text-muted-foreground hover:text-foreground transition-colors"
              >
                View all
              </Link>
            )}
          </div>

          {materialsLoading ? (
            <div className="flex flex-col items-center justify-center py-16">
              <Loader2 className="h-8 w-8 animate-spin text-primary mb-3" />
              <p className="text-sm text-muted-foreground">Loading your content...</p>
            </div>
          ) : materials && materials.length > 0 ? (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 stagger-children">
              {materials.slice(0, 6).map((material, index) => (
                <MaterialCard key={material.id} material={material} index={index} />
              ))}
            </div>
          ) : (
            <Card className="border-dashed">
              <CardContent className="flex flex-col items-center justify-center py-16">
                <div className="p-4 rounded-full bg-muted mb-4">
                  <BookOpen className="h-8 w-8 text-muted-foreground" />
                </div>
                <h3 className="text-lg font-semibold mb-2">No content yet</h3>
                <p className="text-muted-foreground text-center mb-6 max-w-sm">
                  Add your first YouTube video or document to start learning with AI-generated flashcards
                </p>
                <Button onClick={() => setShowUpload(true)} className="hover-scale">
                  <Plus className="h-4 w-4 mr-2" />
                  Add Your First Content
                </Button>
              </CardContent>
            </Card>
          )}
        </div>
      </div>

      {/* Upload Modal */}
      {showUpload && <UploadModal onClose={() => setShowUpload(false)} />}
    </Layout>
  )
}
