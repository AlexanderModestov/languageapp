import { BookOpen, FileText, Loader2, Plus, Youtube } from "lucide-react"
import { useState } from "react"
import { Link } from "react-router-dom"

import { Layout } from "@/components/Layout"
import { UploadModal } from "@/components/UploadModal"
import { Button } from "@/components/ui/button"
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card"
import { useCardStats } from "@/hooks/useCards"
import { useMaterials } from "@/hooks/useMaterials"
import type { Material } from "@/lib/api"
import { cn } from "@/lib/utils"

function MaterialCard({ material }: { material: Material }) {
  const statusColors = {
    pending: "bg-yellow-100 text-yellow-800",
    processing: "bg-blue-100 text-blue-800",
    completed: "bg-green-100 text-green-800",
    failed: "bg-red-100 text-red-800",
  }

  const statusLabels = {
    pending: "Pending",
    processing: "Processing...",
    completed: "Ready",
    failed: "Failed",
  }

  return (
    <Link to={`/material/${material.id}`}>
      <Card className="hover:shadow-md transition-shadow cursor-pointer">
        <CardHeader className="pb-2">
          <div className="flex items-start justify-between">
            <div className="flex items-center gap-2">
              {material.source_type === "youtube" ? (
                <Youtube className="h-5 w-5 text-red-500" />
              ) : (
                <FileText className="h-5 w-5 text-blue-500" />
              )}
              <CardTitle className="text-lg line-clamp-1">{material.title}</CardTitle>
            </div>
            <span
              className={cn(
                "text-xs font-medium px-2 py-1 rounded-full",
                statusColors[material.processing_status]
              )}
            >
              {statusLabels[material.processing_status]}
            </span>
          </div>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-xs">
            Added {new Date(material.created_at).toLocaleDateString()}
          </CardDescription>
        </CardContent>
      </Card>
    </Link>
  )
}

export function Dashboard() {
  const [showUpload, setShowUpload] = useState(false)
  const { data: materials, isLoading: materialsLoading } = useMaterials()
  const { data: stats, isLoading: statsLoading } = useCardStats()

  return (
    <Layout>
      <div className="space-y-6">
        {/* Stats Section */}
        <div className="grid gap-4 md:grid-cols-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Total Cards</CardDescription>
              <CardTitle className="text-3xl">
                {statsLoading ? "-" : stats?.total_cards ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Due for Review</CardDescription>
              <CardTitle className="text-3xl text-orange-600">
                {statsLoading ? "-" : stats?.due_for_review ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Learning</CardDescription>
              <CardTitle className="text-3xl text-blue-600">
                {statsLoading ? "-" : stats?.learning ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Mastered</CardDescription>
              <CardTitle className="text-3xl text-green-600">
                {statsLoading ? "-" : stats?.mastered ?? 0}
              </CardTitle>
            </CardHeader>
          </Card>
        </div>

        {/* Quick Actions */}
        <div className="flex gap-4">
          <Button onClick={() => setShowUpload(true)}>
            <Plus className="h-4 w-4 mr-2" />
            Add Content
          </Button>
          {stats && stats.due_for_review > 0 && (
            <Link to="/study">
              <Button variant="secondary">
                <BookOpen className="h-4 w-4 mr-2" />
                Study ({stats.due_for_review} cards)
              </Button>
            </Link>
          )}
        </div>

        {/* Materials List */}
        <div>
          <h2 className="text-xl font-semibold mb-4">Recent Content</h2>
          {materialsLoading ? (
            <div className="flex justify-center py-8">
              <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
            </div>
          ) : materials && materials.length > 0 ? (
            <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-3">
              {materials.map((material) => (
                <MaterialCard key={material.id} material={material} />
              ))}
            </div>
          ) : (
            <Card>
              <CardContent className="flex flex-col items-center justify-center py-12">
                <BookOpen className="h-12 w-12 text-muted-foreground mb-4" />
                <h3 className="text-lg font-medium mb-2">No content yet</h3>
                <p className="text-muted-foreground text-center mb-4">
                  Add your first YouTube video or document to start learning
                </p>
                <Button onClick={() => setShowUpload(true)}>
                  <Plus className="h-4 w-4 mr-2" />
                  Add Content
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
